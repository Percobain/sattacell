import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { Clarity } from "./components/Clarity";
import { Home } from "./pages/Home";
import { MarketPage } from "./pages/MarketPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AdminPage } from "./pages/AdminPage";
import { AuthCallback } from "./pages/AuthCallback";
import TargetCursor from "./components/ui/TargetCursor";

function App() {
  return (
    <Router>
      <TargetCursor
        spinDuration={2}
        hideDefaultCursor={true}
        parallaxOn={true}
      />
      <div className="min-h-screen bg-background noise cyber-grid relative overflow-hidden">
        {/* Subtle ambient glow effects */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-red/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto p-6 relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/markets/:id" element={<MarketPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
        </div>
      </div>
      <Analytics />
      <Clarity />
    </Router>
  );
}

export default App;