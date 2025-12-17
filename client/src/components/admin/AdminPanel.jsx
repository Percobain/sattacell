import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreateMarket } from "./CreateMarket";
import { SettleMarket } from "./SettleMarket";
import { GrantTokens } from "./GrantTokens";
import { PendingUsers } from "./PendingUsers";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft } from "lucide-react";

export function AdminPanel() {
  const { isAuthenticated, userData } = useAuth();
  const [password, setPassword] = useState("");
  const [isAuthenticatedAdmin, setIsAuthenticatedAdmin] = useState(
    localStorage.getItem("adminAuthenticated") === "true"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("approvals");
  const [busted, setBusted] = useState(false);

  useEffect(() => {
    let audio;
    if (busted) {
      audio = new Audio("/siren.mp3");
      audio.loop = true;
      audio.play().catch(e => console.error("Audio play failed:", e));
    }
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [busted]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post("/admin/login", { password });
      setIsAuthenticatedAdmin(true);
      localStorage.setItem("adminAuthenticated", "true");
      setPassword("");
    } catch (err) {
      if (err.message === 'User is not an admin' || err.message === 'Invalid admin password') {
        setBusted(true);
      } else {
        setError(err.message || "Invalid password");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticatedAdmin(false);
    localStorage.removeItem("adminAuthenticated");
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Please sign in to access the admin panel
          </div>
        </CardContent>
      </Card>
    );
  }

  if (busted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
        <div className="relative max-w-2xl w-full aspect-video rounded-lg overflow-hidden border-4 border-red-500 shadow-[0_0_50px_rgba(255,0,0,0.5)] animate-in zoom-in duration-300">
          <img 
            src="/pakdagaya.jpeg" 
            alt="YOU ARE BUSTED" 
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 flex items-end justify-center pb-8 bg-gradient-to-t from-black/80 to-transparent">
            <h1 className="text-4xl md:text-6xl font-black text-red-500 tracking-widest uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,1)] animate-pulse">
              {/* ACCESS DENIED */}
            </h1>
          </div>
          <Button 
            variant="destructive" 
            className="absolute top-4 right-4"
            onClick={() => setBusted(false)}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  if (!isAuthenticatedAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Enter admin password to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Verifying..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-primary/20 overflow-x-auto pb-2">
        <Button
          variant={activeTab === "approvals" ? "default" : "ghost"}
          onClick={() => setActiveTab("approvals")}
          className={activeTab !== "approvals" ? "text-foreground" : ""}
        >
          Approvals
        </Button>
        <Button
          variant={activeTab === "create" ? "default" : "ghost"}
          onClick={() => setActiveTab("create")}
          className={activeTab !== "create" ? "text-foreground" : ""}
        >
          Create Market
        </Button>
        <Button
          variant={activeTab === "settle" ? "default" : "ghost"}
          onClick={() => setActiveTab("settle")}
          className={activeTab !== "settle" ? "text-foreground" : ""}
        >
          Settle Market
        </Button>
        <Button
          variant={activeTab === "grant" ? "default" : "ghost"}
          onClick={() => setActiveTab("grant")}
          className={activeTab !== "grant" ? "text-foreground" : ""}
        >
          Grant Tokens
        </Button>
      </div>

      {activeTab === "approvals" && <PendingUsers />}
      {activeTab === "create" && <CreateMarket />}
      {activeTab === "settle" && <SettleMarket />}
      {activeTab === "grant" && <GrantTokens />}
    </div>
  );
}

