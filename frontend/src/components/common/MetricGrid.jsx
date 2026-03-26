export default function MetricGrid({ items }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="metric-grid">
      {items.map((item) => (
        <div key={item.label} className="metric-card">
          <p className="metric-label">{item.label}</p>
          <p className="metric-value">{item.value}</p>
        </div>
      ))}
    </div>
  );
}