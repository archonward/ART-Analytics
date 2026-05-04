import { useNavigate } from 'react-router-dom';
import AuditSection from '../components/dashboard/AuditSection';
import CoverageSection from '../components/dashboard/CoverageSection';
import MarketOverviewSection from '../components/dashboard/MarketOverviewSection';
import { SHOW_AUDIT_SECTION } from '../config/features';
import useCoverage from '../hooks/useCoverage';
import useReportAudit from '../hooks/useReportAudit';
import ReportDepthSection from '../components/dashboard/ReportDepthSection';

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    coveredTickers,
    coverageLoading,
    coverageError
  } = useCoverage();

  const {
    auditData,
    auditLoading,
    auditError
  } = useReportAudit(SHOW_AUDIT_SECTION);

  function handleCoveredTickerClick(nextTicker) {
    navigate(`/report/${nextTicker.toUpperCase()}`);
  }

  return (
    <main className="dashboard-layout">
      <div className="dashboard-main">
        <MarketOverviewSection />
        <CoverageSection
          coveredTickers={coveredTickers}
          coverageLoading={coverageLoading}
          coverageError={coverageError}
          selectedTicker=""
          onTickerClick={handleCoveredTickerClick}
        />
        <ReportDepthSection />
      </div>

      {SHOW_AUDIT_SECTION && (
        <aside className="dashboard-secondary">
          <AuditSection
            auditData={auditData}
            auditLoading={auditLoading}
            auditError={auditError}
          />
        </aside>
      )}
    </main>
  );
}
