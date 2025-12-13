import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { useMarket } from "@/hooks/useMarkets";
import { SkeletonTradePanel } from "@/components/ui/Skeleton";
import {
  TrendingUp,
  TrendingDown,
  HelpCircle,
  Zap,
  AlertCircle,
  CheckCircle2,
  Wallet
} from "lucide-react";

export function TradePanel({ marketId }) {
  const { isAuthenticated, userData } = useAuth();
  const { market, loading, refetch: refetchMarket } = useMarket(marketId);
  const [selectedOutcome, setSelectedOutcome] = useState(0);
  const [shares, setShares] = useState("");
  const [tradeType, setTradeType] = useState("buy");
  const [tradeLoading, setTradeLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
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

    setTradeLoading(true);
    setError(null);
    setSuccess(null);

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
      setSuccess(`Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} ${shares} shares!`);
      await refetchMarket();

      // Clear success after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || "Trade failed");
    } finally {
      setTradeLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return <SkeletonTradePanel />;
  }

  if (!market || market.status !== "open") {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-4">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <div className="text-muted-foreground font-mono text-sm">
              {market?.status === "settled"
                ? "This market has been settled"
                : "Market is not open for trading"}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const userPosition = market.userPosition?.[selectedOutcome] || 0;
  const canSell = tradeType === "sell" && userPosition <= 0;
  const currentProbability = market.probabilities[selectedOutcome];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Trade
          </CardTitle>
          {userData && (
            <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
              <Wallet className="h-3 w-3" />
              {userData.balance?.toFixed(2)}
            </div>
          )}
        </div>
        <CardDescription>
          Buy or sell shares in this market
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sign in prompt */}
        {!isAuthenticated && (
          <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg text-sm flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary shrink-0" />
            <span>Sign in to start trading</span>
          </div>
        )}

        {/* Outcome selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Select Outcome
            </Label>
            <span className="text-xs font-mono text-primary">
              {(currentProbability * 100).toFixed(1)}%
            </span>
          </div>
          <select
            className="cursor-target flex h-10 w-full rounded-md border border-primary/30 bg-background/50 px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none"
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

        {/* Trade type buttons */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Trade Type
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={tradeType === "buy" ? "default" : "outline"}
              onClick={() => setTradeType("buy")}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Buy
            </Button>
            <Button
              variant={tradeType === "sell" ? "default" : "outline"}
              onClick={() => setTradeType("sell")}
              className="gap-2"
            >
              <TrendingDown className="h-4 w-4" />
              Sell
            </Button>
          </div>
        </div>

        {/* Position info for sell */}
        {tradeType === "sell" && userPosition > 0 && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm font-mono">
            <span className="text-muted-foreground">You own:</span>
            <span className="ml-2 text-primary font-semibold">{userPosition.toFixed(2)} shares</span>
          </div>
        )}

        {/* Shares input */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Number of Shares
          </Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder="0.00"
            className="font-mono"
          />
        </div>

        {/* Cost preview */}
        {previewCost !== null && (
          <div className="p-3 bg-secondary/30 border border-primary/20 rounded-lg space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimated cost:</span>
              <span className="font-mono font-semibold text-primary">
                {previewCost.toFixed(2)} tokens
              </span>
            </div>
            {tradeType === "buy" && shares && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Potential payout if wins:</span>
                <span className="font-mono text-neon-green">
                  {parseFloat(shares).toFixed(2)} tokens
                </span>
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="p-3 bg-neon-green/10 border border-neon-green/30 rounded-lg text-sm flex items-center gap-2 text-neon-green">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {/* Submit button */}
        <Button
          onClick={handleTrade}
          disabled={tradeLoading || !isAuthenticated || canSell || !shares || parseFloat(shares) <= 0}
          className="w-full gap-2"
        >
          {tradeLoading ? (
            <>Processing...</>
          ) : tradeType === "buy" ? (
            <>
              <TrendingUp className="h-4 w-4" />
              Buy Shares
            </>
          ) : (
            <>
              <TrendingDown className="h-4 w-4" />
              Sell Shares
            </>
          )}
        </Button>

        {/* Helper text for new users */}
        {isAuthenticated && !shares && (
          <p className="text-xs text-center text-muted-foreground">
            💡 Pick the outcome you think will win, enter shares, and click Buy
          </p>
        )}
      </CardContent>
    </Card>
  );
}
