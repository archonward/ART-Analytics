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
      <section className="result-state result-state-loading" ref={resultRef}>
        <div className="result-state-header">
          <p className="section-label">Loading</p>
          <h2>Retrieving report</h2>
        </div>
        <p className="loading-message">
          ART Analytics is retrieving the published research summary for {selectedTicker || 'your search'}.
        </p>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="result-state result-state-empty">
        <div className="result-state-header">
          <p className="section-label">Coverage search</p>
          <h2>Select a covered company</h2>
        </div>
        <p className="empty-state-message">
          Search for a ticker directly or choose one from the coverage universe to open its published research summary.
        </p>
      </section>
    );
  }

  if (result.status === 'not_researched') {
    return (
      <section className="result-state result-state-warning" ref={resultRef}>
        <div className="result-header-row">
          <div>
            <p className="section-label">Unavailable</p>
            <h2>{result.ticker}</h2>
            <p className="not-researched-message">{result.message}</p>
            <p className="not-researched-subtext">
              ART Analytics currently displays companies that are part of the published internal research universe.
            </p>
          </div>

          <button type="button" className="secondary-button" onClick={onResetView}>
            Back to coverage
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
