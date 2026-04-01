import CompactTickerBadge from '../common/CompactTickerBadge';
import useBatchMarketData from '../../hooks/useBatchMarketData';

export default function CoverageSection({
  coveredTickers,
  coverageLoading,
  coverageError,
  selectedTicker,
  onTickerClick
}) {
  const tickerSymbols = coveredTickers.map((item) => item.ticker);

  const {
    marketDataMap,
    marketLoading,
    marketError
  } = useBatchMarketData(tickerSymbols, coveredTickers.length > 0);

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
        <div className="coverage-list-scroll">
          <div className="coverage-list">
            {coveredTickers.map((item) => {
              const isSelected = selectedTicker === item.ticker;
              const batchItem = marketDataMap[item.ticker];

              const badgeMarketData = batchItem?.status === 'ok' ? batchItem.data : null;
              const badgeUnavailable = batchItem?.status === 'unavailable';
              const badgeLoading = marketLoading && !batchItem;
              const badgeError = marketError;

              return (
                <button
                  key={item.ticker}
                  type="button"
                  className={`coverage-list-item ${isSelected ? 'coverage-list-item-active' : ''}`}
                  onClick={() => onTickerClick(item.ticker)}
                >
                  <div className="coverage-list-left">
                    <span className="coverage-list-ticker">{item.ticker}</span>
                    <div className="coverage-list-text">
                      <p className="coverage-list-company">{item.companyName}</p>
                      <p className="coverage-list-meta">
                        {item.sector} • {item.exchange}
                      </p>
                    </div>
                  </div>

                  <div className="coverage-list-right">
                    <CompactTickerBadge
                      marketData={badgeMarketData}
                      marketLoading={badgeLoading}
                      marketError={badgeError}
                      marketUnavailable={badgeUnavailable}
                    />
                    {item.lastUpdated && (
                      <span className="coverage-list-updated">Updated: {item.lastUpdated}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}