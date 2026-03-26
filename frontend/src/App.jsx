import { useEffect, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

function MetricGrid({ items }) {
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

function BulletList({ items }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function ParagraphBlock({ paragraphs }) {
  if (!paragraphs || paragraphs.length === 0) {
    return null;
  }

  return (
    <>
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </>
  );
}

function DataTable({ table }) {
  if (!table || !table.columns || !table.rows) {
    return null;
  }

  return (
    <div className="table-wrap">
      {table.title && <h4 className="table-title">{table.title}</h4>}
      <table className="report-table">
        <thead>
          <tr>
            {table.columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={`${table.title || 'table'}-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="report-section">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

export default function App() {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [selectedTicker, setSelectedTicker] = useState('');

  const [coveredTickers, setCoveredTickers] = useState([]);
  const [coverageLoading, setCoverageLoading] = useState(true);
  const [coverageError, setCoverageError] = useState('');

  const [auditData, setAuditData] = useState(null);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState('');

  const resultRef = useRef(null);

  useEffect(() => {
    async function loadCoverage() {
      try {
        setCoverageLoading(true);
        setCoverageError('');

        const response = await fetch(`${API_BASE}/api/coverage`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Could not load coverage list.');
        }

        setCoveredTickers(data.coveredTickers || []);
      } catch (err) {
        setCoverageError(err.message);
      } finally {
        setCoverageLoading(false);
      }
    }

    async function loadAudit() {
      try {
        setAuditLoading(true);
        setAuditError('');

        const response = await fetch(`${API_BASE}/api/report-audit`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Could not load report audit.');
        }

        setAuditData(data);
      } catch (err) {
        setAuditError(err.message);
      } finally {
        setAuditLoading(false);
      }
    }

    loadCoverage();
    loadAudit();
  }, []);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [result]);

  async function searchTicker(targetTicker) {
    const normalizedTicker = targetTicker.trim().toUpperCase();

    setLoading(true);
    setError('');
    setResult(null);
    setSelectedTicker(normalizedTicker);

    try {
      const response = await fetch(
        `${API_BASE}/api/stock-summary?ticker=${encodeURIComponent(normalizedTicker)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not fetch stock summary.');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await searchTicker(ticker);
  }

  async function handleCoveredTickerClick(selectedTickerValue) {
    setTicker(selectedTickerValue);
    await searchTicker(selectedTickerValue);
  }

  function handleResetView() {
    setTicker('');
    setError('');
    setResult(null);
    setSelectedTicker('');
  }

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

  function renderAuditSection() {
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

  function renderCoveredReport(reportData) {
    const { meta } = reportData;

    return (
      <section className="result-card" ref={resultRef}>
        <div className="result-header-row">
          <div>
            <h2>
              {meta.companyName} ({meta.ticker})
            </h2>
            <p className="exchange">Exchange: {meta.exchange}</p>
            {meta.sector && <p className="meta-line">Sector: {meta.sector}</p>}
            {meta.industry && <p className="meta-line">Industry: {meta.industry}</p>}
            {meta.reportDate && <p className="meta-line">Report Date: {meta.reportDate}</p>}
          </div>

          <button type="button" className="secondary-button" onClick={handleResetView}>
            Back to Coverage
          </button>
        </div>

        <SectionCard title="Executive At-a-Glance">
          <p className="thesis-headline">{reportData.executiveAtAGlance.thesisHeadline}</p>
          <MetricGrid items={reportData.executiveAtAGlance.snapshotMetrics} />
        </SectionCard>

        <SectionCard title="Executive Summary">
          <ParagraphBlock paragraphs={reportData.executiveSummary.summaryParagraphs} />

          <h4>Top Catalysts</h4>
          <BulletList items={reportData.executiveSummary.catalysts} />

          <h4>Primary Risks</h4>
          <BulletList items={reportData.executiveSummary.primaryRisks} />

          <h4>Valuation Bridge</h4>
          <p>{reportData.executiveSummary.valuationBridge}</p>
        </SectionCard>

        <SectionCard title="Financial Performance & Health">
          <h4>Income Statement Analysis</h4>
          <ParagraphBlock
            paragraphs={reportData.financialPerformanceHealth.incomeStatementAnalysis.summaryParagraphs}
          />
          <BulletList items={reportData.financialPerformanceHealth.incomeStatementAnalysis.highlights} />
          {reportData.financialPerformanceHealth.incomeStatementAnalysis.tables.map((table) => (
            <DataTable key={table.title} table={table} />
          ))}

          <h4>Balance Sheet Analysis</h4>
          <ParagraphBlock
            paragraphs={reportData.financialPerformanceHealth.balanceSheetAnalysis.summaryParagraphs}
          />

          <h4>Cash Flow & Returns</h4>
          <ParagraphBlock
            paragraphs={reportData.financialPerformanceHealth.cashFlowReturns.summaryParagraphs}
          />
          <BulletList items={reportData.financialPerformanceHealth.cashFlowReturns.highlights} />
        </SectionCard>

        <SectionCard title="Valuation">
          <h4>Multiples Analysis</h4>
          <ParagraphBlock paragraphs={reportData.valuation.multiplesAnalysis.summaryParagraphs} />
          {reportData.valuation.multiplesAnalysis.tables.map((table) => (
            <DataTable key={table.title} table={table} />
          ))}

          <h4>DCF Analysis</h4>
          <ParagraphBlock paragraphs={reportData.valuation.dcfAnalysis.summaryParagraphs} />
          <BulletList items={reportData.valuation.dcfAnalysis.assumptions} />

          <h4>Valuation Conclusion</h4>
          <p>{reportData.valuation.valuationConclusion}</p>
        </SectionCard>

        <SectionCard title="Business Model & Competitive Moat">
          <h4>Segment Profile</h4>
          <ParagraphBlock paragraphs={reportData.businessModelMoat.segmentProfile.summaryParagraphs} />
          <DataTable table={reportData.businessModelMoat.segmentProfile.segmentTable} />

          <h4>Economic Moat Assessment</h4>
          <ParagraphBlock
            paragraphs={reportData.businessModelMoat.economicMoatAssessment.summaryParagraphs}
          />
          <DataTable table={reportData.businessModelMoat.economicMoatAssessment.moatTable} />
          <p>{reportData.businessModelMoat.economicMoatAssessment.overallMoatConclusion}</p>
        </SectionCard>

        <SectionCard title="Growth Strategy & Future Outlook">
          <h4>Near-Term Catalysts</h4>
          <BulletList items={reportData.growthStrategyOutlook.nearTermCatalysts} />

          <h4>Medium-Term Drivers</h4>
          <BulletList items={reportData.growthStrategyOutlook.mediumTermDrivers} />

          <h4>Long-Term Opportunities</h4>
          <BulletList items={reportData.growthStrategyOutlook.longTermOpportunities} />

          <h4>TAM & Positioning</h4>
          <ParagraphBlock paragraphs={reportData.growthStrategyOutlook.tamPositioning.summaryParagraphs} />
          <BulletList items={reportData.growthStrategyOutlook.tamPositioning.highlights} />
        </SectionCard>

        <SectionCard title="Management & Governance">
          <h4>Leadership</h4>
          <ParagraphBlock paragraphs={reportData.managementGovernance.leadership.summaryParagraphs} />

          <h4>Capital Allocation</h4>
          <ParagraphBlock paragraphs={reportData.managementGovernance.capitalAllocation.summaryParagraphs} />
          <DataTable table={reportData.managementGovernance.capitalAllocation.acquisitionTable} />

          <h4>Alignment</h4>
          <ParagraphBlock paragraphs={reportData.managementGovernance.alignment.summaryParagraphs} />
        </SectionCard>

        <SectionCard title="Risk Analysis">
          <DataTable table={reportData.riskAnalysis.riskTable} />
        </SectionCard>

        <SectionCard title="Final Recommendation">
          <div className="metric-grid">
            <div className="metric-card">
              <p className="metric-label">Rating</p>
              <p className="metric-value">{reportData.finalRecommendation.rating}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Price Target</p>
              <p className="metric-value">{reportData.finalRecommendation.priceTarget}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Implied Upside</p>
              <p className="metric-value">{reportData.finalRecommendation.impliedUpsidePct}</p>
            </div>
          </div>

          <h4>Bull / Base / Bear</h4>
          <ul>
            <li>Bull: {reportData.finalRecommendation.bullBaseBear.bull}</li>
            <li>Base: {reportData.finalRecommendation.bullBaseBear.base}</li>
            <li>Bear: {reportData.finalRecommendation.bullBaseBear.bear}</li>
          </ul>

          <h4>Valuation Methodology</h4>
          <p>{reportData.finalRecommendation.valuationMethodology}</p>

          <h4>Five Key Metrics to Watch</h4>
          <BulletList items={reportData.finalRecommendation.fiveKeyMetricsToWatch} />

          <h4>What Would Change the Rating</h4>
          <div className="table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Direction</th>
                  <th>Specific Trigger</th>
                </tr>
              </thead>
              <tbody>
                {reportData.finalRecommendation.ratingChangeTriggers.map((item, index) => (
                  <tr key={`${item.action}-${index}`}>
                    <td>{item.action}</td>
                    <td>{item.direction}</td>
                    <td>{item.trigger}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>{reportData.finalRecommendation.closingParagraph}</p>
        </SectionCard>

        <SectionCard title="Open Questions & Narrative Checkpoints">
          <BulletList items={reportData.openQuestions} />
        </SectionCard>
      </section>
    );
  }

  function renderResult() {
    if (loading) {
      return (
        <section className="result-card loading-card" ref={resultRef}>
          <h2>Loading report...</h2>
          <p className="loading-message">
            ART Analytics is retrieving the published research summary for {selectedTicker || 'your search'}.
          </p>
        </section>
      );
    }

    if (!result) {
      return (
        <section className="result-card empty-state-card">
          <h2>Start with a covered stock</h2>
          <p className="empty-state-message">
            Search for a ticker directly or choose one from the coverage universe below to open its published research summary.
          </p>
        </section>
      );
    }

    if (result.status === 'not_researched') {
      return (
        <section className="result-card not-researched-card" ref={resultRef}>
          <div className="result-header-row">
            <div>
              <h2>{result.ticker}</h2>
              <p className="not-researched-message">{result.message}</p>
              <p className="not-researched-subtext">
                ART Analytics currently only displays companies that are part of our published internal research coverage.
              </p>
            </div>

            <button type="button" className="secondary-button" onClick={handleResetView}>
              Back to Coverage
            </button>
          </div>
        </section>
      );
    }

    if (result.status === 'covered') {
      return renderCoveredReport(result);
    }

    return null;
  }

  function renderCoverageSection() {
    return (
      <section className="coverage-card">
        <div className="coverage-header">
          <div>
            <p className="section-label">Coverage Universe</p>
            <h2>Currently Covered</h2>
          </div>
          {!coverageLoading && !coverageError && (
            <p className="coverage-count">{coveredTickers.length} published reports</p>
          )}
        </div>

        {coverageLoading && <p className="coverage-message">Loading covered tickers...</p>}
        {coverageError && <p className="coverage-message coverage-error">{coverageError}</p>}

        {!coverageLoading && !coverageError && coveredTickers.length > 0 && (
          <div className="coverage-grid">
            {coveredTickers.map((item) => {
              const isSelected = selectedTicker === item.ticker;

              return (
                <button
                  key={item.ticker}
                  type="button"
                  className={`coverage-ticker-card ${isSelected ? 'coverage-ticker-card-active' : ''}`}
                  onClick={() => handleCoveredTickerClick(item.ticker)}
                >
                  <div className="coverage-ticker-top">
                    <span className="coverage-ticker">{item.ticker}</span>
                    <span className="coverage-exchange">{item.exchange}</span>
                  </div>
                  <p className="coverage-company">{item.companyName}</p>
                  {item.sector && <p className="coverage-sector">{item.sector}</p>}
                  {item.lastUpdated && <p className="coverage-updated">Updated: {item.lastUpdated}</p>}
                </button>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="app-shell">
      <div className="aurora" aria-hidden="true" />
      <main className="panel">
        <p className="eyebrow">ART Analytics</p>
        <h1>Curated NYSE Research Summaries</h1>
        <p className="subtitle">
          Search a stock we cover and read a clear summary of our published internal research.
        </p>

        <form onSubmit={handleSubmit} className="search-row">
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="Enter ticker (e.g., IBM)"
            maxLength={5}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Search'}
          </button>
        </form>

        {error && <div className="message error">{error}</div>}

        {renderCoverageSection()}
        {renderAuditSection()}
        {renderResult()}
      </main>
    </div>
  );
}