import { useMarket } from "@/hooks/useMarkets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function MarketDetail({ marketId }) {
  const { market, loading, error } = useMarket(marketId);

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
          <CardTitle>Current Probabilities</CardTitle>
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
              {market.outcomes.map((outcome, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{outcome}</span>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(market.probabilities[idx] || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-16 text-right">
                      {(market.probabilities[idx] * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {market.userPosition && Object.keys(market.userPosition).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Positions</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

