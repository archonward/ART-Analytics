import useMarketOverview from '../../hooks/useMarketOverview';

function formatPrice(value, currency = 'USD') {
  if (typeof value !== 'number') {
    return '—';
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

function formatNumberChange(value) {
  if (typeof value !== 'number') {
    return '—';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

function formatPercent(value) {
  if (typeof value !== 'number') {
    return '—';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function getDisplayPrice(marketData) {
  if (marketData.marketState === 'PRE' && typeof marketData.preMarketPrice === 'number') {
    return marketData.preMarketPrice;
  }

  if (marketData.marketState === 'POST' && typeof marketData.postMarketPrice === 'number') {
    return marketData.postMarketPrice;
  }

  return marketData.regularMarketPrice;
}

function getDisplayChange(marketData) {
  if (marketData.marketState === 'PRE' && typeof marketData.preMarketChange === 'number') {
    return marketData.preMarketChange;
  }

  if (marketData.marketState === 'POST' && typeof marketData.postMarketChange === 'number') {
    return marketData.postMarketChange;
  }

  return marketData.regularMarketChange;
}

function getDisplayChangePercent(marketData) {
  if (marketData.marketState === 'PRE' && typeof marketData.preMarketChangePercent === 'number') {
    return marketData.preMarketChangePercent;
  }

  if (marketData.marketState === 'POST' && typeof marketData.postMarketChangePercent === 'number') {
    return marketData.postMarketChangePercent;
  }

  return marketData.regularMarketChangePercent;
}

export default function MarketOverviewSection() {
  const {
    overviewItems,
    overviewLoading,
    overviewError
  } = useMarketOverview(true);

  return (
    <section className="market-overview-card">
      <div className="market-overview-header">
        <div>
          <p className="section-label">Macro Snapshot</p>
          <h2>Market Overview</h2>
        </div>
      </div>

      {overviewLoading && overviewItems.length === 0 && (
        <p className="coverage-message">Loading market overview...</p>
      )}

      {overviewError && (
        <p className="coverage-message coverage-error">{overviewError}</p>
      )}

      {!overviewLoading && !overviewError && overviewItems.length > 0 && (
        <div className="market-overview-table-wrap">
          <table className="market-overview-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Last Price</th>
                <th>Daily Chg.</th>
                <th>Daily %</th>
              </tr>
            </thead>
            <tbody>
              {overviewItems.map((item) => {
                const marketData = item.status === 'ok' ? item.data : null;
                const displayPrice = marketData ? getDisplayPrice(marketData) : null;
                const displayChange = marketData ? getDisplayChange(marketData) : null;
                const displayChangePercent = marketData
                  ? getDisplayChangePercent(marketData)
                  : null;

                const isPositive =
                  typeof displayChangePercent === 'number' && displayChangePercent > 0;
                const isNegative =
                  typeof displayChangePercent === 'number' && displayChangePercent < 0;

                const rowClassName = isPositive
                  ? 'market-overview-positive'
                  : isNegative
                    ? 'market-overview-negative'
                    : '';

                return (
                  <tr key={item.symbol}>
                    <td className="market-overview-symbol">{item.displaySymbol}</td>
                    <td className="market-overview-name">{item.name}</td>
                    <td>{marketData ? formatPrice(displayPrice, marketData.currency || 'USD') : '—'}</td>
                    <td className={rowClassName}>
                      {marketData ? formatNumberChange(displayChange) : '—'}
                    </td>
                    <td className={rowClassName}>
                      {marketData ? formatPercent(displayChangePercent) : '—'}
                    </td>
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