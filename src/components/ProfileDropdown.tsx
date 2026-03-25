import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LogOut, User, Camera, Save, X, ChevronDown } from "lucide-react";

const ProfileDropdown: React.FC = () => {
  const { userProfile, logout, updateUserProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: userProfile?.firstName ?? "",
    lastName: userProfile?.lastName ?? "",
    position: userProfile?.position ?? "",
    photoURL: userProfile?.photoURL ?? "",
  });
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userProfile) {
      setForm({
        firstName: userProfile.firstName ?? "",
        lastName: userProfile.lastName ?? "",
        position: userProfile.position ?? "",
        photoURL: userProfile.photoURL ?? "",
      });
    }
  }, [userProfile]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await updateUserProfile(form);
    setSaving(false);
    setEditing(false);
  };

  if (!userProfile) return null;

  const initials = `${userProfile.firstName?.[0] ?? ""}${userProfile.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="relative" ref={ref}>
      {/* Avatar trigger */}
      <button
        onClick={() => { setOpen((v) => !v); setEditing(false); }}
        className="flex items-center gap-2 rounded-xl hover:bg-slate-100 px-2 py-1.5 transition"
      >
        {userProfile.photoURL ? (
          <img
            src={userProfile.photoURL}
            alt={initials}
            className="w-8 h-8 rounded-full object-cover border-2 border-blue-200"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
          {userProfile.firstName}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          {!editing ? (
            <>
              {/* Profile summary */}
              <div className="p-5 flex items-center gap-4 bg-gradient-to-br from-slate-50 to-blue-50 border-b border-slate-100">
                {userProfile.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={initials}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold shadow">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">
                    {userProfile.firstName} {userProfile.lastName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{userProfile.email}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{userProfile.position || "—"}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {userProfile.role?.map((r) => (
                      <span key={r} className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={() => setEditing(true)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  <User size={16} className="text-slate-400" /> แก้ไขโปรไฟล์
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition"
                >
                  <LogOut size={16} /> ออกจากระบบ
                </button>
              </div>
            </>
          ) : (
            /* Edit profile form */
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-slate-800 text-sm">แก้ไขโปรไฟล์</h3>
                <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>

              {/* Photo URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                  <Camera size={12} /> URL รูปโปรไฟล์
                </label>
                <input
                  type="text"
                  value={form.photoURL}
                  onChange={(e) => setForm((p) => ({ ...p, photoURL: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">ชื่อ</label>
                  <input
                    value={form.firstName}
                    onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">นามสกุล</label>
                  <input
                    value={form.lastName}
                    onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">ตำแหน่ง</label>
                <input
                  value={form.position}
                  onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2 rounded-xl text-sm transition"
                >
                  <Save size={14} /> {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-xl text-sm transition"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
