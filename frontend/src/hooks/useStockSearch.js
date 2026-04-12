import { useState } from 'react';
import { API_BASE, API_HEADERS } from '../config/api';

export default function useStockSearch() {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [selectedTicker, setSelectedTicker] = useState('');

  async function searchTicker(targetTicker) {
    const normalizedTicker = targetTicker.trim().toUpperCase();

    setLoading(true);
    setError('');
    setResult(null);
    setSelectedTicker(normalizedTicker);

    try {
      const response = await fetch(
        `${API_BASE}/api/stock-summary?ticker=${encodeURIComponent(normalizedTicker)}`,
        { headers: API_HEADERS }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not fetch stock summary.');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function resetView() {
    setTicker('');
    setError('');
    setResult(null);
    setSelectedTicker('');
  }

  return {
    ticker,
    setTicker,
    loading,
    error,
    result,
    selectedTicker,
    searchTicker,
    resetView
  };
}