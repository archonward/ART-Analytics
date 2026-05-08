import { useEffect, useState } from 'react';
import { API_BASE, API_HEADERS } from '../config/api';

const POLL_INTERVAL_MS = 3_600_000;

export default function useMarketData(ticker, enabled = true) {
  const [marketData, setMarketData] = useState(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState('');
  const [marketUnavailable, setMarketUnavailable] = useState(false);

  useEffect(() => {
    if (!enabled || !ticker) {
      setMarketData(null);
      setMarketLoading(false);
      setMarketError('');
      setMarketUnavailable(false);
      return undefined;
    }

    let isCancelled = false;

    async function loadMarketData() {
      try {
        if (!isCancelled) {
          setMarketLoading(true);
          setMarketError('');
        }

        const response = await fetch(
          `${API_BASE}/api/market-data?ticker=${encodeURIComponent(ticker)}`,
          { headers: API_HEADERS }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Could not load market data.');
        }

        if (data.status === 'unavailable') {
          if (!isCancelled) {
            setMarketData(null);
            setMarketUnavailable(true);
            setMarketError('');
          }
          return;
        }

        if (!isCancelled) {
          setMarketData(data);
          setMarketUnavailable(false);
          setMarketError('');
        }
      } catch (err) {
        if (!isCancelled) {
          setMarketError(err.message);
          setMarketData(null);
          setMarketUnavailable(false);
        }
      } finally {
        if (!isCancelled) {
          setMarketLoading(false);
        }
      }
    }

    let timeoutId;

    function scheduleDailyRefresh() {
      timeoutId = setTimeout(async () => {
        await loadMarketData();

        if (!isCancelled) {
          scheduleDailyRefresh();
        }
      }, POLL_INTERVAL_MS);
    }

    loadMarketData();
    scheduleDailyRefresh();

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [ticker, enabled]);

  return {
    marketData,
    marketLoading,
    marketError,
    marketUnavailable
  };
}
