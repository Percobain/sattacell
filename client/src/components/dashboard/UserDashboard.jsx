import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useTrades, usePortfolio } from "@/hooks/useTrades";
import { Link } from "react-router-dom";

export function UserDashboard() {
  const { userData } = useAuth();
  const { trades, loading: tradesLoading } = useTrades();
  const { portfolio, loading: portfolioLoading } = usePortfolio();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {userData?.balance?.toFixed(2) || "0.00"} tokens
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Portfolio</CardTitle>
          <CardDescription>Your positions across all markets</CardDescription>
        </CardHeader>
        <CardContent>
          {portfolioLoading ? (
            <div className="text-muted-foreground">Loading portfolio...</div>
          ) : portfolio.length === 0 ? (
            <div className="text-muted-foreground">No positions yet</div>
          ) : (
            <div className="space-y-4">
              {portfolio.map((item) => (
                <div key={item.market._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Link
                      to={`/markets/${item.market._id}`}
                      className="font-semibold hover:underline"
                    >
                      {item.market.title}
                    </Link>
                    <Badge variant={item.market.status === "open" ? "default" : "secondary"}>
                      {item.market.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 mt-2">
                    {Object.entries(item.positions).map(([outcomeIndex, shares]) => (
                      <div key={outcomeIndex} className="flex justify-between text-sm">
                        <span>{item.market.outcomes[parseInt(outcomeIndex)]}</span>
                        <span className="font-medium">{shares.toFixed(2)} shares</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
          <CardDescription>Your trading history</CardDescription>
        </CardHeader>
        <CardContent>
          {tradesLoading ? (
            <div className="text-muted-foreground">Loading trades...</div>
          ) : trades.length === 0 ? (
            <div className="text-muted-foreground">No trades yet</div>
          ) : (
            <div className="space-y-2">
              {trades.slice(0, 10).map((trade) => (
                <div key={trade._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">
                      {trade.marketId?.title || "Unknown Market"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {trade.marketId?.outcomes[trade.outcomeIndex]} •{" "}
                      {trade.sharesDelta > 0 ? "Bought" : "Sold"} {Math.abs(trade.sharesDelta).toFixed(2)} shares
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${trade.cost > 0 ? "text-destructive" : "text-primary"}`}>
                      {trade.cost > 0 ? "-" : "+"}{Math.abs(trade.cost).toFixed(2)} tokens
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(trade.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

