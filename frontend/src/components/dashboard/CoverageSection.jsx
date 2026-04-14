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
    <section className="dashboard-module coverage-module">
      <div className="module-header coverage-header">
        <div className="module-title-block">
          <p className="section-label">Coverage Universe</p>
          <h2>Published coverage</h2>
          <p className="module-helper">
            Select a company to open its current research summary.
          </p>
        </div>
        {!coverageLoading && !coverageError && (
          <p className="coverage-count">{coveredTickers.length} names in universe</p>
        )}
      </div>

      {coverageLoading && <p className="coverage-message">Loading covered tickers...</p>}
      {coverageError && <p className="coverage-message coverage-error">{coverageError}</p>}

      {!coverageLoading && !coverageError && coveredTickers.length > 0 && (
        <div className="table-scroll coverage-table-scroll">
          <table className="coverage-table">
            <thead>
              <tr>
                <th scope="col">Ticker</th>
                <th scope="col">Company</th>
                <th scope="col">Sector</th>
                <th scope="col">Exchange</th>
                <th scope="col">Market</th>
                <th scope="col">Updated</th>
              </tr>
            </thead>
            <tbody>
              {coveredTickers.map((item) => {
                const isSelected = selectedTicker === item.ticker;
                const batchItem = marketDataMap[item.ticker];

                const badgeMarketData = batchItem?.status === 'ok' ? batchItem.data : null;
                const badgeUnavailable = batchItem?.status === 'unavailable';
                const badgeLoading = marketLoading && !batchItem;
                const badgeError = marketError;

                return (
                  <tr
                    key={item.ticker}
                    className={`coverage-row ${isSelected ? 'coverage-row-active' : ''}`}
                  >
                    <td className="coverage-cell-primary">
                      <button
                        type="button"
                        className="coverage-row-button"
                        onClick={() => onTickerClick(item.ticker)}
                      >
                        <span className="coverage-list-ticker">{item.ticker}</span>
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="coverage-row-button coverage-company-button"
                        onClick={() => onTickerClick(item.ticker)}
                      >
                        <span className="coverage-list-company">{item.companyName}</span>
                      </button>
                    </td>
                    <td className="coverage-list-meta">{item.sector || '-'}</td>
                    <td className="coverage-list-meta">{item.exchange || '-'}</td>
                    <td>
                      <CompactTickerBadge
                        marketData={badgeMarketData}
                        marketLoading={badgeLoading}
                        marketError={badgeError}
                        marketUnavailable={badgeUnavailable}
                      />
                    </td>
                    <td className="coverage-list-updated">{item.lastUpdated || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
