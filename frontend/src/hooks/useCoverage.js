import { useEffect, useState } from 'react';
import { API_BASE, API_HEADERS } from '../config/api';

export default function useCoverage() {
  const [coveredTickers, setCoveredTickers] = useState([]);
  const [coverageLoading, setCoverageLoading] = useState(true);
  const [coverageError, setCoverageError] = useState('');

  useEffect(() => {
    async function loadCoverage() {
      try {
        setCoverageLoading(true);
        setCoverageError('');

        const response = await fetch(`${API_BASE}/api/coverage`,
          { headers: API_HEADERS }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Could not load coverage list.');
        }

        setCoveredTickers(data.coveredTickers || []);
      } catch (err) {
        setCoverageError(err.message);
      } finally {
        setCoverageLoading(false);
      }
    }

    loadCoverage();
  }, []);

  return {
    coveredTickers,
    coverageLoading,
    coverageError
  };
}