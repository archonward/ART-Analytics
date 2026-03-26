export default function SectionCard({ title, children }) {
  return (
    <div className="report-section">
      <h3>{title}</h3>
      {children}
    </div>
  );
}