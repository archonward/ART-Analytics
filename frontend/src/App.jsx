import { useEffect, useMemo, useRef, useState } from 'react';
import CoverageSection from './components/dashboard/CoverageSection';
import AuditSection from './components/dashboard/AuditSection';
import ResultPanel from './components/report/ResultPanel';
import AskReportPanel from './components/report/AskReportPanel';
import { SHOW_AUDIT_SECTION } from './config/features';
import useCoverage from './hooks/useCoverage';
import useReportAudit from './hooks/useReportAudit';
import useStockSearch from './hooks/useStockSearch';
import MarketOverviewSection from './components/dashboard/MarketOverviewSection';
import { getReportSectionId } from './components/report/reportSections';

function parseDateValue(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatStatusDate(value) {
  const parsed = parseDateValue(value);

  if (!parsed) {
    return 'Pending';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(parsed);
}

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
  const [isAskPanelOpen, setIsAskPanelOpen] = useState(true);
  const activeReport = result?.status === 'covered' ? result : null;

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [result]);

  useEffect(() => {
    if (activeReport) {
      setIsAskPanelOpen(true);
    }
  }, [activeReport]);

  async function handleSubmit(event) {
    event.preventDefault();
    await searchTicker(ticker);
  }

  async function handleCoveredTickerClick(nextTicker) {
    setTicker(nextTicker);
    await searchTicker(nextTicker);
  }

  const hasDashboardResult = loading || (result && result.status !== 'covered');

  const coverageFreshness = useMemo(() => {
    const latestDate = coveredTickers.reduce((latest, item) => {
      const parsed = parseDateValue(item.lastUpdated);

      if (!parsed) {
        return latest;
      }

      if (!latest || parsed > latest) {
        return parsed;
      }

      return latest;
    }, null);

    return latestDate ? formatStatusDate(latestDate) : 'Pending';
  }, [coveredTickers]);

  const freshnessLabel = activeReport?.meta?.reportDate
    ? `Report dated ${formatStatusDate(activeReport.meta.reportDate)}`
    : `Coverage refreshed ${coverageFreshness}`;

  function handleCitationClick(citation) {
    const targetId = getReportSectionId(citation.sectionKey);

    if (!targetId) {
      return;
    }

    const targetElement = document.getElementById(targetId);
    if (!targetElement) {
      return;
    }

    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-bar">
          <div className="brand-block">
            <p className="brand-kicker">ART Analytics</p>
            <div>
              <h1 className="brand-title">Institutional Research Workspace</h1>
              <p className="brand-subtitle">
                Curated coverage, market context, and report-level interrogation in one restrained workspace.
              </p>
            </div>
          </div>

          <div className="app-status" aria-label="Data freshness">
            <span className="status-dot" aria-hidden="true" />
            <div>
              <p className="status-label">Data freshness</p>
              <p className="status-value">{freshnessLabel}</p>
            </div>
          </div>
        </div>

        <div className="app-toolbar">
          <div className="toolbar-copy">
            <p className="toolbar-label">Coverage Search</p>
            <p className="toolbar-note">
              Search a covered ticker or open a report from the universe below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="toolbar-search">
            <label className="toolbar-search-field" htmlFor="ticker-search">
              <span className="toolbar-search-label">Ticker</span>
              <input
                id="ticker-search"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="Enter ticker, for example NVDA"
                maxLength={5}
                required
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Loading...' : 'Open report'}
            </button>
          </form>
        </div>

        {error && <div className="message error header-message">{error}</div>}
      </header>

      <div className={`workspace ${activeReport ? 'workspace-report' : 'workspace-dashboard'}`}>
        {!activeReport && (
          <main className="dashboard-layout">
            {hasDashboardResult && (
              <ResultPanel
                result={result}
                loading={loading}
                selectedTicker={selectedTicker}
                resultRef={resultRef}
                onResetView={resetView}
              />
            )}

            <div className="dashboard-main">
              <MarketOverviewSection />
              <CoverageSection
                coveredTickers={coveredTickers}
                coverageLoading={coverageLoading}
                coverageError={coverageError}
                selectedTicker={selectedTicker}
                onTickerClick={handleCoveredTickerClick}
              />
            </div>

            {SHOW_AUDIT_SECTION && (
              <aside className="dashboard-secondary">
                <AuditSection
                  auditData={auditData}
                  auditLoading={auditLoading}
                  auditError={auditError}
                />
              </aside>
            )}
          </main>
        )}

        {activeReport && (
          <div className="report-layout">
            <main className="report-main">
              <ResultPanel
                result={result}
                loading={loading}
                selectedTicker={selectedTicker}
                resultRef={resultRef}
                onResetView={resetView}
              />
            </main>

            <aside
              className={`ask-report-rail ${isAskPanelOpen ? 'ask-report-rail-open' : ''}`}
              aria-label="Ask the Report workspace"
            >
              <button
                type="button"
                className="ask-report-rail-toggle"
                onClick={() => setIsAskPanelOpen((previous) => !previous)}
                aria-expanded={isAskPanelOpen}
              >
                <span>Ask the report</span>
                <span className="ask-report-rail-toggle-meta">
                  {isAskPanelOpen ? 'Hide panel' : 'Show panel'}
                </span>
              </button>

              <div className="ask-report-rail-inner">
                <AskReportPanel
                  ticker={activeReport.meta.ticker}
                  companyName={activeReport.meta.companyName}
                  onCitationClick={handleCitationClick}
                />
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
