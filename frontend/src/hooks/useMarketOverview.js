import { useEffect, useState } from 'react';
import { API_BASE, API_HEADERS } from '../config/api';

function getMillisecondsUntilNextDay() {
  const now = new Date();
  const nextDay = new Date(now);
  nextDay.setDate(now.getDate() + 1);
  nextDay.setHours(0, 0, 1, 0);

  return nextDay.getTime() - now.getTime();
}

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

        const response = await fetch(
          `${API_BASE}/api/market-overview`,
          { headers: API_HEADERS }
        );
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

    let timeoutId;

    function scheduleDailyRefresh() {
      timeoutId = setTimeout(async () => {
        await loadMarketOverview();

        if (!isCancelled) {
          scheduleDailyRefresh();
        }
      }, getMillisecondsUntilNextDay());
    }

    loadMarketOverview();
    scheduleDailyRefresh();

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [enabled]);

  return {
    overviewItems,
    overviewLoading,
    overviewError
  };
}
