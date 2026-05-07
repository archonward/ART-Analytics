import { useEffect, useState } from 'react';
import { API_BASE, API_HEADERS } from '../config/api';

function getMillisecondsUntilNextDay() {
  const now = new Date();
  const nextDay = new Date(now);
  nextDay.setDate(now.getDate() + 1);
  nextDay.setHours(0, 0, 1, 0);

  return nextDay.getTime() - now.getTime();
}

export default function useBatchMarketData(tickers, enabled = true) {
  const [marketDataMap, setMarketDataMap] = useState({});
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState('');

  useEffect(() => {
    const cleanedTickers = [...new Set((tickers || []).filter(Boolean))];

    if (!enabled || cleanedTickers.length === 0) {
      setMarketDataMap({});
      setMarketLoading(false);
      setMarketError('');
      return undefined;
    }

    let isCancelled = false;

    async function loadBatchMarketData() {
      try {
        if (!isCancelled) {
          setMarketLoading(true);
          setMarketError('');
        }

        const response = await fetch(
          `${API_BASE}/api/market-data/batch?tickers=${encodeURIComponent(cleanedTickers.join(','))}`,
          { headers: API_HEADERS }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Could not load batch market data.');
        }

        const nextMap = {};

        for (const item of data.results || []) {
          nextMap[item.ticker] = item;
        }

        if (!isCancelled) {
          setMarketDataMap(nextMap);
        }
      } catch (err) {
        if (!isCancelled) {
          setMarketError(err.message);
          setMarketDataMap({});
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
        await loadBatchMarketData();

        if (!isCancelled) {
          scheduleDailyRefresh();
        }
      }, getMillisecondsUntilNextDay());
    }

    loadBatchMarketData();
    scheduleDailyRefresh();

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [enabled, JSON.stringify([...new Set((tickers || []).filter(Boolean))])]);

  return {
    marketDataMap,
    marketLoading,
    marketError
  };
}
