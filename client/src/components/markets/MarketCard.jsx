import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function MarketCard({ market }) {
  const getStatusVariant = (status) => {
    switch (status) {
      case 'open':
        return 'success';
      case 'closed':
        return 'neon-red';
      case 'settled':
        return 'secondary';
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
      <Card className="cursor-pointer h-full group relative overflow-hidden">
        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/20 to-transparent"></div>

        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="group-hover:text-glow-blue transition-all">
              {market.title}
            </CardTitle>
            <Badge variant={getStatusVariant(market.status)}>
              {market.status.toUpperCase()}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">
            // {market.description}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {market.probabilities && market.probabilities.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-neon-red text-xs font-mono">[LEAD]</span>
                <span className="text-xs text-muted-foreground font-mono">TOP_OUTCOME:</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono text-foreground">{market.outcomes[topOutcome]}</span>
                <span className="text-sm font-mono font-bold text-primary text-glow-blue">
                  {(market.probabilities[topOutcome] * 100).toFixed(1)}%
                </span>
              </div>
              {/* Neon progress bar */}
              <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden border border-primary/20">
                <div
                  className="bg-gradient-to-r from-primary to-neon-green h-2 rounded-full transition-all duration-500 shadow-glow-sm"
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
