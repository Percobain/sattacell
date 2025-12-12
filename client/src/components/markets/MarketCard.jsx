import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function MarketCard({ market }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'closed':
        return 'secondary';
      case 'settled':
        return 'outline';
      default:
        return 'default';
    }
  };

  const topOutcome = market.probabilities
    ? market.probabilities.reduce((max, prob, idx) => 
        prob > market.probabilities[max] ? idx : max, 0
      )
    : 0;

  return (
    <Link to={`/markets/${market._id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{market.title}</CardTitle>
            <Badge variant={getStatusColor(market.status)}>
              {market.status}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">
            {market.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {market.probabilities && market.probabilities.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Top Outcome:</div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{market.outcomes[topOutcome]}</span>
                <span className="text-sm font-semibold">
                  {(market.probabilities[topOutcome] * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${market.probabilities[topOutcome] * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

