import { useParams } from "react-router-dom";
import { MarketDetail } from "@/components/markets/MarketDetail";
import { TradePanel } from "@/components/trading/TradePanel";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function MarketPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <Link to="/">
        <Button variant="ghost">← Back to Markets</Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MarketDetail marketId={id} />
        </div>
        <div>
          <TradePanel marketId={id} />
        </div>
      </div>
    </div>
  );
}

