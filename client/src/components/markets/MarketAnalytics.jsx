import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Activity, 
  BarChart3, 
  Target,
  DollarSign,
  ArrowUpDown,
  User,
  Award
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MarketCharts } from "./MarketCharts";

export function MarketAnalytics({ marketId, outcomes }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [marketId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/markets/${marketId}/analytics`);
      setAnalytics(data.analytics);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-muted-foreground p-4">Loading analytics...</div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive p-4">Error: {error}</div>
    );
  }

  if (!analytics) {
    return null;
  }

  const metrics = [
    {
      icon: Trophy,
      label: "Leading Outcome",
      value: analytics.leadingOutcome.name,
      subValue: `${analytics.leadingOutcome.probability}%`,
      color: "text-yellow-500",
    },
    {
      icon: Target,
      label: "Most Shares",
      value: analytics.mostSharesOutcome.name,
      subValue: `${analytics.mostSharesOutcome.shares} shares`,
      color: "text-blue-500",
    },
    {
      icon: DollarSign,
      label: "Total Volume",
      value: `${analytics.totalVolume} tokens`,
      subValue: `${analytics.totalTrades} trades`,
      color: "text-green-500",
    },
    {
      icon: Users,
      label: "Unique Traders",
      value: analytics.uniqueTraders,
      subValue: `${analytics.avgTradeSize} avg/trade`,
      color: "text-purple-500",
    },
    {
      icon: Activity,
      label: "Recent Activity",
      value: `${analytics.recentActivity} trades`,
      subValue: `Last 24 hours`,
      color: "text-orange-500",
    },
    {
      icon: ArrowUpDown,
      label: "Buy/Sell Ratio",
      value: `${analytics.buySellRatio}% buys`,
      subValue: `${(100 - analytics.buySellRatio).toFixed(1)}% sells`,
      color: "text-indigo-500",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        return (
          <Card key={idx} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`${metric.color} p-2 rounded-lg bg-opacity-10`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-muted-foreground mb-1">
                    {metric.label}
                  </div>
                  <div className="text-lg font-semibold truncate">
                    {metric.value}
                  </div>
                  {metric.subValue && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {metric.subValue}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {analytics.mostActiveTrader && (
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-blue-500 p-2 rounded-lg bg-opacity-10">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-muted-foreground mb-1">
                  Most Active Trader
                </div>
                <div className="text-lg font-semibold truncate">
                  {analytics.mostActiveTrader.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {analytics.mostActiveTrader.tradeCount} trades
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {analytics.largestHolder && (
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-green-500 p-2 rounded-lg bg-opacity-10">
                <Award className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-muted-foreground mb-1">
                  Largest Position Holder
                </div>
                <div className="text-lg font-semibold truncate">
                  {analytics.largestHolder.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {analytics.largestHolder.totalShares} total shares
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>

      {/* Charts Section */}
      <div className="mt-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle>Visual Analytics</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCharts(!showCharts)}
                className="flex items-center gap-2"
              >
                {showCharts ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide Charts
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show Charts
                  </>
                )}
              </Button>
            </div>
            <CardDescription>
              Interactive charts showing market dynamics and trader behavior
            </CardDescription>
          </CardHeader>
          {showCharts && (
            <CardContent>
              <MarketCharts analytics={analytics} outcomes={outcomes} />
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

