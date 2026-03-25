import React, { useEffect, useState } from "react";
import {
  collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy,
} from "firebase/firestore";
import { db, APP_NAME } from "../firebase";
import { useAuth, UserProfile, UserRole, ALL_ROLES } from "../contexts/AuthContext";
import {
  Users, CheckCircle2, XCircle, Clock, Trash2, Edit, Shield, Search, RefreshCw,
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  pending:  "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-700",
};

const UserManagementView: React.FC = () => {
  const { userProfile: myProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editRoles, setEditRoles] = useState<UserRole[]>([]);
  const [editStatus, setEditStatus] = useState<UserProfile["status"]>("pending");
  const [editPosition, setEditPosition] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const col = collection(db, APP_NAME, "root", "users");
    const q = query(col, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => ({ ...d.data(), uid: d.id } as UserProfile)));
    });
    return unsub;
  }, []);

  const filtered = users.filter((u) => {
    const s = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(s) ||
      u.firstName.toLowerCase().includes(s) ||
      u.lastName.toLowerCase().includes(s)
    );
  });

  const startEdit = (u: UserProfile) => {
    setEditingUid(u.uid);
    setEditRoles([...u.role]);
    setEditStatus(u.status);
    setEditPosition(u.position ?? "");
  };

  const cancelEdit = () => setEditingUid(null);

  const saveEdit = async (uid: string) => {
    setSaving(true);
    await updateDoc(doc(db, APP_NAME, "root", "users", uid), {
      role: editRoles,
      status: editStatus,
      position: editPosition,
    });
    setSaving(false);
    setEditingUid(null);
  };

  const toggleRole = (role: UserRole) => {
    setEditRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const quickApprove = async (uid: string) => {
    await updateDoc(doc(db, APP_NAME, "root", "users", uid), { status: "approved" });
  };

  const quickReject = async (uid: string) => {
    await updateDoc(doc(db, APP_NAME, "root", "users", uid), { status: "rejected" });
  };

  const handleDelete = async (uid: string, email: string) => {
    if (!window.confirm(`ลบผู้ใช้ ${email} ออกจากระบบ?`)) return;
    await deleteDoc(doc(db, APP_NAME, "root", "users", uid));
  };

  const pending = users.filter((u) => u.status === "pending");
  const approved = users.filter((u) => u.status === "approved");
  const rejected = users.filter((u) => u.status === "rejected");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Shield size={22} className="text-blue-600" /> จัดการผู้ใช้งาน
        </h2>
        <div className="flex gap-3 flex-wrap text-sm">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full font-semibold border border-green-200">
            <CheckCircle2 size={14} /> อนุมัติแล้ว {approved.length}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full font-semibold border border-yellow-200">
            <Clock size={14} /> รออนุมัติ {pending.length}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-full font-semibold border border-red-200">
            <XCircle size={14} /> ปฏิเสธ {rejected.length}
          </span>
        </div>
      </div>

      {/* Pending banner */}
      {pending.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 flex items-center gap-3 text-sm text-yellow-800">
          <Clock size={16} className="text-yellow-600 shrink-0" />
          <span>มี <strong>{pending.length}</strong> คนรอการอนุมัติเข้าสู่ระบบ</span>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text" placeholder="ค้นหาชื่อหรืออีเมล..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* User table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 text-left font-semibold">ผู้ใช้</th>
                <th className="px-4 py-3 text-left font-semibold">ตำแหน่ง</th>
                <th className="px-4 py-3 text-left font-semibold">สิทธิ์ (Role)</th>
                <th className="px-4 py-3 text-center font-semibold">สถานะ</th>
                <th className="px-4 py-3 text-center font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isMe = u.uid === myProfile?.uid;
                const isEditing = editingUid === u.uid;
                return (
                  <tr key={u.uid} className={`border-b border-slate-100 last:border-0 transition-colors ${isEditing ? "bg-blue-50/50" : "hover:bg-slate-50"}`}>
                    {/* User info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">
                            {u.firstName} {u.lastName}
                            {isMe && <span className="ml-1.5 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">คุณ</span>}
                          </p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Position */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          value={editPosition} onChange={(e) => setEditPosition(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      ) : (
                        <span className="text-slate-600">{u.position || "—"}</span>
                      )}
                    </td>

                    {/* Roles */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex flex-wrap gap-1.5">
                          {ALL_ROLES.map((r) => (
                            <button
                              key={r}
                              onClick={() => toggleRole(r)}
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition ${editRoles.includes(r)
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-500 border-slate-300 hover:border-blue-400"
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {u.role?.map((r) => (
                            <span key={r} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-full border border-blue-100">
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as UserProfile["status"])}
                          className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="pending">pending</option>
                          <option value="approved">approved</option>
                          <option value="rejected">rejected</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[u.status]}`}>
                          {u.status === "approved" && <CheckCircle2 size={12} />}
                          {u.status === "pending"  && <Clock size={12} />}
                          {u.status === "rejected" && <XCircle size={12} />}
                          {u.status}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(u.uid)}
                              disabled={saving}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1 transition"
                            >
                              <RefreshCw size={12} className={saving ? "animate-spin" : ""} />
                              บันทึก
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition"
                            >
                              ยกเลิก
                            </button>
                          </>
                        ) : (
                          <>
                            {u.status === "pending" && (
                              <>
                                <button
                                  onClick={() => quickApprove(u.uid)}
                                  className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition" title="อนุมัติ"
                                >
                                  <CheckCircle2 size={17} />
                                </button>
                                <button
                                  onClick={() => quickReject(u.uid)}
                                  className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition" title="ปฏิเสธ"
                                >
                                  <XCircle size={17} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => startEdit(u)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="แก้ไข"
                            >
                              <Edit size={17} />
                            </button>
                            {!isMe && (
                              <button
                                onClick={() => handleDelete(u.uid, u.email)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="ลบผู้ใช้"
                              >
                                <Trash2 size={17} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    ไม่พบผู้ใช้งาน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagementView;
