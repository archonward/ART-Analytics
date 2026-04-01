import { useEffect, useRef } from 'react';
import CoverageSection from './components/dashboard/CoverageSection';
import AuditSection from './components/dashboard/AuditSection';
import ResultPanel from './components/report/ResultPanel';
import { SHOW_AUDIT_SECTION } from './config/features';
import useCoverage from './hooks/useCoverage';
import useReportAudit from './hooks/useReportAudit';
import useStockSearch from './hooks/useStockSearch';
import MarketOverviewSection from './components/dashboard/MarketOverviewSection';

export default function App() {
  const {
    ticker,
    setTicker,
    loading,
    error,
    result,
    selectedTicker,
    searchTicker,
    resetView
  } = useStockSearch();

  const {
    coveredTickers,
    coverageLoading,
    coverageError
  } = useCoverage();

  const {
    auditData,
    auditLoading,
    auditError
  } = useReportAudit(SHOW_AUDIT_SECTION);

  const resultRef = useRef(null);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [result]);

  async function handleSubmit(event) {
    event.preventDefault();
    await searchTicker(ticker);
  }

  async function handleCoveredTickerClick(nextTicker) {
    setTicker(nextTicker);
    await searchTicker(nextTicker);
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
            placeholder="Enter ticker (e.g., NVDA)"
            maxLength={5}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Search'}
          </button>
        </form>

        {error && <div className="message error">{error}</div>}

        <CoverageSection
          coveredTickers={coveredTickers}
          coverageLoading={coverageLoading}
          coverageError={coverageError}
          selectedTicker={selectedTicker}
          onTickerClick={handleCoveredTickerClick}
        />

        {!result && (
          <MarketOverviewSection />
        )}

        {SHOW_AUDIT_SECTION && (
          <AuditSection
            auditData={auditData}
            auditLoading={auditLoading}
            auditError={auditError}
          />
        )}

        <ResultPanel
          result={result}
          loading={loading}
          selectedTicker={selectedTicker}
          resultRef={resultRef}
          onResetView={resetView}
        />
      </main>
    </div>
  );
}
