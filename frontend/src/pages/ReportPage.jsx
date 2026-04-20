import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AskReportPanel from '../components/report/AskReportPanel';
import ResultPanel from '../components/report/ResultPanel';
import { getReportSectionId } from '../components/report/reportSections';
import useStockSearch from '../hooks/useStockSearch';

export default function ReportPage() {
  const navigate = useNavigate();
  const { ticker: routeTickerParam = '' } = useParams();
  const routeTicker = routeTickerParam.trim().toUpperCase();
  const resultRef = useRef(null);
  const [isAskPanelOpen, setIsAskPanelOpen] = useState(true);
  const [isRouteSearchReady, setIsRouteSearchReady] = useState(false);

  const {
    ticker,
    setTicker,
    loading,
    error,
    result,
    selectedTicker,
    searchTicker
  } = useStockSearch();

  const activeReport = result?.status === 'covered' ? result : null;
  const reportLayoutClassName = activeReport
    ? 'report-layout'
    : 'report-layout report-layout-main-only';

  useEffect(() => {
    if (!routeTicker) {
      setIsRouteSearchReady(false);
      navigate('/', { replace: true });
      return;
    }

    if (routeTickerParam !== routeTicker) {
      setIsRouteSearchReady(false);
      navigate(`/report/${routeTicker}`, { replace: true });
      return;
    }

    setIsRouteSearchReady(true);
    setTicker(routeTicker);
    searchTicker(routeTicker);
  }, [navigate, routeTicker, routeTickerParam, searchTicker, setTicker]);

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

  function handleBackToCoverage() {
    navigate('/');
  }

  return (
    <div className={reportLayoutClassName}>
      <main className="report-main">
        {error && <div className="message error report-page-error">{error}</div>}
        {(isRouteSearchReady ? (loading || Boolean(result)) : true) && (
          <ResultPanel
            result={result}
            loading={loading || !isRouteSearchReady}
            selectedTicker={selectedTicker || ticker || routeTicker}
            resultRef={resultRef}
            onResetView={handleBackToCoverage}
          />
        )}
      </main>

      {activeReport && (
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
      )}
    </div>
  );
}
