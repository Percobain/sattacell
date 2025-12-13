import { MarketList } from "@/components/markets/MarketList";
import { LoginButton } from "@/components/auth/LoginButton";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "/CodeCell Logo White.png";

export function Home() {
  const { isAuthenticated, userData } = useAuth();

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
          {userData?.isAdmin && (
            <Link to="/admin">
              <Button variant="neon-red" size="sm" className="md:size-default">Admin</Button>
            </Link>
          )}
          <LoginButton />
        </div>
      </div>

      {/* Data strip - Japanese aesthetic - Hidden on mobile */}
      <div className="hidden md:flex justify-between items-center text-xs font-mono text-muted-foreground border-y border-primary/20 py-2">
        <div className="flex items-center gap-4">
          <span className="text-primary">予測市場</span>
          <span>PN: 2483-AX9</span>
          <span className="text-primary/50">|</span>
          <span>ACTIVE PROTOCOL</span>
        </div>
        <div className="flex items-center gap-4">
          <span>BATCH: {new Date().toISOString().split('T')[0]}</span>
          <span className="text-primary/50">|</span>
          <span className="text-neon-red">全頼</span>
        </div>
      </div>

      {/* Markets Section */}
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
    </div>
  );
}