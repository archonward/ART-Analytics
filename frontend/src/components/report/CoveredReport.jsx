import BulletList from '../common/BulletList';
import CollapsibleTableSection from '../common/CollapsibleTableSection';
import DataTable from '../common/DataTable';
import MetricGrid from '../common/MetricGrid';
import ParagraphBlock from '../common/ParagraphBlock';
import PreviousCloseBadge from '../common/PreviousCloseBadge';
import SectionCard from '../common/SectionCard';
import RevenueEarningsChart from '../charts/RevenueEarningsChart';
import MarginTrendChart from '../charts/MarginTrendChart';
import ValuationMultiplesChart from '../charts/ValuationMultiplesChart';
import { REPORT_SECTION_IDS } from './reportSections';

function RecommendationSnapshot({ finalRecommendation }) {
  return (
    <div className="metric-grid report-conclusion-grid">
      <div className="metric-card">
        <p className="metric-label">Rating</p>
        <p className="metric-value">{finalRecommendation.rating}</p>
      </div>
      <div className="metric-card">
        <p className="metric-label">Price target</p>
        <p className="metric-value">{finalRecommendation.priceTarget}</p>
      </div>
      <div className="metric-card">
        <p className="metric-label">Implied upside</p>
        <p className="metric-value">{finalRecommendation.impliedUpsidePct}</p>
      </div>
    </div>
  );
}

export default function CoveredReport({ reportData, resultRef, onResetView }) {
  const { meta } = reportData;

  return (
    <article className="report-shell" ref={resultRef}>
      <header className="report-hero">
        <div className="report-hero-main">
          <p className="section-label">Research summary</p>
          <div className="report-title-row">
            <h2>
              {meta.companyName} ({meta.ticker})
            </h2>

            <PreviousCloseBadge
              price={meta.currentPrice}
              currency={meta.currency}
              asOf={meta.marketDataAsOf}
            />
          </div>

          <div className="report-meta-grid">
            <div className="report-meta-item">
              <span className="report-meta-label">Exchange</span>
              <span className="report-meta-value">{meta.exchange || '-'}</span>
            </div>
            {meta.sector && (
              <div className="report-meta-item">
                <span className="report-meta-label">Sector</span>
                <span className="report-meta-value">{meta.sector}</span>
              </div>
            )}
            {meta.industry && (
              <div className="report-meta-item">
                <span className="report-meta-label">Industry</span>
                <span className="report-meta-value">{meta.industry}</span>
              </div>
            )}
            {meta.reportDate && (
              <div className="report-meta-item">
                <span className="report-meta-label">Report date</span>
                <span className="report-meta-value">{meta.reportDate}</span>
              </div>
            )}
          </div>
        </div>

        <div className="report-hero-actions">
          <button type="button" className="secondary-button" onClick={onResetView}>
            Back to coverage
          </button>
        </div>
      </header>

      <div className="report-document">
        <SectionCard
          title="Executive At-a-Glance"
          id={REPORT_SECTION_IDS.executiveAtAGlance}
        >
          <p className="thesis-headline">{reportData.executiveAtAGlance.thesisHeadline}</p>
          <MetricGrid items={reportData.executiveAtAGlance.snapshotMetrics} />
        </SectionCard>

        <SectionCard
          title="Executive Summary"
          id={REPORT_SECTION_IDS.executiveSummary}
        >
          <ParagraphBlock paragraphs={reportData.executiveSummary.summaryParagraphs} />

          <h4>Top catalysts</h4>
          <BulletList items={reportData.executiveSummary.catalysts} />

          <h4>Primary risks</h4>
          <BulletList items={reportData.executiveSummary.primaryRisks} />

          <h4>Valuation bridge</h4>
          <p>{reportData.executiveSummary.valuationBridge}</p>
        </SectionCard>

        <SectionCard
          title="Financial Performance & Health"
          id={REPORT_SECTION_IDS.financialPerformanceHealth}
        >
          <h4>Income statement analysis</h4>
          <ParagraphBlock
            paragraphs={reportData.financialPerformanceHealth.incomeStatementAnalysis.summaryParagraphs}
          />
          <BulletList items={reportData.financialPerformanceHealth.incomeStatementAnalysis.highlights} />

          <RevenueEarningsChart
            table={reportData.financialPerformanceHealth.incomeStatementAnalysis.tables[0]}
          />

          <MarginTrendChart
            table={reportData.financialPerformanceHealth.incomeStatementAnalysis.tables[1]}
          />

          {reportData.financialPerformanceHealth.incomeStatementAnalysis.tables[0] && (
            <CollapsibleTableSection
              title="Income statement"
              table={reportData.financialPerformanceHealth.incomeStatementAnalysis.tables[0]}
            />
          )}

          {reportData.financialPerformanceHealth.incomeStatementAnalysis.tables[1] && (
            <CollapsibleTableSection
              title="Margin analysis"
              table={reportData.financialPerformanceHealth.incomeStatementAnalysis.tables[1]}
            />
          )}

          <h4>Balance sheet analysis</h4>
          <ParagraphBlock
            paragraphs={reportData.financialPerformanceHealth.balanceSheetAnalysis.summaryParagraphs}
          />

          <h4>Cash flow and returns</h4>
          <ParagraphBlock
            paragraphs={reportData.financialPerformanceHealth.cashFlowReturns.summaryParagraphs}
          />
          <BulletList items={reportData.financialPerformanceHealth.cashFlowReturns.highlights} />
        </SectionCard>

        <SectionCard title="Valuation" id={REPORT_SECTION_IDS.valuation}>
          <h4>Multiples analysis</h4>
          <ParagraphBlock paragraphs={reportData.valuation.multiplesAnalysis.summaryParagraphs} />

          <ValuationMultiplesChart table={reportData.valuation.multiplesAnalysis.tables[0]} />

          {reportData.valuation.multiplesAnalysis.tables[0] && (
            <CollapsibleTableSection
              title="Valuation multiples"
              table={reportData.valuation.multiplesAnalysis.tables[0]}
            />
          )}

          <h4>DCF analysis</h4>
          <ParagraphBlock paragraphs={reportData.valuation.dcfAnalysis.summaryParagraphs} />
          <BulletList items={reportData.valuation.dcfAnalysis.assumptions} />

          <h4>Valuation conclusion</h4>
          <p>{reportData.valuation.valuationConclusion}</p>
        </SectionCard>

        <SectionCard
          title="Business Model & Competitive Moat"
          id={REPORT_SECTION_IDS.businessModelMoat}
        >
          <h4>Segment profile</h4>
          <ParagraphBlock paragraphs={reportData.businessModelMoat.segmentProfile.summaryParagraphs} />
          <DataTable table={reportData.businessModelMoat.segmentProfile.segmentTable} />

          <h4>Economic moat assessment</h4>
          <ParagraphBlock
            paragraphs={reportData.businessModelMoat.economicMoatAssessment.summaryParagraphs}
          />
          <CollapsibleTableSection
            title="Economic moat assessment"
            table={reportData.businessModelMoat.economicMoatAssessment.moatTable}
            suppressTitle
          />
          <p>{reportData.businessModelMoat.economicMoatAssessment.overallMoatConclusion}</p>
        </SectionCard>

        <SectionCard
          title="Growth Strategy & Future Outlook"
          id={REPORT_SECTION_IDS.growthStrategyOutlook}
        >
          <h4>Near-term catalysts</h4>
          <BulletList items={reportData.growthStrategyOutlook.nearTermCatalysts} />

          <h4>Medium-term drivers</h4>
          <BulletList items={reportData.growthStrategyOutlook.mediumTermDrivers} />

          <h4>Long-term opportunities</h4>
          <BulletList items={reportData.growthStrategyOutlook.longTermOpportunities} />

          <h4>TAM and positioning</h4>
          <ParagraphBlock paragraphs={reportData.growthStrategyOutlook.tamPositioning.summaryParagraphs} />
          <BulletList items={reportData.growthStrategyOutlook.tamPositioning.highlights} />
        </SectionCard>

        <SectionCard
          title="Management & Governance"
          id={REPORT_SECTION_IDS.managementGovernance}
        >
          <h4>Leadership</h4>
          <ParagraphBlock paragraphs={reportData.managementGovernance.leadership.summaryParagraphs} />

          <h4>Capital allocation</h4>
          <ParagraphBlock paragraphs={reportData.managementGovernance.capitalAllocation.summaryParagraphs} />
          <DataTable table={reportData.managementGovernance.capitalAllocation.acquisitionTable} />

          <h4>Alignment</h4>
          <ParagraphBlock paragraphs={reportData.managementGovernance.alignment.summaryParagraphs} />
        </SectionCard>

        <SectionCard title="Risk Analysis" id={REPORT_SECTION_IDS.riskAnalysis}>
          <DataTable table={reportData.riskAnalysis.riskTable} suppressTitle />
        </SectionCard>

        <SectionCard
          title="Final Recommendation"
          id={REPORT_SECTION_IDS.finalRecommendation}
        >
          <RecommendationSnapshot finalRecommendation={reportData.finalRecommendation} />

          <h4>Bull / base / bear</h4>
          <ul className="report-bullet-list">
            <li>Bull: {reportData.finalRecommendation.bullBaseBear.bull}</li>
            <li>Base: {reportData.finalRecommendation.bullBaseBear.base}</li>
            <li>Bear: {reportData.finalRecommendation.bullBaseBear.bear}</li>
          </ul>

          <h4>Valuation methodology</h4>
          <p>{reportData.finalRecommendation.valuationMethodology}</p>

          <h4>Five key metrics to watch</h4>
          <BulletList items={reportData.finalRecommendation.fiveKeyMetricsToWatch} />

          <h4>What would change the rating</h4>
          <div className="table-wrap">
            <div className="table-scroll">
              <table className="report-table">
                <thead>
                  <tr>
                    <th scope="col">Action</th>
                    <th scope="col">Direction</th>
                    <th scope="col">Specific trigger</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.finalRecommendation.ratingChangeTriggers.map((item, index) => {
                    const isUpgrade = item.direction?.includes('\u2191');
                    const isDowngrade = item.direction?.includes('\u2193');

                    return (
                      <tr key={`${item.action}-${index}`}>
                        <td>{item.action}</td>
                        <td className="rating-direction-cell">
                          <span
                            className={`rating-direction-arrow ${
                              isUpgrade
                                ? 'rating-direction-arrow-up'
                                : isDowngrade
                                  ? 'rating-direction-arrow-down'
                                  : ''
                            }`}
                          >
                            {item.direction}
                          </span>
                        </td>
                        <td>{item.trigger}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p>{reportData.finalRecommendation.closingParagraph}</p>
        </SectionCard>

        <SectionCard
          title="Open Questions & Narrative Checkpoints"
          id={REPORT_SECTION_IDS.openQuestions}
        >
          <BulletList items={reportData.openQuestions} />
        </SectionCard>
      </div>
    </article>
  );
}
