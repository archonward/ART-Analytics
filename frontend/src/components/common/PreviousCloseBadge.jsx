function normalizePriceValue(value) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed;
}

export default function PreviousCloseBadge({ price, currency, asOf }) {
  const displayPrice = normalizePriceValue(price);

  if (!displayPrice) {
    return (
      <div className="previous-close-badge previous-close-badge-neutral">
        <span className="previous-close-label">Previous Close</span>
        <span className="previous-close-value">
          Previous close data is not available for this report.
        </span>
      </div>
    );
  }

  return (
    <div className="previous-close-badge previous-close-badge-neutral">
      <span className="previous-close-label">Previous Close</span>
      <span className="previous-close-price">
        {currency ? `${displayPrice} ${currency}` : displayPrice}
      </span>
      <span className="previous-close-as-of">
        {asOf ? `As of previous market close: ${asOf}` : 'As of previous market close'}
      </span>
    </div>
  );
}
