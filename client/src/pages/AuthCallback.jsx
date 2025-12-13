import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function AuthCallback() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        navigate("/");
      } else if (error === 'Account pending approval by admin') {
        navigate("/pending-approval");
      } else {
        // If auth failed for other reasons, redirect to home
        setTimeout(() => navigate("/"), 2000);
      }
    }
  }, [loading, isAuthenticated, error, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-lg font-semibold mb-2">Completing sign in...</div>
        <div className="text-sm text-muted-foreground">Please wait</div>
      </div>
    </div>
  );
}