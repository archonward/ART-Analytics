export default function BulletList({ items }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <ul className="report-bullet-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
