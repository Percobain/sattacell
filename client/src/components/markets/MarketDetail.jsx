import { useState } from "react";
import { useMarket } from "@/hooks/useMarkets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TradeHistory } from "./TradeHistory";
import { MarketAnalytics } from "./MarketAnalytics";
import { ProbabilityChart } from "./ProbabilityChart";
import { Skeleton, SkeletonProbabilities } from "@/components/ui/Skeleton";
import {
  TrendingUp,
  BarChart3,
  Target,
  Activity,
  Trophy,
  LineChart,
  History,
  Wallet
} from "lucide-react";

export function MarketDetail({ marketId }) {
  const { market, loading, error } = useMarket(marketId);
  const [showHistory, setShowHistory] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showChart, setShowChart] = useState(true);

  // Loading state with skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        {/* Hero skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16 rounded-sm" />
            </div>
          </CardHeader>
        </Card>

        {/* Probabilities skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-8 w-28" />
            </div>
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent>
            <SkeletonProbabilities />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-8 text-center">
          <div className="text-destructive font-mono">[ERROR] {error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!market) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Market not found
        </CardContent>
      </Card>
    );
  }

  const chartData = market.outcomes.map((outcome, idx) => ({
    name: outcome,
    value: market.probabilities ? (market.probabilities[idx] * 100) : 0,
    probability: market.probabilities ? market.probabilities[idx] : 0,
  }));

  const hasUserPosition = market.userPosition && Object.keys(market.userPosition).length > 0;

  // Find leading outcome
  const leadingIndex = market.probabilities
    ? market.probabilities.reduce((maxIdx, prob, idx) =>
      prob > market.probabilities[maxIdx] ? idx : maxIdx, 0
    )
    : 0;

  return (
    <div className="space-y-4">
      {/* Hero Card - Market Info */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl md:text-2xl leading-tight">
                {market.title}
              </CardTitle>
              <CardDescription className="mt-2 font-mono text-sm">
                {market.description}
              </CardDescription>
            </div>
            <Badge
              variant={market.status === 'open' ? 'success' : market.status === 'settled' ? 'secondary' : 'neon-red'}
              className="shrink-0"
            >
              {market.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>

        {market.status === 'settled' && market.winningOutcome !== null && (
          <CardContent className="pt-0">
            <div className="p-4 bg-neon-green/10 border border-neon-green/30 rounded-lg flex items-center gap-3">
              <Trophy className="h-5 w-5 text-neon-green" />
              <div>
                <span className="text-sm text-muted-foreground">Winner:</span>
                <span className="ml-2 font-semibold text-neon-green">{market.outcomes[market.winningOutcome]}</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Probabilities Card - Simplified */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
              <CardTitle className="text-base sm:text-lg whitespace-nowrap">Current Probabilities</CardTitle>
            </div>
            <div className="flex gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChart(!showChart)}
                className="gap-1 sm:gap-2 text-xs px-2 sm:px-3"
              >
                <LineChart className="h-3 w-3 sm:h-4 sm:w-4" />
                {showChart ? 'Hide' : 'History'}
              </Button>
              {/* <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="gap-1 sm:gap-2 text-xs px-2 sm:px-3"
              >
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                {showAnalytics ? 'Hide' : 'Analytics'}
              </Button> */}
            </div>
          </div>
          {market.probabilities && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-2">
              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span>
                Leading: <span className="text-primary font-semibold">{market.outcomes[leadingIndex]}</span>
                <span className="text-primary ml-1">({(market.probabilities[leadingIndex] * 100).toFixed(1)}%)</span>
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Probability History Chart - Collapsible */}
          {showChart && (
            <ProbabilityChart marketId={marketId} outcomes={market.outcomes} />
          )}

          {/* Outcome Progress Bars - Always Visible */}
          <div className="space-y-2">
            {market.outcomes.map((outcome, idx) => {
              const isLeading = idx === leadingIndex;
              const probability = market.probabilities?.[idx] || 0;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-all ${isLeading
                    ? 'bg-primary/5 border-primary/30'
                    : 'border-primary/10 hover:border-primary/20'
                    }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isLeading && <Trophy className="h-4 w-4 text-yellow-500 shrink-0" />}
                    <span className={`font-mono text-sm truncate ${isLeading ? 'text-primary' : ''}`}>
                      {outcome}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-24 md:w-32 bg-secondary/50 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${isLeading
                          ? 'bg-gradient-to-r from-primary to-neon-green'
                          : 'bg-primary/60'
                          }`}
                        style={{ width: `${probability * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono font-semibold w-14 text-right text-primary">
                      {(probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Analytics Section - Expandable */}
          {showAnalytics && (
            <div className="pt-4 border-t border-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-display">Market Analytics</h3>
              </div>
              <MarketAnalytics marketId={marketId} outcomes={market.outcomes} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Positions / Trade History - Tabbed */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant={!showHistory ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowHistory(false)}
                className="gap-2"
              >
                <Wallet className="h-4 w-4" />
                Positions
              </Button>
              <Button
                variant={showHistory ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowHistory(true)}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                History
              </Button>
            </div>
          </div>
          <CardDescription className="mt-2">
            {showHistory ? "Recent trades in this market" : "Your current holdings"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showHistory ? (
            <TradeHistory marketId={marketId} outcomes={market.outcomes} />
          ) : hasUserPosition ? (
            <div className="space-y-2">
              {Object.entries(market.userPosition).map(([outcomeIndex, shares]) => (
                shares > 0 && (
                  <div
                    key={outcomeIndex}
                    className="flex justify-between items-center p-3 border border-primary/20 rounded-lg bg-primary/5"
                  >
                    <span className="font-mono text-sm">{market.outcomes[parseInt(outcomeIndex)]}</span>
                    <span className="font-mono font-semibold text-primary">
                      {shares.toFixed(2)} <span className="text-xs text-muted-foreground">shares</span>
                    </span>
                  </div>
                )
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-mono text-sm">No positions yet</p>
              <p className="text-xs mt-1">Buy shares to make a prediction</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
