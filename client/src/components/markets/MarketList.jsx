import { useMarkets } from "@/hooks/useMarkets";
import { MarketCard } from "./MarketCard";
import { Button } from "@/components/ui/button";
import { SkeletonMarketCard } from "@/components/ui/Skeleton";
import { AlertCircle, RefreshCw, Inbox } from "lucide-react";

export function MarketList({ status = null }) {
  const { markets, loading, error, refetch } = useMarkets(status);

  // Loading state with skeleton cards
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonMarketCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 border border-destructive/30 rounded-lg bg-destructive/5">
        <AlertCircle className="h-10 w-10 text-destructive opacity-50" />
        <div className="text-destructive font-mono text-sm">[ERROR] {error}</div>
        <Button onClick={refetch} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-primary/20 rounded-lg">
        <Inbox className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
        <div className="text-muted-foreground font-mono">No markets found</div>
        <p className="text-xs text-muted-foreground mt-1">Check back later for new predictions</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {markets.map((market) => (
        <MarketCard key={market._id} market={market} />
      ))}
    </div>
  );
}
