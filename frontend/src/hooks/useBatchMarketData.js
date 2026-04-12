import { useEffect, useState } from 'react';
import { API_BASE, API_HEADERS } from '../config/api';

const POLL_INTERVAL_MS = 15000;

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

    loadBatchMarketData();

    const intervalId = setInterval(loadBatchMarketData, POLL_INTERVAL_MS);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [enabled, JSON.stringify([...new Set((tickers || []).filter(Boolean))])]);

  return {
    marketDataMap,
    marketLoading,
    marketError
  };
}