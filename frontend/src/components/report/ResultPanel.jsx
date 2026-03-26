import CoveredReport from './CoveredReport';

export default function ResultPanel({
  result,
  loading,
  selectedTicker,
  resultRef,
  onResetView
}) {
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

          <button type="button" className="secondary-button" onClick={onResetView}>
            Back to Coverage
          </button>
        </div>
      </section>
    );
  }

  if (result.status === 'covered') {
    return (
      <CoveredReport
        reportData={result}
        resultRef={resultRef}
        onResetView={onResetView}
      />
    );
  }

  return null;
}