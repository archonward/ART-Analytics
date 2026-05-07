function formatPrice(value, currency = 'USD') {
  if (typeof value !== 'number') {
    return '-';
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

function formatPercent(value) {
  if (typeof value !== 'number') {
    return '-';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
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

function getDisplayPrice(marketData) {
  if (marketData.marketState === 'PRE' && typeof marketData.preMarketPrice === 'number') {
    return marketData.preMarketPrice;
  }

  if (marketData.marketState === 'POST' && typeof marketData.postMarketPrice === 'number') {
    return marketData.postMarketPrice;
  }

  return marketData.regularMarketPrice;
}

function getMarketStateLabel(marketState) {
  if (marketState === 'PRE') {
    return 'Pre';
  }

  if (marketState === 'POST') {
    return 'After hours';
  }

  if (marketState === 'REGULAR') {
    return 'Daily';
  }

  if (marketState === 'CLOSED') {
    return 'Closed';
  }

  return 'Daily';
}

export default function LiveTickerBadge({
  marketData,
  marketLoading,
  marketError,
  marketUnavailable
}) {
  if (marketLoading) {
    return (
      <div className="live-ticker-badge live-ticker-badge-neutral">
        <span className="live-ticker-label">Daily</span>
        <span className="live-ticker-value">Loading...</span>
      </div>
    );
  }

  if (marketError || marketUnavailable || !marketData) {
    return (
      <div className="live-ticker-badge live-ticker-badge-neutral">
        <span className="live-ticker-label">Daily</span>
        <span className="live-ticker-value">Unavailable</span>
      </div>
    );
  }

  const displayPrice = getDisplayPrice(marketData);
  const displayChangePercent = getDisplayChangePercent(marketData);

  const isPositive = typeof displayChangePercent === 'number' && displayChangePercent > 0;
  const isNegative = typeof displayChangePercent === 'number' && displayChangePercent < 0;

  const badgeClassName = [
    'live-ticker-badge',
    isPositive
      ? 'live-ticker-badge-positive'
      : isNegative
        ? 'live-ticker-badge-negative'
        : 'live-ticker-badge-neutral'
  ].join(' ');

  return (
    <div className={badgeClassName}>
      <span className="live-ticker-label">{getMarketStateLabel(marketData.marketState)}</span>
      <span className="live-ticker-price">
        {formatPrice(displayPrice, marketData.currency || 'USD')}
      </span>
      <span className="live-ticker-change">
        {formatPercent(displayChangePercent)}
      </span>
    </div>
  );
}
