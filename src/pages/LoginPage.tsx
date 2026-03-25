import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Building2, Mail, Lock, AlertCircle, Chrome } from "lucide-react";

const LoginPage: React.FC = () => {
  const { loginWithEmail, loginWithGoogle, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  // Redirect once profile is loaded
  useEffect(() => {
    if (!userProfile) return;
    if (userProfile.status === "pending") { navigate("/pending", { replace: true }); return; }
    if (userProfile.status === "rejected") { setError("บัญชีของคุณถูกปฏิเสธการเข้าใช้งาน กรุณาติดต่อผู้ดูแลระบบ"); return; }
    if (userProfile.status === "approved") { navigate(from, { replace: true }); }
  }, [userProfile, navigate, from]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoadingEmail(true);
    try {
      await loginWithEmail(email, password);
      await refreshProfile();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      } else {
        setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoadingGoogle(true);
    try {
      await loginWithGoogle();
      await refreshProfile();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code.includes("popup-closed")) {
        setError("ปิดหน้าต่าง Google ก่อนดำเนินการเสร็จ");
      } else if (code.includes("unauthorized-domain")) {
        setError("โดเมนนี้ไม่ได้รับอนุญาตใน Firebase");
      } else {
        setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google");
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-xl shadow-blue-900/40 mb-4">
            <Building2 size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            CMG<span className="text-blue-400">BID</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Multi-Project Bidding Tracker</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">เข้าสู่ระบบ</h2>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEmail} className="space-y-4 mb-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">อีเมล</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="example@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">รหัสผ่าน</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="รหัสผ่าน"
                />
              </div>
            </div>
            <button
              type="submit" disabled={loadingEmail}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition shadow-sm shadow-blue-200"
            >
              {loadingEmail ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-slate-400 font-medium">หรือ</span>
            </div>
          </div>

          <button
            onClick={handleGoogle} disabled={loadingGoogle}
            className="w-full flex items-center justify-center gap-2.5 border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-slate-700 font-medium py-2.5 rounded-xl transition text-sm"
          >
            <Chrome size={18} className="text-blue-500" />
            {loadingGoogle ? "กำลังเชื่อมต่อ..." : "เข้าสู่ระบบด้วย Google"}
          </button>

          <p className="text-center text-sm text-slate-500 mt-6">
            ยังไม่มีบัญชี?{" "}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              สมัครสมาชิก
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
