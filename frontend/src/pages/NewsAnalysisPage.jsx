import ArticleFeed from '../components/news/ArticleFeed';
import mockNewsArticles from '../data/mockNewsArticles';

const coverageCategories = ['Earnings', 'Analyst Ratings', 'Upgrades', 'Dividends'];
const sectorCategories = ['Technology', 'Healthcare', 'Financials', 'Energy', 'Consumer', 'Biotech'];

function CategoryGroup({ title, categories }) {
  const headingId = `news-${title.toLowerCase().replace(' ', '-')}`;

  return (
    <section className="news-category-group" aria-labelledby={headingId}>
      <h3 id={headingId}>{title}</h3>
      <ul className="news-category-list">
        {categories.map((category) => (
          <li key={category}>
            <button type="button" className="news-category-button">
              <span>{category}</span>
              <span className="news-category-arrow" aria-hidden="true">&rarr;</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function NewsAnalysisPage() {
  return (
    <main className="news-page">
      <section className="dashboard-module news-intro" aria-labelledby="news-analysis-title">
        <p className="section-label">Market intelligence</p>
        <h2 id="news-analysis-title">News &amp; Analysis</h2>
        <p className="news-description">
          This area will contain current company and financial-market articles from ART Analytics.
        </p>
      </section>

      <section className="news-category-section" aria-labelledby="news-category-title">
        <header className="news-category-header">
          <p className="section-label">Explore coverage</p>
          <h2 id="news-category-title">Follow the stories shaping companies and markets.</h2>
        </header>

        <div className="news-category-grid">
          <CategoryGroup title="By Coverage" categories={coverageCategories} />
          <CategoryGroup title="By Sector" categories={sectorCategories} />
        </div>

        <footer className="news-category-footer">
          <button type="button" className="news-all-button">
            <span>All News &amp; Analysis</span>
            <span aria-hidden="true">&rarr;</span>
          </button>
        </footer>
      </section>

      <section className="news-latest-section" aria-labelledby="news-latest-title">
        <header className="news-latest-header">
          <div>
            <p className="section-label">News feed preview</p>
            <h2 id="news-latest-title">Latest</h2>
          </div>
          <p className="news-latest-note">Mock articles for interface development</p>
        </header>

        <ArticleFeed articles={mockNewsArticles} />
      </section>
    </main>
  );
}
