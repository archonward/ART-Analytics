import { useId } from 'react';
import useReportQa from '../../hooks/useReportQa';

const SUGGESTED_PROMPTS = [
  'What are the key risks?',
  'What supports the valuation?',
  'What could change the rating?',
  'What is the moat?',
  'Summarise the growth outlook.'
];

export default function AskReportPanel({ ticker, companyName, onCitationClick }) {
  const {
    question,
    setQuestion,
    submittedQuestion,
    loading,
    error,
    latestEntry,
    history,
    submitQuestion,
    clearAnswer
  } = useReportQa(ticker);
  const inputId = useId();
  const hasHistory = history.length > 0;
  const previousEntries = history.slice(1);

  function handleSubmit(event) {
    event.preventDefault();
    submitQuestion(question);
  }

  function handlePromptClick(prompt) {
    setQuestion(prompt);
    submitQuestion(prompt);
  }

  function handleInputKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitQuestion(question);
    }
  }

  return (
    <aside className="ask-report-panel">
      <div className="ask-report-header">
        <p className="section-label">Report QA</p>
        <h3>Ask the Report</h3>
        <p className="ask-report-helper">
          Ask questions grounded in this company&apos;s research report.
          {companyName ? ` Answers are limited to ${companyName}'s published report.` : ''}
        </p>
        <p className="ask-report-subhelper">
          Try a starter prompt or press Enter to submit your own question. Use Shift+Enter for a new line.
        </p>
      </div>

      {!hasHistory && !loading && !error && (
        <div className="ask-report-empty ask-report-first-use">
          <p className="ask-report-empty-title">Start with a focused question</p>
          <p className="ask-report-empty-copy">
            Ask about the thesis, valuation, risks, management, or what could change the rating.
          </p>
        </div>
      )}

      <div className="ask-report-prompts" aria-label="Suggested report questions">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="ask-report-prompt"
            onClick={() => handlePromptClick(prompt)}
            disabled={loading}
          >
            {prompt}
          </button>
        ))}
      </div>

      <form className="ask-report-form" onSubmit={handleSubmit}>
        <label htmlFor={inputId} className="ask-report-label">
          Your question
        </label>
        <textarea
          id={inputId}
          className="ask-report-input"
          rows={4}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder={`Ask about ${ticker}, such as risks, valuation, or the rating.`}
        />

        <div className="ask-report-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Asking...' : 'Ask'}
          </button>

          {(hasHistory || question) && (
            <button
              type="button"
              className="secondary-button"
              onClick={clearAnswer}
              disabled={loading}
            >
              Clear draft
            </button>
          )}
        </div>
      </form>

      {error && <div className="message error ask-report-message">{error}</div>}

      {loading && (
        <div className="ask-report-response ask-report-response-current ask-report-loading">
          <p className="ask-report-question-label">Searching {ticker}&apos;s report</p>
          <p className="ask-report-question">
            {submittedQuestion || 'Finding the best supporting sections...'}
          </p>
          <div className="ask-report-skeleton" aria-hidden="true">
            <div className="ask-report-skeleton-line ask-report-skeleton-line-wide" />
            <div className="ask-report-skeleton-line" />
            <div className="ask-report-skeleton-line ask-report-skeleton-line-short" />
          </div>
          <div className="ask-report-skeleton-citations" aria-hidden="true">
            <div className="ask-report-skeleton-chip" />
            <div className="ask-report-skeleton-chip" />
          </div>
        </div>
      )}

      {latestEntry && !loading && (
        <div className="ask-report-history">
          <div className="ask-report-history-section">
            <p className="ask-report-history-label">Latest answer</p>
            <HistoryEntry
              entry={latestEntry}
              isCurrent
              onReuseQuestion={setQuestion}
              onCitationClick={onCitationClick}
            />
          </div>

          {previousEntries.length > 0 && (
            <div className="ask-report-history-section">
              <div className="ask-report-history-heading">
                <p className="ask-report-history-label">Earlier in this report</p>
                <p className="ask-report-history-meta">{history.length} questions this session</p>
              </div>
              <div className="ask-report-history-list">
                {previousEntries.map((entry) => (
                  <HistoryEntry
                    key={entry.id}
                    entry={entry}
                    onReuseQuestion={setQuestion}
                    onCitationClick={onCitationClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

function HistoryEntry({ entry, isCurrent = false, onReuseQuestion, onCitationClick }) {
  const citations = getUniqueCitations(entry.citations || []);
  const showWeakSupport = !entry.grounded;

  return (
    <article
      className={`ask-report-response ${
        isCurrent ? 'ask-report-response-current' : 'ask-report-response-history'
      }`}
    >
      <div className="ask-report-entry-top">
        <p className="ask-report-question-label">{isCurrent ? 'Question asked' : 'Previous question'}</p>
        <button
          type="button"
          className="ask-report-inline-action"
          onClick={() => onReuseQuestion(entry.question)}
        >
          Reuse question
        </button>
      </div>
      <p className="ask-report-question">{entry.question}</p>

      <div className="ask-report-answer-wrap">
        <div className="ask-report-answer-heading-row">
          <p className="ask-report-question-label">Grounded answer</p>
          <span
            className={`ask-report-grounded-badge ${
              showWeakSupport
                ? 'ask-report-grounded-badge-limited'
                : 'ask-report-grounded-badge-supported'
            }`}
          >
            {showWeakSupport ? 'Limited support' : 'Supported by report'}
          </span>
        </div>
        <p className="ask-report-answer">{entry.answer}</p>
        {showWeakSupport && (
          <div className="ask-report-grounding-note">
            <p className="ask-report-grounding-note-title">Support is limited</p>
            <p className="ask-report-grounding-note-copy">
              The retrieved sections do not clearly answer this question, so the response is intentionally conservative.
            </p>
          </div>
        )}
      </div>

      {citations.length > 0 && (
        <div className="ask-report-citations">
          <div className="ask-report-citation-header">
            <p className="ask-report-question-label">Citations</p>
            <p className="ask-report-citation-meta">Source sections used in this answer</p>
          </div>
          <div className="ask-report-citation-list">
            {citations.map((citation) => (
              <button
                key={citation.chunkId || `${entry.id}-${citation.sectionTitle}-${citation.subsectionTitle || 'section'}`}
                type="button"
                className={`ask-report-citation-card ${
                  onCitationClick ? 'ask-report-citation-card-actionable' : ''
                }`}
                onClick={() => onCitationClick?.(citation)}
                disabled={!onCitationClick}
              >
                <p className="ask-report-citation-heading">
                  {citation.sectionTitle}
                  {citation.subsectionTitle ? ` / ${citation.subsectionTitle}` : ''}
                </p>
                <p className="ask-report-citation-snippet">{citation.snippet}</p>
                {onCitationClick && (
                  <span className="ask-report-citation-action">Jump to section</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function getUniqueCitations(citations) {
  const seen = new Set();
  const unique = [];

  citations.forEach((citation) => {
    const key = citation.chunkId || `${citation.sectionTitle}-${citation.subsectionTitle}-${citation.snippet}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    unique.push(citation);
  });

  return unique;
}
