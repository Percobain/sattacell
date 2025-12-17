import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { Clarity } from "./components/Clarity";
import { Home } from "./pages/Home";
import { MarketPage } from "./pages/MarketPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AdminPage } from "./pages/AdminPage";
import { AuthCallback } from "./pages/AuthCallback";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { PendingApprovalPage } from "./pages/PendingApprovalPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import Dither from "./components/ui/Dither";
import Noise from "./components/ui/Noise";
import { useEffect } from "react";
import { io } from "socket.io-client";

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen relative overflow-hidden z-10 flex flex-col">
      <div className={`relative flex-1 ${isAuthenticated ? 'container mx-auto p-4 md:p-6' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/markets/:id" element={
            <ProtectedRoute>
              <MarketPage />
            </ProtectedRoute>
          } />
          <Route path="/markets/:id/analytics" element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/pending-approval" element={<PendingApprovalPage />} />
        </Routes>
      </div>

      {/* Footer - only show when authenticated */}
      {isAuthenticated && (
        <footer className="py-6 text-center border-t border-primary/20">
          <p className="text-sm text-muted-foreground font-mono">
            made with <span className="text-red-500">❤</span> by{' '}
            <span className="text-primary">NGM</span> •{' '}
            <span className="text-primary">GNG</span> •{' '}
            <span className="text-primary">KRT</span> •{' '}
            <span className="text-primary">BNG</span>
          </p>
        </footer>
      )}
    </div>
  );
}

function App() {
  // Global realtime subscription: turn server trade events into the existing
  // window 'tradeCompleted' event so all charts/leaderboards stay in sync.
  useEffect(() => {
    // Avoid creating multiple connections in development StrictMode
    if (window.__sattacellSocket) {
      return;
    }

    // Derive socket URL from the same base URL the REST API uses
    const apiBase =
      import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    const socketUrl = apiBase.replace(/\/api\/?$/, "");

    const socket = io(socketUrl, {
      path: "/socket.io",
      transports: ["websocket"],
    });

    window.__sattacellSocket = socket;

    socket.on("connect", () => {
      console.log("[realtime] connected", socket.id);
    });

    socket.on("trade:executed", (payload) => {
      console.log("[realtime] trade:executed", payload);
      // Broadcast the same custom DOM event existing components already use
      window.dispatchEvent(new CustomEvent("tradeCompleted", { detail: payload }));
    });

    socket.on("disconnect", () => {
      console.log("[realtime] disconnected");
    });

    return () => {
      socket.close();
      window.__sattacellSocket = null;
    };
  }, []);

  return (
    <Router>
      {/* Noise overlay */}
      <Noise
        patternSize={250}
        patternScaleX={1}
        patternScaleY={1}
        patternRefreshInterval={2}
        patternAlpha={15}
      />

      {/* Dither background */}
      <div className="fixed inset-0 z-0 opacity-30">
        <Dither
          waveColor={[0.0, 0.4, 0.5]}
          disableAnimation={false}
          enableMouseInteraction={true}
          mouseRadius={0.3}
          colorNum={4}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.05}
        />
      </div>

      <AppContent />
      <Analytics />
      <Clarity />
    </Router>
  );
}

export default App;