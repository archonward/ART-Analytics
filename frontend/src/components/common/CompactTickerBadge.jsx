function formatPercent(value) {
  if (typeof value !== 'number') {
    return '—';
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

function getCompactLabel(marketState) {
  if (marketState === 'PRE') {
    return 'Pre';
  }

  if (marketState === 'POST') {
    return 'AH';
  }

  if (marketState === 'REGULAR') {
    return 'Live';
  }

  if (marketState === 'CLOSED') {
    return 'Closed';
  }

  return 'Market';
}

export default function CompactTickerBadge({
  marketData,
  marketLoading,
  marketError,
  marketUnavailable
}) {
  if (marketLoading) {
    return (
      <span className="compact-ticker-badge compact-ticker-badge-neutral">
        Loading...
      </span>
    );
  }

  if (marketError || marketUnavailable || !marketData) {
    return (
      <span className="compact-ticker-badge compact-ticker-badge-neutral">
        —
      </span>
    );
  }

  const displayChangePercent = getDisplayChangePercent(marketData);

  const isPositive = typeof displayChangePercent === 'number' && displayChangePercent > 0;
  const isNegative = typeof displayChangePercent === 'number' && displayChangePercent < 0;

  const badgeClassName = [
    'compact-ticker-badge',
    isPositive
      ? 'compact-ticker-badge-positive'
      : isNegative
        ? 'compact-ticker-badge-negative'
        : 'compact-ticker-badge-neutral'
  ].join(' ');

  return (
    <span className={badgeClassName}>
      {getCompactLabel(marketData.marketState)} {formatPercent(displayChangePercent)}
    </span>
  );
}