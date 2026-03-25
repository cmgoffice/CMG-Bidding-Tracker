import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "../contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  requireApproved?: boolean;
  requireRoles?: UserRole[];
}

const ProtectedRoute: React.FC<Props> = ({
  children,
  requireApproved = true,
  requireRoles,
}) => {
  const { firebaseUser, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          </div>
          <p className="text-slate-500 text-sm font-medium">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          </div>
          <p className="text-slate-500 text-sm font-medium">กำลังโหลดข้อมูลผู้ใช้...</p>
        </div>
      </div>
    );
  }

  if (requireApproved && userProfile.status === "pending") {
    return <Navigate to="/pending" replace />;
  }

  if (requireApproved && userProfile.status === "rejected") {
    return <Navigate to="/login" replace />;
  }

  if (requireRoles && !userProfile.role.some((r) => requireRoles.includes(r))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
