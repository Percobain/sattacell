import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { Clarity } from "./components/Clarity";
import { Home } from "./pages/Home";
import { MarketPage } from "./pages/MarketPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AdminPage } from "./pages/AdminPage";
import { AuthCallback } from "./pages/AuthCallback";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
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