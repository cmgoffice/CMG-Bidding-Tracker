import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Building2, Clock, LogOut } from "lucide-react";

const PendingPage: React.FC = () => {
  const { userProfile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-xl shadow-blue-900/40 mb-6">
          <Building2 size={30} className="text-white" />
        </div>
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 p-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-yellow-100 mx-auto mb-4">
            <Clock size={28} className="text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">รอการอนุมัติ</h2>
          <p className="text-slate-500 text-sm mb-2">
            บัญชีของคุณกำลังรอการอนุมัติจากผู้ดูแลระบบ
          </p>
          {userProfile && (
            <p className="text-slate-400 text-xs mb-6">
              {userProfile.firstName} {userProfile.lastName} · {userProfile.email}
            </p>
          )}
          <p className="text-slate-400 text-xs mb-6">
            กรุณาติดต่อ MasterAdmin เพื่อขออนุมัติการเข้าใช้งาน
          </p>
          <button
            onClick={logout}
            className="flex items-center gap-2 mx-auto text-sm text-slate-500 hover:text-red-500 transition"
          >
            <LogOut size={15} /> ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingPage;
