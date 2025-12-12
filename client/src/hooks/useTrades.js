import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function useTrades(marketId = null) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrades();
  }, [marketId]);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const params = marketId ? `?marketId=${marketId}` : '';
      const data = await api.get(`/trades${params}`);
      setTrades(data.trades);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { trades, loading, error, refetch: fetchTrades };
}

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const data = await api.get('/users/portfolio');
      setPortfolio(data.portfolio);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { portfolio, loading, error, refetch: fetchPortfolio };
}

