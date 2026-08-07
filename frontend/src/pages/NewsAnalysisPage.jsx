import { useState } from 'react';
import ArticleFeed from '../components/news/ArticleFeed';
import mockNewsArticles from '../data/mockNewsArticles';

const coverageCategories = ['Earnings', 'Analyst Ratings', 'Upgrades', 'Dividends'];
const sectorCategories = ['Technology', 'Healthcare', 'Financials', 'Energy', 'Consumer', 'Biotech'];

function CategoryGroup({ title, filterKey, categories, activeFilter, onSelect }) {
  const headingId = `news-${title.toLowerCase().replace(' ', '-')}`;

  return (
    <section className="news-category-group" aria-labelledby={headingId}>
      <h3 id={headingId}>{title}</h3>
      <ul className="news-category-list">
        {categories.map((category) => {
          const isActive = activeFilter?.key === filterKey && activeFilter.value === category;

          return (
            <li key={category}>
              <button
                type="button"
                className={`news-category-button${isActive ? ' active' : ''}`}
                onClick={() => onSelect({ key: filterKey, value: category })}
                aria-pressed={isActive}
              >
                <span>{category}</span>
                <span className="news-category-arrow" aria-hidden="true">&rarr;</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function NewsAnalysisPage() {
  const [activeFilter, setActiveFilter] = useState(null);
  const filteredArticles = activeFilter
    ? mockNewsArticles.filter((article) => article[activeFilter.key] === activeFilter.value)
    : mockNewsArticles;
  const feedTitle = activeFilter?.value || 'Latest';

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
          <CategoryGroup
            title="By Coverage"
            filterKey="category"
            categories={coverageCategories}
            activeFilter={activeFilter}
            onSelect={setActiveFilter}
          />
          <CategoryGroup
            title="By Sector"
            filterKey="sector"
            categories={sectorCategories}
            activeFilter={activeFilter}
            onSelect={setActiveFilter}
          />
        </div>

        <footer className="news-category-footer">
          <button
            type="button"
            className={`news-all-button${activeFilter ? '' : ' active'}`}
            onClick={() => setActiveFilter(null)}
            aria-pressed={!activeFilter}
          >
            <span>All News &amp; Analysis</span>
            <span aria-hidden="true">&rarr;</span>
          </button>
        </footer>
      </section>

      <section className="news-latest-section" aria-labelledby="news-latest-title">
        <header className="news-latest-header">
          <div>
            <p className="section-label">News feed preview</p>
            <h2 id="news-latest-title">{feedTitle}</h2>
          </div>
          <p className="news-latest-note">
            {filteredArticles.length} mock {filteredArticles.length === 1 ? 'article' : 'articles'}
          </p>
        </header>

        {filteredArticles.length > 0 ? (
          <ArticleFeed articles={filteredArticles} />
        ) : (
          <div className="news-feed-empty">
            <h3>No articles in this view</h3>
            <p>Choose another category or return to All News &amp; Analysis.</p>
          </div>
        )}
      </section>
    </main>
  );
}
