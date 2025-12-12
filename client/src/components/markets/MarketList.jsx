import { useMarkets } from "@/hooks/useMarkets";
import { MarketCard } from "./MarketCard";
import { Button } from "@/components/ui/button";

export function MarketList({ status = null }) {
  const { markets, loading, error, refetch } = useMarkets(status);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading markets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-destructive">Error: {error}</div>
        <Button onClick={refetch} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">No markets found</div>
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

