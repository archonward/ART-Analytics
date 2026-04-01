import { useEffect, useState } from 'react';
import { API_BASE } from '../config/api';

const POLL_INTERVAL_MS = 15000;

export default function useMarketOverview(enabled = true) {
  const [overviewItems, setOverviewItems] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState('');

  useEffect(() => {
    if (!enabled) {
      setOverviewItems([]);
      setOverviewLoading(false);
      setOverviewError('');
      return undefined;
    }

    let isCancelled = false;

    async function loadMarketOverview() {
      try {
        if (!isCancelled) {
          setOverviewLoading(true);
          setOverviewError('');
        }

        const response = await fetch(`${API_BASE}/api/market-overview`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Could not load market overview.');
        }

        if (!isCancelled) {
          setOverviewItems(data.items || []);
        }
      } catch (err) {
        if (!isCancelled) {
          setOverviewError(err.message);
          setOverviewItems([]);
        }
      } finally {
        if (!isCancelled) {
          setOverviewLoading(false);
        }
      }
    }

    loadMarketOverview();

    const intervalId = setInterval(loadMarketOverview, POLL_INTERVAL_MS);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [enabled]);

  return {
    overviewItems,
    overviewLoading,
    overviewError
  };
}