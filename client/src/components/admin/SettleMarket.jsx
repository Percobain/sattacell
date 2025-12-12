import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";
import { useMarkets } from "@/hooks/useMarkets";

export function SettleMarket() {
  const { markets, refetch } = useMarkets("open");
  const [selectedMarket, setSelectedMarket] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const market = markets.find((m) => m._id === selectedMarket);

  useEffect(() => {
    if (market) {
      setSelectedOutcome(0);
    }
  }, [market]);

  const handleSettle = async () => {
    if (!selectedMarket) {
      setError("Please select a market");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post("/admin/settle-market", {
        marketId: selectedMarket,
        winningOutcomeIndex: selectedOutcome,
      });

      setSuccess(`Market settled! Winner: ${market.outcomes[selectedOutcome]}`);
      setSelectedMarket("");
      refetch();
    } catch (err) {
      setError(err.message || "Failed to settle market");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settle Market</CardTitle>
        <CardDescription>Select the winning outcome for a market</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Select Market</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
          >
            <option value="">Choose a market...</option>
            {markets.map((m) => (
              <option key={m._id} value={m._id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>

        {market && (
          <>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">{market.title}</div>
              <div className="text-xs text-muted-foreground">{market.description}</div>
            </div>

            <div className="space-y-2">
              <Label>Select Winning Outcome</Label>
              <div className="space-y-2">
                {market.outcomes.map((outcome, idx) => (
                  <label
                    key={idx}
                    className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent"
                  >
                    <input
                      type="radio"
                      name="outcome"
                      value={idx}
                      checked={selectedOutcome === idx}
                      onChange={() => setSelectedOutcome(idx)}
                    />
                    <span>{outcome}</span>
                    <span className="ml-auto text-sm text-muted-foreground">
                      {(market.probabilities[idx] * 100).toFixed(1)}%
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-primary/10 text-primary rounded-lg text-sm">
            {success}
          </div>
        )}

        <Button
          onClick={handleSettle}
          disabled={loading || !selectedMarket || !market}
          className="w-full"
        >
          {loading ? "Settling..." : "Settle Market"}
        </Button>
      </CardContent>
    </Card>
  );
}

