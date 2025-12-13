import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreateMarket } from "./CreateMarket";
import { SettleMarket } from "./SettleMarket";
import { GrantTokens } from "./GrantTokens";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

export function AdminPanel() {
  const { isAuthenticated, userData } = useAuth();
  const [password, setPassword] = useState("");
  const [isAuthenticatedAdmin, setIsAuthenticatedAdmin] = useState(
    localStorage.getItem("adminAuthenticated") === "true"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("create");

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
      setError(err.message || "Invalid password");
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

  if (!userData?.isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            You do not have admin privileges
          </div>
        </CardContent>
      </Card>
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
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>

      <div className="flex gap-2 border-b border-primary/20">
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

      {activeTab === "create" && <CreateMarket />}
      {activeTab === "settle" && <SettleMarket />}
      {activeTab === "grant" && <GrantTokens />}
    </div>
  );
}

