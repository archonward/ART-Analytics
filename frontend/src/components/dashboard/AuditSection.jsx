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
          <div className="audit-summary-grid">
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
            <div className="audit-summary-item">
              <p className="audit-summary-label">Missing Files</p>
              <p className="audit-summary-value">{auditData.summary.missing_file}</p>
            </div>
            <div className="audit-summary-item">
              <p className="audit-summary-label">Other Errors</p>
              <p className="audit-summary-value">{auditData.summary.error}</p>
            </div>
          </div>

          <div className="audit-list">
            {auditData.reports.map((item) => (
              <div key={item.ticker} className="audit-report-card">
                <div className="audit-report-top">
                  <div>
                    <p className="audit-report-ticker">{item.ticker}</p>
                    <p className="audit-report-company">{item.companyName}</p>
                  </div>
                  <span className={`audit-badge audit-badge-${item.status}`}>
                    {getAuditStatusLabel(item.status)}
                  </span>
                </div>

                {item.issues.length > 0 && (
                  <ul className="audit-issues-list">
                    {item.issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}