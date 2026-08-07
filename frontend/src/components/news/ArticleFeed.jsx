const publicationFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit'
});

function ArticleFeedItem({ article }) {
  return (
    <article className="news-feed-item">
      <div className="news-feed-timing">
        <p>{article.source}</p>
        <time dateTime={article.publishedAt}>
          {publicationFormatter.format(new Date(article.publishedAt))}
        </time>
      </div>

      <div className="news-feed-copy">
        <h3>
          <a href={article.url} target="_blank" rel="noreferrer">
            {article.headline}
          </a>
        </h3>
        <p>{article.summary}</p>
      </div>

      <div className="news-feed-classification" aria-label="Article classification">
        <span className="news-feed-category">{article.coverageCategory}</span>
        <span className="news-feed-sector">{article.sector}</span>
        {article.tickers.length > 0 && (
          <ul className="news-feed-tickers" aria-label="Related tickers">
            {article.tickers.map((ticker) => (
              <li key={ticker}>{ticker}</li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export default function ArticleFeed({ articles }) {
  return (
    <div className="news-feed">
      {articles.map((article) => (
        <ArticleFeedItem key={article.id} article={article} />
      ))}
    </div>
  );
}
