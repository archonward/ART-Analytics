import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';

function getWorkspaceStatus(isNewsRoute, isReportRoute, routeTicker) {
  if (isNewsRoute) {
    return 'News & Analysis';
  }

  if (isReportRoute && routeTicker) {
    return `Report workspace / ${routeTicker}`;
  }

  if (isReportRoute) {
    return 'Report workspace';
  }

  return 'Coverage dashboard';
}

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const reportMatch = useMatch('/report/:ticker');
  const isNewsRoute = Boolean(useMatch('/news'));
  const routeTicker = reportMatch?.params?.ticker?.toUpperCase() || '';
  const isReportRoute = Boolean(reportMatch);
  const [searchValue, setSearchValue] = useState(routeTicker);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

  useEffect(() => {
    setSearchValue(routeTicker);
  }, [routeTicker, location.pathname]);

  useEffect(() => {
    if (!isReportRoute) {
      setIsHeaderHidden(false);
      return undefined;
    }

    function handleScroll() {
      setIsHeaderHidden(window.scrollY > 140);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isReportRoute]);

  function handleSubmit(event) {
    event.preventDefault();

    const normalizedTicker = searchValue.trim().toUpperCase();
    if (!normalizedTicker) {
      return;
    }

    navigate(`/report/${normalizedTicker}`);
  }

  return (
    <div className="app-shell">
      <header
        className={`app-header ${isReportRoute && isHeaderHidden ? 'app-header-report-hidden' : ''}`}
      >
        <div className="app-header-bar">
          <div className="brand-block">
            <p className="brand-kicker">ART Analytics</p>
            <div>
              <Link to="/" className="app-brand-link">
                <h1 className="brand-title">Institutional Research Workspace</h1>
              </Link>
              <p className="brand-subtitle">
                Curated coverage, market context, and report-level interrogation in one restrained workspace.
              </p>
            </div>
          </div>

          <div className="header-actions">
            <nav className="app-navigation" aria-label="Primary navigation">
              <NavLink
                to="/"
                end
                className={({ isActive }) => `app-navigation-link${isActive ? ' active' : ''}`}
              >
                Coverage
              </NavLink>
              <NavLink
                to="/news"
                className={({ isActive }) => `app-navigation-link${isActive ? ' active' : ''}`}
              >
                News &amp; Analysis
              </NavLink>
            </nav>

            <div className="app-status" aria-label="Workspace status">
              <span className="status-dot" aria-hidden="true" />
              <div>
                <p className="status-label">Workspace</p>
                <p className="status-value">
                  {getWorkspaceStatus(isNewsRoute, isReportRoute, routeTicker)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="app-toolbar">
          <div className="toolbar-copy">
            <p className="toolbar-label">Coverage Search</p>
            <p className="toolbar-note">
              Search a covered ticker or open a report from the coverage universe.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="toolbar-search">
            <label className="toolbar-search-field" htmlFor="ticker-search">
              <span className="toolbar-search-label">Ticker</span>
              <input
                id="ticker-search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value.toUpperCase())}
                placeholder="Enter ticker, for example NVDA"
                maxLength={5}
                required
              />
            </label>
            <button type="submit">
              Open report
            </button>
          </form>
        </div>
      </header>

      <div
        className={`workspace ${
          isReportRoute ? 'workspace-report' : isNewsRoute ? 'workspace-news' : 'workspace-dashboard'
        }`}
      >
        <Outlet />
      </div>
    </div>
  );
}
