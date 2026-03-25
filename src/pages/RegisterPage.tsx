import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Building2, Mail, Lock, User, Briefcase, AlertCircle, Chrome } from "lucide-react";

const RegisterPage: React.FC = () => {
  const { registerWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "", lastName: "", position: "", email: "", password: "", confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("รหัสผ่านไม่ตรงกัน"); return; }
    if (form.password.length < 6) { setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"); return; }
    setLoading(true);
    try {
      const profile = await registerWithEmail(form.email, form.password, form.firstName, form.lastName, form.position);
      if (profile.status === "approved") navigate("/", { replace: true });
      else navigate("/pending", { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code.includes("email-already-in-use")) setError("อีเมลนี้ถูกใช้งานแล้ว");
      else setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoadingGoogle(true);
    try {
      const profile = await loginWithGoogle();
      if (profile.status === "approved") navigate("/", { replace: true });
      else navigate("/pending", { replace: true });
    } catch {
      setError("เกิดข้อผิดพลาดในการสมัครด้วย Google");
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-xl shadow-blue-900/40 mb-4">
            <Building2 size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">CMG<span className="text-blue-400">BID</span></h1>
          <p className="text-slate-400 text-sm mt-1">สมัครสมาชิกเพื่อเข้าใช้งาน</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">สร้างบัญชีใหม่</h2>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">ชื่อ *</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required value={form.firstName} onChange={set("firstName")}
                    className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="ชื่อ" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">นามสกุล *</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required value={form.lastName} onChange={set("lastName")}
                    className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="นามสกุล" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">ตำแหน่ง</label>
              <div className="relative">
                <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={form.position} onChange={set("position")}
                  className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="ตำแหน่งงาน" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">อีเมล *</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" required value={form.email} onChange={set("email")}
                  className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="example@email.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">รหัสผ่าน *</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="password" required value={form.password} onChange={set("password")}
                    className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="อย่างน้อย 6 ตัว" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">ยืนยันรหัสผ่าน *</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="password" required value={form.confirm} onChange={set("confirm")}
                    className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="ยืนยันรหัสผ่าน" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition shadow-sm mt-2">
              {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400 font-medium">หรือ</span></div>
          </div>

          <button onClick={handleGoogle} disabled={loadingGoogle}
            className="w-full flex items-center justify-center gap-2.5 border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-slate-700 font-medium py-2.5 rounded-xl transition text-sm">
            <Chrome size={18} className="text-blue-500" />
            {loadingGoogle ? "กำลังเชื่อมต่อ..." : "สมัครด้วย Google"}
          </button>

          <p className="text-center text-sm text-slate-500 mt-6">
            มีบัญชีแล้ว?{" "}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">เข้าสู่ระบบ</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
