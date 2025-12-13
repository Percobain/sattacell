import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { Clarity } from "./components/Clarity";
import { Home } from "./pages/Home";
import { MarketPage } from "./pages/MarketPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AdminPage } from "./pages/AdminPage";
import { AuthCallback } from "./pages/AuthCallback";
import TargetCursor from "./components/ui/TargetCursor";
import Dither from "./components/ui/Dither";

function App() {
  return (
    <Router>
      <TargetCursor
        spinDuration={2}
        hideDefaultCursor={true}
        parallaxOn={true}
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

      <div className="min-h-screen relative overflow-hidden z-10 flex flex-col">
        <div className="container mx-auto p-6 relative flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/markets/:id" element={<MarketPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="py-6 text-center border-t border-primary/20">
          <p className="text-sm text-muted-foreground font-mono">
            made with <span className="text-red-500">❤</span> by{' '}
            <span className="text-primary">NGM</span> •{' '}
            <span className="text-primary">GNG</span> •{' '}
            <span className="text-primary">KRT</span> •{' '}
            <span className="text-primary">BNG</span>
          </p>
        </footer>
      </div>
      <Analytics />
      <Clarity />
    </Router>
  );
}

export default App;