export default function SectionCard({ title, children, id }) {
  return (
    <section className="report-section" id={id}>
      <header className="report-section-header">
        <h3>{title}</h3>
      </header>
      <div className="report-section-body">
        {children}
      </div>
    </section>
  );
}
