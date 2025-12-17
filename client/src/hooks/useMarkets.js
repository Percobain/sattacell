import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function useMarkets(status = null) {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMarkets();
  }, [status]);

  const fetchMarkets = async () => {
    try {
      setLoading(true);
      const params = status ? `?status=${status}` : '';
      const data = await api.get(`/markets${params}`);
      setMarkets(data.markets);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { markets, loading, error, refetch: fetchMarkets };
}

export function useMarket(id) {
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchMarket();
    }
  }, [id]);

  /**
   * Fetch market data.
   * If options.silent is true, we avoid toggling the loading flag so
   * existing UI (tabs, history) doesn't flicker back to skeletons.
   */
  const fetchMarket = async (options = {}) => {
    const { silent = false } = options;

    try {
      if (!silent) {
        setLoading(true);
      }
      const data = await api.get(`/markets/${id}`);
      setMarket(data.market);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  return { market, loading, error, refetch: fetchMarket };
}

