import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { useMarket } from "@/hooks/useMarkets";

export function TradePanel({ marketId }) {
  const { isAuthenticated, userData } = useAuth();
  const { market, refetch: refetchMarket } = useMarket(marketId);
  const [selectedOutcome, setSelectedOutcome] = useState(0);
  const [shares, setShares] = useState("");
  const [tradeType, setTradeType] = useState("buy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewCost, setPreviewCost] = useState(null);

  useEffect(() => {
    if (market && shares && parseFloat(shares) > 0) {
      calculatePreview();
    } else {
      setPreviewCost(null);
    }
  }, [shares, selectedOutcome, tradeType, market]);

  const calculatePreview = async () => {
    if (!market || !shares || parseFloat(shares) <= 0) return;

    try {
      // For preview, we'd need a preview endpoint, but for now we'll estimate
      // based on current price
      const currentPrice = market.probabilities[selectedOutcome];
      const estimatedCost = parseFloat(shares) * currentPrice;
      setPreviewCost(estimatedCost);
    } catch (err) {
      console.error("Preview calculation error:", err);
    }
  };

  const handleTrade = async () => {
    if (!isAuthenticated) {
      setError("Please sign in to trade");
      return;
    }

    if (!shares || parseFloat(shares) <= 0) {
      setError("Please enter a valid number of shares");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (tradeType === "buy") {
        await api.post("/trades", {
          marketId,
          outcomeIndex: selectedOutcome,
          sharesDelta: parseFloat(shares),
        });
      } else {
        await api.post("/trades/sell", {
          marketId,
          outcomeIndex: selectedOutcome,
          shares: parseFloat(shares),
        });
      }

      setShares("");
      await refetchMarket();
      // Trigger user data refresh by reloading the page
      // In a production app, you'd update the userData state directly
      window.location.reload();
    } catch (err) {
      setError(err.message || "Trade failed");
    } finally {
      setLoading(false);
    }
  };

  if (!market || market.status !== "open") {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-muted-foreground">
            {market?.status === "settled" ? "This market has been settled" : "Market is not open for trading"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const userPosition = market.userPosition?.[selectedOutcome] || 0;
  const canSell = tradeType === "sell" && userPosition <= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade</CardTitle>
        <CardDescription>
          Buy or sell shares in this market
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAuthenticated && (
          <div className="p-4 bg-muted rounded-lg text-sm">
            Please sign in to trade
          </div>
        )}

        <div className="space-y-2">
          <Label>Select Outcome</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={selectedOutcome}
            onChange={(e) => setSelectedOutcome(parseInt(e.target.value))}
          >
            {market.outcomes.map((outcome, idx) => (
              <option key={idx} value={idx}>
                {outcome} ({(market.probabilities[idx] * 100).toFixed(1)}%)
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Trade Type</Label>
          <div className="flex gap-2">
            <Button
              variant={tradeType === "buy" ? "default" : "outline"}
              onClick={() => setTradeType("buy")}
              className="flex-1"
            >
              Buy
            </Button>
            <Button
              variant={tradeType === "sell" ? "default" : "outline"}
              onClick={() => setTradeType("sell")}
              className="flex-1"
            >
              Sell
            </Button>
          </div>
        </div>

        {tradeType === "sell" && userPosition > 0 && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            You own {userPosition.toFixed(2)} shares of {market.outcomes[selectedOutcome]}
          </div>
        )}

        <div className="space-y-2">
          <Label>Number of Shares</Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder="0.00"
          />
        </div>

        {previewCost !== null && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm">
              Estimated cost: <span className="font-semibold">{previewCost.toFixed(2)} tokens</span>
            </div>
            {userData && (
              <div className="text-xs text-muted-foreground mt-1">
                Your balance: {userData.balance.toFixed(2)} tokens
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        <Button
          onClick={handleTrade}
          disabled={loading || !isAuthenticated || canSell || !shares || parseFloat(shares) <= 0}
          className="w-full"
        >
          {loading ? "Processing..." : tradeType === "buy" ? "Buy Shares" : "Sell Shares"}
        </Button>
      </CardContent>
    </Card>
  );
}

