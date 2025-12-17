import { useState, useEffect } from "react";
import { api } from "@/services/api";

export function TradeHistory({ marketId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    fetchHistory();

    // Keep history in sync with the probability chart using realtime events
    const handleTradeCompleted = (event) => {
      const changedMarketId = event?.detail?.marketId;
      if (changedMarketId && changedMarketId !== marketId) return;
      // Background refresh – don't show loading spinner again
      fetchHistory(true);
    };

    window.addEventListener('tradeCompleted', handleTradeCompleted);

    return () => {
      window.removeEventListener('tradeCompleted', handleTradeCompleted);
    };
  }, [marketId]);

  // If silent is true, we avoid toggling the loading state so the list
  // doesn't disappear while you're scrolling the History tab.
  const fetchHistory = async (silent = false) => {
    try {
      if (!silent && !hasLoadedOnce) {
        setLoading(true);
      }
      const data = await api.get(`/markets/${marketId}/history`);
      setHistory(data.history);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent && !hasLoadedOnce) {
        setLoading(false);
        setHasLoadedOnce(true);
      }
    }
  };

  if (loading) {
    return (
      <div className="text-muted-foreground p-4">Loading history...</div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive p-4">Error: {error}</div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-muted-foreground p-4">No trades yet</div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((trade) => (
        <div key={trade._id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{trade.user.name || trade.user.email}</span>
              <span className="text-xs text-muted-foreground">
                {trade.sharesDelta > 0 ? (
                  <span className="text-primary">Bought</span>
                ) : (
                  <span className="text-destructive">Sold</span>
                )}
              </span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {trade.outcome} • {Math.abs(trade.sharesDelta).toFixed(2)} shares
            </div>
          </div>
          <div className="text-right">
            <div className={`font-semibold text-sm ${trade.cost > 0 ? "text-destructive" : "text-primary"}`}>
              {trade.cost > 0 ? "-" : "+"}{Math.abs(trade.cost).toFixed(2)} tokens
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(trade.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
