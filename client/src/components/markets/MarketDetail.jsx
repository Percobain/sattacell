import { useState } from "react";
import { useMarket } from "@/hooks/useMarkets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { TradeHistory } from "./TradeHistory";
import { MarketAnalytics } from "./MarketAnalytics";
import { 
  TrendingUp, 
  BarChart3, 
  ChevronDown, 
  ChevronUp,
  Target,
  Activity,
  Trophy
} from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function MarketDetail({ marketId }) {
  const { market, loading, error } = useMarket(marketId);
  const [showHistory, setShowHistory] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  if (loading) {
    return <div className="p-8">Loading market...</div>;
  }

  if (error) {
    return <div className="p-8 text-destructive">Error: {error}</div>;
  }

  if (!market) {
    return <div className="p-8">Market not found</div>;
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{market.title}</CardTitle>
              <CardDescription className="mt-2">{market.description}</CardDescription>
            </div>
            <Badge variant={market.status === 'open' ? 'default' : 'secondary'}>
              {market.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {market.status === 'settled' && market.winningOutcome !== null && (
            <div className="mb-4 p-4 bg-primary/10 rounded-lg">
              <div className="font-semibold">Winner: {market.outcomes[market.winningOutcome]}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Current Probabilities</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center gap-2"
            >
              {showAnalytics ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Analytics
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4" />
                  Show Analytics
                </>
              )}
            </Button>
          </div>
          {market.probabilities && (
            <CardDescription className="flex items-center gap-2 mt-2">
              <Target className="h-4 w-4" />
              <span>
                Leading: <strong>{market.outcomes[leadingIndex]}</strong> ({market.probabilities[leadingIndex] * 100}%)
              </span>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2">
              {market.outcomes.map((outcome, idx) => {
                const isLeading = idx === leadingIndex;
                return (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      isLeading ? 'bg-primary/5 border-primary/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isLeading && <Trophy className="h-4 w-4 text-yellow-500" />}
                      <span className={`font-medium ${isLeading ? 'text-primary' : ''}`}>
                        {outcome}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-secondary rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isLeading ? 'bg-primary' : 'bg-primary/60'
                          }`}
                          style={{ width: `${(market.probabilities[idx] || 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-16 text-right">
                        {(market.probabilities[idx] * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Analytics Section */}
          {showAnalytics && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Market Analytics</h3>
              </div>
              <MarketAnalytics marketId={marketId} outcomes={market.outcomes} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Your Positions / Trade History Section with Switch */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {showHistory ? "Trade History" : "Your Positions"}
            </CardTitle>
            {hasUserPosition && (
              <div className="flex items-center gap-3">
                <span className={`text-sm ${!showHistory ? "font-medium" : "text-muted-foreground"}`}>
                  Your Positions
                </span>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={showHistory}
                    onChange={(e) => setShowHistory(e.target.checked)}
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </label>
                <span className={`text-sm ${showHistory ? "font-medium" : "text-muted-foreground"}`}>
                  Trade History
                </span>
              </div>
            )}
            {!hasUserPosition && (
              <CardTitle>Trade History</CardTitle>
            )}
          </div>
          <CardDescription>
            {showHistory || !hasUserPosition
              ? "All trades in this market" 
              : "Your current positions"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showHistory || !hasUserPosition ? (
            <TradeHistory marketId={marketId} outcomes={market.outcomes} />
          ) : (
            hasUserPosition && (
              <div className="space-y-2">
                {Object.entries(market.userPosition).map(([outcomeIndex, shares]) => (
                  shares > 0 && (
                    <div key={outcomeIndex} className="flex justify-between p-2 border rounded">
                      <span>{market.outcomes[parseInt(outcomeIndex)]}</span>
                      <span className="font-semibold">{shares.toFixed(2)} shares</span>
                    </div>
                  )
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}

