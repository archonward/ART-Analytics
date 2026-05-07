import { useEffect, useState } from 'react';
import { API_BASE, API_HEADERS } from '../config/api';

function getMillisecondsUntilNextDay() {
  const now = new Date();
  const nextDay = new Date(now);
  nextDay.setDate(now.getDate() + 1);
  nextDay.setHours(0, 0, 1, 0);

  return nextDay.getTime() - now.getTime();
}

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
      }, getMillisecondsUntilNextDay());
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
