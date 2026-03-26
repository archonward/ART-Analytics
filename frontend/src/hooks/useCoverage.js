import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function useCoverage() {
  const [coveredTickers, setCoveredTickers] = useState([]);
  const [coverageLoading, setCoverageLoading] = useState(true);
  const [coverageError, setCoverageError] = useState('');

  useEffect(() => {
    async function loadCoverage() {
      try {
        setCoverageLoading(true);
        setCoverageError('');

        const response = await fetch(`${API_BASE}/api/coverage`);
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