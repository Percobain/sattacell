import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";
import { Loader2 } from "lucide-react";

export function GameControls() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isVotingActive, setIsVotingActive] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { config } = await api.get('/admin/config');
      setIsVotingActive(config.isVotingActive);
    } catch (err) {
      setError(err.message || "Failed to fetch game config");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleVoting = async (checked) => {
    setUpdating(true);
    try {
      const { config } = await api.post('/admin/config', { isVotingActive: checked });
      setIsVotingActive(config.isVotingActive);
    } catch (err) {
      console.error("Failed to update voting status:", err);
      // Revert switch on error
      setIsVotingActive(!checked);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Controls</CardTitle>
        <CardDescription>Manage global game settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base">Voting Status</Label>
            <div className="text-sm text-muted-foreground">
              {isVotingActive ? "Voting is currently OPEN" : "Voting is currently CLOSED (Ended)"}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {updating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Switch
              checked={isVotingActive}
              onCheckedChange={toggleVoting}
              disabled={updating}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
