export default function CoverageSection({
  coveredTickers,
  coverageLoading,
  coverageError,
  selectedTicker,
  onTickerClick
}) {
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

      {!coverageLoading && !coverageError && coveredTickers.length > 0 && (
        <div className="coverage-grid">
          {coveredTickers.map((item) => {
            const isSelected = selectedTicker === item.ticker;

            return (
              <button
                key={item.ticker}
                type="button"
                className={`coverage-ticker-card ${isSelected ? 'coverage-ticker-card-active' : ''}`}
                onClick={() => onTickerClick(item.ticker)}
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