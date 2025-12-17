import { useParams } from "react-router-dom";
import { MarketDetail } from "@/components/markets/MarketDetail";
import { TradePanel } from "@/components/trading/TradePanel";
import { FloatingHistoryButton } from "@/components/markets/FloatingHistoryButton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function MarketPage() {
  const { id } = useParams();

  return (
    <div className="space-y-4 relative">
      {/* Navigation */}
      <Link to="/">
        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Back to Markets
        </Button>
      </Link>

      {/* Main Grid - Trade panel sticky on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market Details - 2 columns on desktop */}
        <div className="lg:col-span-2 space-y-4">
          <MarketDetail marketId={id} />
        </div>

        {/* Trade Panel - Sticky on desktop */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <TradePanel marketId={id} />
        </div>
      </div>

      {/* Draggable floating history button, lives on this page only */}
      <FloatingHistoryButton marketId={id} />
    </div>
  );
}
