function getAuditStatusLabel(status) {
  if (status === 'ok') {
    return 'Valid';
  }

  if (status === 'invalid_schema') {
    return 'Schema Issue';
  }

  if (status === 'invalid_json') {
    return 'Invalid JSON';
  }

  if (status === 'missing_file') {
    return 'Missing File';
  }

  return 'Error';
}

export default function AuditSection({ auditData, auditLoading, auditError }) {
  return (
    <section className="audit-card">
      <div className="audit-header">
        <div>
          <p className="section-label">Internal Diagnostics</p>
          <h2>Coverage Health</h2>
        </div>
      </div>

      {auditLoading && <p className="coverage-message">Loading report audit...</p>}
      {auditError && <p className="coverage-message coverage-error">{auditError}</p>}

      {!auditLoading && !auditError && auditData?.summary && (
        <>
          <div className="audit-summary-grid compact-audit-summary-grid">
            <div className="audit-summary-item">
              <p className="audit-summary-label">Total Covered</p>
              <p className="audit-summary-value">{auditData.summary.total}</p>
            </div>
            <div className="audit-summary-item">
              <p className="audit-summary-label">Valid</p>
              <p className="audit-summary-value">{auditData.summary.ok}</p>
            </div>
            <div className="audit-summary-item">
              <p className="audit-summary-label">Schema Issues</p>
              <p className="audit-summary-value">{auditData.summary.invalid_schema}</p>
            </div>
            <div className="audit-summary-item">
              <p className="audit-summary-label">Invalid JSON</p>
              <p className="audit-summary-value">{auditData.summary.invalid_json}</p>
            </div>
          </div>

          <div className="audit-list-scroll">
            <div className="audit-list compact-audit-list">
              {auditData.reports.map((item) => (
                <div key={item.ticker} className="audit-list-item">
                  <div className="audit-list-main">
                    <div>
                      <p className="audit-report-ticker">{item.ticker}</p>
                      <p className="audit-report-company">{item.companyName}</p>
                    </div>
                    <span className={`audit-badge audit-badge-${item.status}`}>
                      {getAuditStatusLabel(item.status)}
                    </span>
                  </div>

                  {item.issues.length > 0 && (
                    <ul className="audit-issues-list compact-audit-issues-list">
                      {item.issues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}