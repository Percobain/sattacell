import { MarketList } from "@/components/markets/MarketList";
import { LoginButton } from "@/components/auth/LoginButton";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "/logo.png"; // Add this import

export function Home() {
  const { isAuthenticated, userData } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"> {/* Changed to flex with gap */}
          <img 
            src={logo} 
            alt="SattaCell Logo" 
            className="h-28 w-28 object-contain"
          />
          <div>
            <h1 className="text-4xl font-bold">SattaCell</h1>
            <p className="text-muted-foreground mt-2">Prediction Markets Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <>
              <div className="text-sm">
                <div className="font-semibold">{userData?.email}</div>
                <div className="text-muted-foreground">{userData?.balance?.toFixed(2)} tokens</div>
              </div>
              <Link to="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
            </>
          )}
          {userData?.isAdmin && (
            <Link to="/admin">
              <Button variant="outline">Admin</Button>
            </Link>
          )}
          <LoginButton />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Markets</h2>
        <MarketList status="open" />
      </div>
    </div>
  );
}