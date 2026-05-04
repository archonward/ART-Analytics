const REPORT_SECTIONS = [
  {
    index: '01',
    title: 'Executive Summary',
    desc: 'Thesis headline, key catalysts, primary risks, and a valuation bridge — the full investment case in one page.'
  },
  {
    index: '02',
    title: 'Financial Performance & Health',
    desc: 'Income statement, balance sheet, and cash flow analysis with annotated tables and trend commentary.'
  },
  {
    index: '03',
    title: 'Full DCF Valuation',
    desc: '5-year projections with bull, base, and bear scenarios. WACC, terminal value, and growth assumptions fully transparent.'
  },
  {
    index: '04',
    title: 'Multiples Analysis',
    desc: 'EV/EBITDA, P/E, P/FCF, and EV/Sales benchmarked against sector peers with a concluded valuation range.'
  },
  {
    index: '05',
    title: 'Competitive Moat Assessment',
    desc: 'Brand strength, network effects, switching costs, scale advantages, IP, and regulatory barriers — each rated and justified.'
  },
  {
    index: '06',
    title: 'Business Model & Segments',
    desc: 'Revenue breakdown by segment, margin profile, and how each business unit contributes to the overall thesis.'
  },
  {
    index: '07',
    title: 'Growth Strategy & Outlook',
    desc: 'Near-term catalysts, medium-term drivers, long-term opportunities, and TAM positioning with supporting data.'
  },
  {
    index: '08',
    title: 'Management & Governance',
    desc: 'Leadership track record, capital allocation history, insider alignment, and M&A activity assessed for value creation.'
  },
  {
    index: '09',
    title: 'Risk & Return Analysis',
    desc: 'Company-specific and macro risks mapped by probability and impact. Five key metrics to monitor quarterly, plus rating-change triggers.'
  }
];

export default function ReportDepthSection() {
  return (
    <section className="dashboard-module depth-module">
      <div className="depth-header">
        <div>
          <p className="section-label">What's inside every report</p>
          <h2 className="depth-headline">The same depth institutional investors pay thousands for.</h2>
          <p className="module-helper">
            Nine sections covering every dimension of the investment case — built for rigour, written for clarity.
          </p>
        </div>
        <span className="depth-count">9 sections per report</span>
      </div>

      <div className="depth-grid">
        {REPORT_SECTIONS.map((section) => (
          <div key={section.index} className="depth-card">
            <p className="depth-card-index">{section.index}</p>
            <div className="depth-card-line" aria-hidden="true" />
            <p className="depth-card-title">{section.title}</p>
            <p className="depth-card-desc">{section.desc}</p>
          </div>
        ))}
      </div>

      <div className="depth-footer">
        <div className="depth-footer-dot" aria-hidden="true" />
        <p className="depth-footer-text">
          Reports are authored by ART Analytics and refreshed periodically. All research reflects the analyst's view at the time of publication.
        </p>
      </div>
    </section>
  );
}
