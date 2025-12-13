import { useState } from "react";
import { MarketList } from "@/components/markets/MarketList";
import { LoginButton } from "@/components/auth/LoginButton";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "/CodeCell Logo White.png";

import { LandingPage } from "@/pages/LandingPage";

export function Home() {
  const { isAuthenticated, userData } = useAuth();
  const [activeView, setActiveView] = useState("markets"); // Default to markets

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-primary/30 pb-6 gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative">
            <img
              src={logo}
              alt="SattaCell Logo"
              className="h-16 w-16 md:h-24 md:w-24 object-contain"
              style={{ filter: 'brightness(0) saturate(100%) invert(78%) sepia(85%) saturate(1000%) hue-rotate(150deg) brightness(101%) contrast(101%)' }}
            />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-display font-bold text-primary tracking-wider">
              SATTACELL
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-neon-red text-xs font-mono">[01]</span>
              <p className="text-muted-foreground font-mono text-xs md:text-sm">
                // PREDICTION_MARKETS
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          {isAuthenticated && (
            <>
              <div className="text-xs md:text-sm font-mono border border-primary/30 px-3 py-1.5 md:px-4 md:py-2 bg-card/50">
                <div className="text-primary truncate max-w-[120px] md:max-w-none">{userData?.email}</div>
                <div className="text-neon-green text-xs">
                  ¥ {userData?.balance?.toFixed(2)} <span className="text-muted-foreground">TOKENS</span>
                </div>
              </div>
              <Link to="/dashboard">
                <Button variant="neon" size="sm" className="md:size-default">Dashboard</Button>
              </Link>
            </>
          )}
          <Link to="/admin">
            <Button variant="neon-red" size="sm" className="md:size-default">Admin</Button>
          </Link>
          <LoginButton />
        </div>
      </div>

      {/* Data strip - Japanese aesthetic - Hidden on mobile */}
      <div className="hidden md:flex justify-between items-center text-xs font-mono text-muted-foreground border-y border-primary/20 py-2">
        <div className="flex items-center gap-4">
          <span className="text-primary">予測市場</span>
          <span>PN: 2483-AX9</span>
          <span className="text-primary/50">|</span>
          <button
            onClick={() => setActiveView("markets")}
            className={`cursor-pointer hover:text-primary transition-colors ${
              activeView === "markets" ? "text-primary" : ""
            }`}
          >
            ACTIVE PROTOCOL
          </button>
          <span className="text-primary/50">|</span>
          <button
            onClick={() => setActiveView("teams")}
            className={`cursor-pointer hover:text-primary transition-colors ${
              activeView === "teams" ? "text-primary" : ""
            }`}
          >
            TEAMS
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span>BATCH: {new Date().toISOString().split('T')[0]}</span>
          <span className="text-primary/50">|</span>
          <span className="text-neon-red">全頼</span>
        </div>
      </div>

      {/* Markets Section */}
      {activeView === "markets" && (
        <>
          {/* Active Markets */}
          <div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <span className="text-neon-red font-mono text-xs md:text-sm">[02]</span>
              <h2 className="text-xl md:text-2xl font-display font-semibold text-primary">
                ACTIVE MARKETS
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent hidden md:block"></div>
              <span className="text-muted-foreground font-mono text-xs hidden md:inline">アクティブマーケット</span>
            </div>
            <MarketList status="open" />
          </div>

          {/* Closed Markets */}
          <div className="mt-8 md:mt-12">
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <span className="text-neon-red font-mono text-xs md:text-sm">[03]</span>
              <h2 className="text-xl md:text-2xl font-display font-semibold text-primary">
                CLOSED MARKETS
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent hidden md:block"></div>
              <span className="text-muted-foreground font-mono text-xs hidden md:inline">クローズドマーケット</span>
            </div>
            <MarketList status="settled" />
          </div>
        </>
      )}

      {/* Teams Section */}
      {activeView === "teams" && (
        <div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
            <span className="text-neon-red font-mono text-xs md:text-sm">[04]</span>
            <h2 className="text-xl md:text-2xl font-display font-semibold text-primary">
              TEAMS
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent hidden md:block"></div>
            <span className="text-muted-foreground font-mono text-xs hidden md:inline">チームの詳細</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Team 01 */}
          <div className="border border-primary/30 bg-card/50 p-4 md:p-5 hover:border-primary/60 hover:glow-blue transition-all duration-300">
            <div className="flex items-center gap-2 mb-1 pb-2 border-b border-primary/20">
              <span className="text-neon-green font-mono text-xs">[01]</span>
              <h3 className="text-lg font-display text-primary">GADA ELECTRONICS</h3>
            </div>
            <ul className="space-y-1.5 font-mono text-sm">
              <li className="text-foreground/90 flex items-center gap-2">
                <span className="text-primary/50">▸</span> Vinayak Pai
              </li>
              <li className="text-foreground/90 flex items-center gap-2">
                <span className="text-primary/50">▸</span> Dhanya Shukla
              </li>
              <li className="text-foreground/90 flex items-center gap-2">
                <span className="text-primary/50">▸</span> Samaira Sharma
              </li>
            </ul>
          </div>

          {/* Team 02 */}
          <div className="border border-primary/30 bg-card/50 p-4 md:p-5 hover:border-primary/60 hover:glow-blue transition-all duration-300">
            <div className="flex items-center gap-2 mb-1 pb-2 border-b border-primary/20">
              <span className="text-neon-green font-mono text-xs">[02]</span>
              <h3 className="text-lg font-display text-primary">DUKH DARD KASHT PEEDA</h3>
            </div>
            <ul className="space-y-1.5 font-mono text-sm">
              <li className="text-foreground/90 flex items-center gap-2">
                <span className="text-primary/50">▸</span> Tanuj Adarkar
              </li>
              <li className="text-foreground/90 flex items-center gap-2">
                <span className="text-primary/50">▸</span> Parth Panwar
              </li>
              <li className="text-foreground/90 flex items-center gap-2">
                <span className="text-primary/50">▸</span> Divyanshi Yadav
              </li>
            </ul>
          </div>

          {/* Team 03 */}
          <div className="border border-primary/30 bg-card/50 p-4 md:p-5 hover:border-primary/60 hover:glow-blue transition-all duration-300">
            <div className="flex items-center gap-2 mb-1 pb-2 border-b border-primary/20">
              <span className="text-neon-green font-mono text-xs">[03]</span>
              <h3 className="text-lg font-display text-primary">DEVELOPING DIVAS</h3>
            </div>
            <ul className="space-y-1.5 font-mono text-sm">
              <li className="text-foreground/90 flex items-center gap-2">
                <span className="text-primary/50">▸</span> Shantanav Mukherjee
              </li>
              <li className="text-foreground/90 flex items-center gap-2">
                <span className="text-primary/50">▸</span> Purva Pote
              </li>
              <li className="text-foreground/90 flex items-center gap-2">
                <span className="text-primary/50">▸</span> Arshia Dang
              </li>
            </ul>
          </div>

          {/* Team 04 */}
          <div className="border border-primary/30 bg-card/50 p-4 md:p-5 hover:border-primary/60 hover:glow-blue transition-all duration-300">
            <div className="flex items-center gap-2 mb-1 pb-2 border-b border-primary/20">
              <span className="text-neon-green font-mono text-xs">[04]</span>
              <h3 className="text-lg font-display text-primary">TEAM SHIRO</h3>
            </div>
            <ul className="space-y-1.5 font-mono text-sm">
              <li className="text-foreground/90 flex items-center gap-2">
                <span className="text-primary/50">▸</span> Shaurya Srivastava
              </li>
              <li className="text-foreground/90 flex items-center gap-2">
                <span className="text-primary/50">▸</span> Dhruv Kumar
              </li>
              <li className="text-foreground/90 flex items-center gap-2">
                <span className="text-primary/50">▸</span> Rudrakshi Acharyya
              </li>
            </ul>
          </div>

          {/* Team 05 */}
          <div className="border border-primary/30 bg-card/50 p-4 md:p-5 hover:border-primary/60 hover:glow-blue transition-all duration-300">
            <div className="flex items-center gap-2 mb-1 pb-2 border-b border-primary/20">
              <span className="text-neon-green font-mono text-xs">[05]</span>
              <h3 className="text-lg font-display text-primary">TEAM ANYHOW</h3>
            </div>
            <ul className="space-y-1.5 font-mono text-sm">
              <li className="text-foreground/90 flex items-center gap-2">
                <span className="text-primary/50">▸</span> Samagra Agarwal
              </li>
              <li className="text-foreground/90 flex items-center gap-2">
                <span className="text-primary/50">▸</span> Srushti Talandage
              </li>
              <li className="text-foreground/90 flex items-center gap-2">
                <span className="text-primary/50">▸</span> Bhoumik Sangle
              </li>
            </ul>
          </div>

          {/* Team 06 */}
          <div className="border border-primary/30 bg-card/50 p-4 md:p-5 hover:border-primary/60 hover:glow-blue transition-all duration-300">
            <div className="flex items-center gap-2 mb-1 pb-2 border-b border-primary/20">
              <span className="text-neon-green font-mono text-xs">[06]</span>
              <h3 className="text-lg font-display text-primary">CODE MY CELLS</h3>
            </div>
            <ul className="space-y-1.5 font-mono text-sm">
              <li className="text-foreground/90 flex items-center gap-2">
                <span className="text-primary/50">▸</span> Anmol Rai
              </li>
              <li className="text-foreground/90 flex items-center gap-2">
                <span className="text-primary/50">▸</span> Ashwera Hasan
              </li>
              <li className="text-foreground/90 flex items-center gap-2">
                <span className="text-primary/50">▸</span> Shravika Mhatre
              </li>
              <li className="text-foreground/90 flex items-center gap-2">
                <span className="text-primary/50">▸</span> Yash Agroya
              </li>
            </ul>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}