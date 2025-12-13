import { MarketList } from "@/components/markets/MarketList";
import { LoginButton } from "@/components/auth/LoginButton";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "/logo.png";

export function Home() {
  const { isAuthenticated, userData } = useAuth();

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="flex items-center justify-between border-b border-primary/30 pb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={logo}
              alt="SattaCell Logo"
              className="h-24 w-24 object-contain"
            />
          </div>
          <div>
            <h1 className="text-4xl font-display font-bold text-primary tracking-wider">
              SATTACELL
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-neon-red text-xs font-mono">[01]</span>
              <p className="text-muted-foreground font-mono text-sm">
                // PREDICTION_MARKETS_PLATFORM
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <>
              <div className="text-sm font-mono border border-primary/30 px-4 py-2 bg-card/50">
                <div className="text-primary">{userData?.email}</div>
                <div className="text-neon-green text-xs">
                  ¥ {userData?.balance?.toFixed(2)} <span className="text-muted-foreground">TOKENS</span>
                </div>
              </div>
              <Link to="/dashboard">
                <Button variant="neon">Dashboard</Button>
              </Link>
            </>
          )}
          {userData?.isAdmin && (
            <Link to="/admin">
              <Button variant="neon-red">Admin</Button>
            </Link>
          )}
          <LoginButton />
        </div>
      </div>

      {/* Data strip - Japanese aesthetic */}
      <div className="flex justify-between items-center text-xs font-mono text-muted-foreground border-y border-primary/20 py-2">
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
        <div className="flex items-center gap-3 mb-6">
          <span className="text-neon-red font-mono text-sm">[02]</span>
          <h2 className="text-2xl font-display font-semibold text-primary">
            ACTIVE MARKETS
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent"></div>
          <span className="text-muted-foreground font-mono text-xs">アクティブマーケット</span>
        </div>
        <MarketList status="open" />
      </div>
    </div>
  );
}