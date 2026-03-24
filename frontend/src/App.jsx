import { useEffect, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function App() {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [selectedTicker, setSelectedTicker] = useState('');

  const [coveredTickers, setCoveredTickers] = useState([]);
  const [coverageLoading, setCoverageLoading] = useState(true);
  const [coverageError, setCoverageError] = useState('');

  const resultRef = useRef(null);

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

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [result]);

  async function searchTicker(targetTicker) {
    const normalizedTicker = targetTicker.trim().toUpperCase();

    setLoading(true);
    setError('');
    setResult(null);
    setSelectedTicker(normalizedTicker);

    try {
      const response = await fetch(
        `${API_BASE}/api/stock-summary?ticker=${encodeURIComponent(normalizedTicker)}`
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

  async function handleSubmit(event) {
    event.preventDefault();
    await searchTicker(ticker);
  }

  async function handleCoveredTickerClick(selectedTickerValue) {
    setTicker(selectedTickerValue);
    await searchTicker(selectedTickerValue);
  }

  function handleResetView() {
    setTicker('');
    setError('');
    setResult(null);
    setSelectedTicker('');
  }

  function renderCoveredReport(reportData) {
    return (
      <section className="result-card" ref={resultRef}>
        <div className="result-header-row">
          <div>
            <h2>
              {reportData.companyName} ({reportData.ticker})
            </h2>
            <p className="exchange">Exchange: {reportData.exchange}</p>
            {reportData.sector && <p className="meta-line">Sector: {reportData.sector}</p>}
            {reportData.lastUpdated && (
              <p className="meta-line">Research Updated: {reportData.lastUpdated}</p>
            )}
          </div>

          <button type="button" className="secondary-button" onClick={handleResetView}>
            Back to Coverage
          </button>
        </div>

        <div className="report-section">
          <h3>{reportData.report.title}</h3>
        </div>

        <div className="report-section">
          <h3>Investment Thesis</h3>
          <ul>
            {reportData.report.investmentThesis.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="report-section">
          <h3>Key Points</h3>
          <ul>
            {reportData.report.keyPoints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="report-section">
          <h3>Risks</h3>
          <ul>
            {reportData.report.risks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="report-section">
          <h3>Conclusion</h3>
          <p>{reportData.report.conclusion}</p>
        </div>
      </section>
    );
  }

  function renderResult() {
    if (loading) {
      return (
        <section className="result-card loading-card" ref={resultRef}>
          <h2>Loading report...</h2>
          <p className="loading-message">
            ART Analytics is retrieving the published research summary for {selectedTicker || 'your search'}.
          </p>
        </section>
      );
    }

    if (!result) {
      return (
        <section className="result-card empty-state-card">
          <h2>Start with a covered stock</h2>
          <p className="empty-state-message">
            Search for a ticker directly or choose one from the coverage universe below to open its published research summary.
          </p>
        </section>
      );
    }

    if (result.status === 'not_researched') {
      return (
        <section className="result-card not-researched-card" ref={resultRef}>
          <div className="result-header-row">
            <div>
              <h2>{result.ticker}</h2>
              <p className="not-researched-message">{result.message}</p>
              <p className="not-researched-subtext">
                ART Analytics currently only displays companies that are part of our published internal research coverage.
              </p>
            </div>

            <button type="button" className="secondary-button" onClick={handleResetView}>
              Back to Coverage
            </button>
          </div>
        </section>
      );
    }

    if (result.status === 'covered') {
      return renderCoveredReport(result);
    }

    return null;
  }

  function renderCoverageSection() {
    return (
      <section className="coverage-card">
        <div className="coverage-header">
          <div>
            <p className="section-label">Coverage Universe</p>
            <h2>Currently Covered</h2>
          </div>
          {!coverageLoading && !coverageError && (
            <p className="coverage-count">{coveredTickers.length} published reports</p>
          )}
        </div>

        {coverageLoading && <p className="coverage-message">Loading covered tickers...</p>}

        {coverageError && <p className="coverage-message coverage-error">{coverageError}</p>}

        {!coverageLoading && !coverageError && coveredTickers.length === 0 && (
          <p className="coverage-message">No published reports are currently available.</p>
        )}

        {!coverageLoading && !coverageError && coveredTickers.length > 0 && (
          <div className="coverage-grid">
            {coveredTickers.map((item) => {
              const isSelected = selectedTicker === item.ticker;

              return (
                <button
                  key={item.ticker}
                  type="button"
                  className={`coverage-ticker-card ${isSelected ? 'coverage-ticker-card-active' : ''}`}
                  onClick={() => handleCoveredTickerClick(item.ticker)}
                >
                  <div className="coverage-ticker-top">
                    <span className="coverage-ticker">{item.ticker}</span>
                    <span className="coverage-exchange">{item.exchange}</span>
                  </div>
                  <p className="coverage-company">{item.companyName}</p>
                  {item.sector && <p className="coverage-sector">{item.sector}</p>}
                  {item.lastUpdated && (
                    <p className="coverage-updated">Updated: {item.lastUpdated}</p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="app-shell">
      <div className="aurora" aria-hidden="true" />
      <main className="panel">
        <p className="eyebrow">ART Analytics</p>
        <h1>Curated NYSE Research Summaries</h1>
        <p className="subtitle">
          Search a stock we cover and read a clear summary of our published internal research.
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
            {loading ? 'Loading...' : 'Search'}
          </button>
        </form>

        {error && <div className="message error">{error}</div>}

        {renderCoverageSection()}

        {renderResult()}
      </main>
    </div>
  );
}