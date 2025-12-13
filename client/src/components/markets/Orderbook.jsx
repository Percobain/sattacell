import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";

export function Orderbook({ marketId, outcomes }) {
  const [orderbook, setOrderbook] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderbook();
  }, [marketId]);

  const fetchOrderbook = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/markets/${marketId}/orderbook`);
      setOrderbook(data.orderbook);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-muted-foreground p-4">Loading orderbook...</div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive p-4">Error: {error}</div>
    );
  }

  if (orderbook.length === 0) {
    return (
      <div className="text-muted-foreground p-4">No positions yet</div>
    );
  }

  return (
    <div className="space-y-4">
      {orderbook.map((user) => (
        <div key={user.userId} className="border rounded-lg p-4">
          <div className="font-semibold mb-2 text-sm">{user.name || user.email}</div>
          <div className="space-y-1">
            {Object.entries(user.positions).map(([outcomeIndex, shares]) => (
              <div key={outcomeIndex} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {outcomes[parseInt(outcomeIndex)]}
                </span>
                <span className="font-medium">{shares.toFixed(2)} shares</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
