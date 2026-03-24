import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function App() {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/stock-summary?ticker=${encodeURIComponent(ticker)}`);
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

  return (
    <div className="app-shell">
      <div className="aurora" aria-hidden="true" />
      <main className="panel">
        <p className="eyebrow">ART Analytics</p>
        <h1>NYSE Research Repackager</h1>
        <p className="subtitle">
          Search an NYSE ticker, load your private PDF research, and get an AI-curated brief.
        </p>

        <form onSubmit={handleSubmit} className="search-row">
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="Enter ticker (e.g., IBM)"
            maxLength={5}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>

        {error && <div className="message error">{error}</div>}

        {result && (
          <section className="result-card">
            <h2>
              {result.companyName} ({result.ticker})
            </h2>
            <p className="exchange">Exchange: {result.exchange}</p>
            <article>{result.summary}</article>
          </section>
        )}
      </main>
    </div>
  );
}
