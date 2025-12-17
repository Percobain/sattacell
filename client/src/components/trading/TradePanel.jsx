import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip } from "@/components/ui/tooltip";
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
  Wallet,
  BarChart3,
  Info
} from "lucide-react";

export function TradePanel({ marketId }) {
  const { isAuthenticated, userData, refetchUserData } = useAuth();
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

  // LMSR helper functions
  const calculateLMSRCost = (qBefore, qAfter, b) => {
    // C(q) = b * ln(sum(exp(q_i / b)))
    const calculateCost = (q, b) => {
      if (q.length === 0) return 0;
      const sumWeights = q.reduce((sum, qi) => sum + Math.exp(qi / b), 0);
      if (sumWeights === 0) return 0;
      return b * Math.log(sumWeights);
    };

    const costBefore = calculateCost(qBefore, b);
    const costAfter = calculateCost(qAfter, b);
    return costAfter - costBefore;
  };

  const calculatePreview = async () => {
    if (!market || !shares || parseFloat(shares) <= 0) return;

    try {
      const sharesNum = parseFloat(shares);
      const b = market.b || 100; // Default to 100 if not specified
      
      // Ensure q array exists and has correct length
      let qBefore = market.q || [];
      if (!Array.isArray(qBefore) || qBefore.length !== market.outcomes.length) {
        qBefore = new Array(market.outcomes.length).fill(0);
      }
      qBefore = [...qBefore];
      
      if (tradeType === "buy") {
        // Calculate qAfter: add shares to selected outcome
        const qAfter = [...qBefore];
        qAfter[selectedOutcome] = (qAfter[selectedOutcome] || 0) + sharesNum;
        
        // Calculate actual LMSR cost
        const actualCost = calculateLMSRCost(qBefore, qAfter, b);
        setPreviewCost(actualCost);
      } else {
        // For selling: subtract shares from selected outcome
        const qAfter = [...qBefore];
        qAfter[selectedOutcome] = (qAfter[selectedOutcome] || 0) - sharesNum;
        
        // Ensure we don't go negative
        if (qAfter[selectedOutcome] < 0) {
          setPreviewCost(null);
          return;
        }
        
        // Calculate actual LMSR cost (will be negative for sells)
        const actualCost = calculateLMSRCost(qBefore, qAfter, b);
        // For sells, cost is negative (you receive tokens), so we show the absolute value
        setPreviewCost(Math.abs(actualCost));
      }
    } catch (err) {
      console.error("Preview calculation error:", err);
      // Fallback to simple estimate if LMSR calculation fails
      const currentPrice = market.probabilities?.[selectedOutcome] || 0;
      setPreviewCost(parseFloat(shares) * currentPrice);
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
      
      // Refresh market data (includes userPosition)
      await refetchMarket();
      
      // Refresh user data (includes balance)
      await refetchUserData();

      // Dispatch event to refresh other components (portfolio, charts, etc.)
      window.dispatchEvent(new CustomEvent('tradeCompleted'));

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
          Make predictions by buying shares. If you're right, you win tokens!
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
          <div className="flex items-center gap-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Which outcome do you think will win?
            </Label>
            <Tooltip
              content={
                <div className="space-y-2 text-xs">
                  <p className="font-semibold text-primary mb-1">Current Market Probability:</p>
                  <p>{(currentProbability * 100).toFixed(1)}% chance this outcome will win</p>
                  <p className="mt-2 pt-2 border-t border-primary/20">
                    Select the outcome you believe will happen. The probability is calculated based on current market activity and automatically updates as people trade.
                  </p>
                </div>
              }
              side="top"
            >
              <Info className="h-3 w-3 text-primary/60 hover:text-primary cursor-help" />
            </Tooltip>
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
            Buy or Sell?
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
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
            <span className="text-muted-foreground">You currently own:</span>
            <span className="ml-2 text-primary font-semibold font-mono">{userPosition.toFixed(2)} shares</span>
          </div>
        )}

        {/* Shares input */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              How many shares do you want to {tradeType === "buy" ? "buy" : "sell"}?
            </Label>
            <Tooltip
              content={
                <div className="space-y-1 text-xs">
                  <p>Shares represent your position. More shares = bigger potential profit (or loss).</p>
                  <p className="mt-1">Each share costs less than 1 token, but pays 1 token if you win.</p>
                </div>
              }
              side="top"
            >
              <Info className="h-3 w-3 text-primary/60 hover:text-primary cursor-help" />
            </Tooltip>
          </div>
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
          <div className="p-3 bg-secondary/30 border border-primary/20 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">You'll pay:</span>
                <Tooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-semibold text-primary mb-2">How prediction markets work:</p>
                      <ul className="space-y-1 text-xs list-disc list-inside">
                        <li>You buy shares at a discount (less than 1 token per share)</li>
                        <li>If your outcome wins, each share pays 1 token</li>
                        <li>If it loses, you lose what you paid</li>
                      </ul>
                      <p className="text-xs mt-2 pt-2 border-t border-primary/20">
                        <strong>Note:</strong> Cost is calculated using LMSR formula, which accounts for market depth and price impact. Larger orders may have higher per-share costs.
                      </p>
                    </div>
                  }
                  side="top"
                >
                  <Info className="h-3 w-3 text-primary/60 hover:text-primary cursor-help" />
                </Tooltip>
              </div>
              <span className="font-mono font-semibold text-primary">
                {previewCost.toFixed(2)} tokens
              </span>
            </div>
            {tradeType === "buy" && shares && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">If you win, you'll get:</span>
                  <span className="font-mono font-semibold text-neon-green">
                    {parseFloat(shares).toFixed(2)} tokens
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm pt-1 border-t border-primary/10">
                  <span className="text-muted-foreground">Your profit if you win:</span>
                  <span className="font-mono font-semibold text-neon-green">
                    +{(parseFloat(shares) - previewCost).toFixed(2)} tokens
                  </span>
                </div>
              </>
            )}
            {tradeType === "sell" && shares && userPosition > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">You'll receive:</span>
                <span className="font-mono font-semibold text-neon-green">
                  {previewCost.toFixed(2)} tokens
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

        {/* Helper text for new users - Hidden, shown only in tooltip */}
        {isAuthenticated && !shares && (
          <div className="flex items-center justify-center">
            <Tooltip
              content={
                <div className="space-y-2">
                  <p className="font-semibold text-primary mb-2">How prediction markets work:</p>
                  <ul className="space-y-1 text-xs list-disc list-inside">
                    <li>Pick the outcome you think will win</li>
                    <li>Buy shares (like buying tickets at a discount)</li>
                    <li>If you're right, each share pays 1 token</li>
                    <li>If you're wrong, you lose what you paid</li>
                  </ul>
                  <p className="text-xs mt-2 pt-2 border-t border-primary/20">
                    <strong>Example:</strong> Buy 100 shares for 47.5 tokens. If you win, get 100 tokens back (52.5 token profit)!
                  </p>
                </div>
              }
              side="top"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors cursor-help">
                <Info className="h-4 w-4" />
                <span>Need help? Hover for explanation</span>
              </div>
            </Tooltip>
          </div>
        )}

        {/* Analytics button */}
        <Link to={`/markets/${marketId}/analytics`} className="block">
          <Button variant="outline" className="w-full gap-2 mt-2">
            <BarChart3 className="h-4 w-4" />
            View Analytics
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
