import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, userData, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && userData && !userData.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
