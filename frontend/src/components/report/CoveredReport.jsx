import BulletList from '../common/BulletList';
import CollapsibleTableSection from '../common/CollapsibleTableSection';
import DataTable from '../common/DataTable';
import LiveTickerBadge from '../common/LiveTickerBadge';
import MetricGrid from '../common/MetricGrid';
import ParagraphBlock from '../common/ParagraphBlock';
import SectionCard from '../common/SectionCard';
import RevenueEarningsChart from '../charts/RevenueEarningsChart';
import MarginTrendChart from '../charts/MarginTrendChart';
import ValuationMultiplesChart from '../charts/ValuationMultiplesChart';
import useMarketData from '../../hooks/useMarketData';
import { REPORT_SECTION_IDS } from './reportSections';

export default function CoveredReport({ reportData, resultRef, onResetView }) {
  const { meta } = reportData;

  const {
    marketData,
    marketLoading,
    marketError,
    marketUnavailable
  } = useMarketData(meta.ticker, true);

  return (
    <section className="result-card" ref={resultRef}>
      <div className="result-header-row">
        <div>
          <div className="report-title-row">
            <h2>
              {meta.companyName} ({meta.ticker})
            </h2>

            <LiveTickerBadge
              marketData={marketData}
              marketLoading={marketLoading}
              marketError={marketError}
              marketUnavailable={marketUnavailable}
            />
          </div>

          <p className="exchange">Exchange: {meta.exchange}</p>
          {meta.sector && <p className="meta-line">Sector: {meta.sector}</p>}
          {meta.industry && <p className="meta-line">Industry: {meta.industry}</p>}
          {meta.reportDate && <p className="meta-line">Report Date: {meta.reportDate}</p>}
        </div>

        <button type="button" className="secondary-button" onClick={onResetView}>
          Back to Coverage
        </button>
      </div>

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

        <h4>Top Catalysts</h4>
        <BulletList items={reportData.executiveSummary.catalysts} />

        <h4>Primary Risks</h4>
        <BulletList items={reportData.executiveSummary.primaryRisks} />

        <h4>Valuation Bridge</h4>
        <p>{reportData.executiveSummary.valuationBridge}</p>
      </SectionCard>

      <SectionCard
        title="Financial Performance & Health"
        id={REPORT_SECTION_IDS.financialPerformanceHealth}
      >
        <h4>Income Statement Analysis</h4>
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
            title="Income Statement"
            table={reportData.financialPerformanceHealth.incomeStatementAnalysis.tables[0]}
          />
        )}

        {reportData.financialPerformanceHealth.incomeStatementAnalysis.tables[1] && (
          <CollapsibleTableSection
            title="Margin Analysis"
            table={reportData.financialPerformanceHealth.incomeStatementAnalysis.tables[1]}
          />
        )}

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

      <SectionCard title="Valuation" id={REPORT_SECTION_IDS.valuation}>
        <h4>Multiples Analysis</h4>
        <ParagraphBlock paragraphs={reportData.valuation.multiplesAnalysis.summaryParagraphs} />

        <ValuationMultiplesChart table={reportData.valuation.multiplesAnalysis.tables[0]} />

        {reportData.valuation.multiplesAnalysis.tables[0] && (
          <CollapsibleTableSection
            title="Valuation Multiple"
            table={reportData.valuation.multiplesAnalysis.tables[0]}
          />
        )}

        <h4>DCF Analysis</h4>
        <ParagraphBlock paragraphs={reportData.valuation.dcfAnalysis.summaryParagraphs} />
        <BulletList items={reportData.valuation.dcfAnalysis.assumptions} />

        <h4>Valuation Conclusion</h4>
        <p>{reportData.valuation.valuationConclusion}</p>
      </SectionCard>

      <SectionCard
        title="Business Model & Competitive Moat"
        id={REPORT_SECTION_IDS.businessModelMoat}
      >
        <h4>Segment Profile</h4>
        <ParagraphBlock paragraphs={reportData.businessModelMoat.segmentProfile.summaryParagraphs} />
        <DataTable table={reportData.businessModelMoat.segmentProfile.segmentTable} />

        <h4>Economic Moat Assessment</h4>
        <ParagraphBlock
          paragraphs={reportData.businessModelMoat.economicMoatAssessment.summaryParagraphs}
        />
        <CollapsibleTableSection
          title="Economic Moat Assessment"
          table={reportData.businessModelMoat.economicMoatAssessment.moatTable}
          suppressTitle
        />
        <p>{reportData.businessModelMoat.economicMoatAssessment.overallMoatConclusion}</p>
      </SectionCard>

      <SectionCard
        title="Growth Strategy & Future Outlook"
        id={REPORT_SECTION_IDS.growthStrategyOutlook}
      >
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

      <SectionCard
        title="Management & Governance"
        id={REPORT_SECTION_IDS.managementGovernance}
      >
        <h4>Leadership</h4>
        <ParagraphBlock paragraphs={reportData.managementGovernance.leadership.summaryParagraphs} />

        <h4>Capital Allocation</h4>
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
              {reportData.finalRecommendation.ratingChangeTriggers.map((item, index) => {
                const isUpgrade = item.direction === '↑';
                const isDowngrade = item.direction === '↓' || item.direction === '↓↓';
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

        <p>{reportData.finalRecommendation.closingParagraph}</p>
      </SectionCard>

      <SectionCard
        title="Open Questions & Narrative Checkpoints"
        id={REPORT_SECTION_IDS.openQuestions}
      >
        <BulletList items={reportData.openQuestions} />
      </SectionCard>
    </section>
  );
}
