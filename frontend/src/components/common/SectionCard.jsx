export default function SectionCard({ title, children, id }) {
  return (
    <div className="report-section" id={id}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}
