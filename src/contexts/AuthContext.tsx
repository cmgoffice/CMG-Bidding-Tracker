import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  collection,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db, APP_NAME } from "../firebase";

// ── Role definitions ──────────────────────────────────────────────────────────
export const ALL_ROLES = [
  "MasterAdmin",
  "Admin",
  "BDM",
  "MD",
  "AdminBid",
  "SPB",
  "UVW",
  "Staff",
  "Viewer",
  "Creator",
] as const;

export type UserRole = (typeof ALL_ROLES)[number];

// ── UserProfile interface ─────────────────────────────────────────────────────
export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  position: string;
  role: UserRole[];
  status: "pending" | "approved" | "rejected";
  assignedProjects: string[];
  createdAt: Timestamp;
  photoURL?: string;
  isFirstUser: boolean;
}

export interface AppMetaConfig {
  firstUserRegistered: boolean;
  totalUsers: number;
  createdAt: Timestamp;
}

// ── Firestore path helpers ────────────────────────────────────────────────────
const rootRef = () => doc(db, APP_NAME, "root");
const usersCol = () => collection(db, APP_NAME, "root", "users");
const userRef = (uid: string) => doc(db, APP_NAME, "root", "users", uid);
const appMetaRef = () => doc(db, APP_NAME, "root", "appMeta", "config");
const activityLogCol = () => collection(db, APP_NAME, "root", "activityLogs");

// ── Activity log (non-blocking) ───────────────────────────────────────────────
const logActivity = (
  action: string,
  uid: string,
  email: string,
  extra?: Record<string, unknown>
) => {
  setDoc(doc(activityLogCol()), {
    action,
    uid,
    email,
    ...extra,
    timestamp: serverTimestamp(),
  }).catch(() => {});
};

// ── Context type ──────────────────────────────────────────────────────────────
interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<UserProfile>;
  loginWithGoogle: () => Promise<UserProfile>;
  registerWithEmail: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    position: string
  ) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  pendingCount: number;
  setPendingCount: React.Dispatch<React.SetStateAction<number>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

// ── Fetch profile from Firestore ──────────────────────────────────────────────
const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    // Ensure root doc exists
    const rootSnap = await getDoc(rootRef());
    if (!rootSnap.exists()) {
      await setDoc(rootRef(), { createdAt: serverTimestamp() }).catch(() => {});
    }
    const snap = await getDoc(userRef(uid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch {
    return null;
  }
};

// ── Create profile for new user ───────────────────────────────────────────────
const createUserProfile = async (
  uid: string,
  email: string,
  firstName: string,
  lastName: string,
  position: string,
  photoURL?: string
): Promise<UserProfile> => {
  // Safely detect first user via transaction
  const metaRef = appMetaRef();

  let isFirst = false;
  await runTransaction(db, async (tx) => {
    // ensure root exists
    const rootSnap = await tx.get(rootRef());
    if (!rootSnap.exists()) {
      tx.set(rootRef(), { createdAt: serverTimestamp() });
    }
    const metaSnap = await tx.get(metaRef);
    if (!metaSnap.exists() || !metaSnap.data().firstUserRegistered) {
      isFirst = true;
      tx.set(metaRef, {
        firstUserRegistered: true,
        totalUsers: 1,
        createdAt: serverTimestamp(),
      });
    } else {
      tx.update(metaRef, { totalUsers: (metaSnap.data().totalUsers ?? 0) + 1 });
    }
  });

  const profile: UserProfile = {
    uid,
    email,
    firstName,
    lastName,
    position,
    role: isFirst ? ["MasterAdmin"] : ["Staff"],
    status: isFirst ? "approved" : "pending",
    assignedProjects: [],
    createdAt: Timestamp.now(),
    photoURL: photoURL ?? "",
    isFirstUser: isFirst,
  };

  await setDoc(userRef(uid), profile);
  return profile;
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const profile = await fetchProfile(fbUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (!firebaseUser) return;
    const profile = await fetchProfile(firebaseUser.uid);
    setUserProfile(profile);
  };

  const loginWithEmail = async (
    email: string,
    password: string
  ): Promise<UserProfile> => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profile = await fetchProfile(cred.user.uid);
    if (!profile) throw new Error("user-not-found");
    setUserProfile(profile);
    logActivity("LOGIN", cred.user.uid, email);
    return profile;
  };

  const loginWithGoogle = async (): Promise<UserProfile> => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const fbUser = cred.user;
    let profile = await fetchProfile(fbUser.uid);
    if (!profile) {
      const nameParts = (fbUser.displayName ?? "").split(" ");
      profile = await createUserProfile(
        fbUser.uid,
        fbUser.email ?? "",
        nameParts[0] ?? "",
        nameParts.slice(1).join(" "),
        "",
        fbUser.photoURL ?? ""
      );
      logActivity("REGISTER", fbUser.uid, fbUser.email ?? "", { method: "google" });
    }
    setUserProfile(profile);
    logActivity("LOGIN", fbUser.uid, fbUser.email ?? "", { method: "google" });
    return profile;
  };

  const registerWithEmail = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    position: string
  ): Promise<UserProfile> => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: `${firstName} ${lastName}` });
    const profile = await createUserProfile(
      cred.user.uid,
      email,
      firstName,
      lastName,
      position
    );
    setUserProfile(profile);
    logActivity("REGISTER", cred.user.uid, email, { method: "email" });
    return profile;
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!firebaseUser) return;
    await updateDoc(userRef(firebaseUser.uid), { ...data });
    setUserProfile((prev) => (prev ? { ...prev, ...data } : prev));
    // Sync Firebase display name if name changed
    if (data.firstName || data.lastName) {
      const snap = await getDoc(userRef(firebaseUser.uid));
      const updated = snap.data() as UserProfile;
      await updateProfile(firebaseUser, {
        displayName: `${updated.firstName} ${updated.lastName}`,
        photoURL: data.photoURL ?? firebaseUser.photoURL ?? "",
      }).catch(() => {});
    }
  };

  const hasRole = (roles: UserRole[]) => {
    if (!userProfile) return false;
    return userProfile.role.some((r) => roles.includes(r));
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        loading,
        loginWithEmail,
        loginWithGoogle,
        registerWithEmail,
        logout,
        refreshProfile,
        updateUserProfile,
        hasRole,
        pendingCount,
        setPendingCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { usersCol, userRef };
