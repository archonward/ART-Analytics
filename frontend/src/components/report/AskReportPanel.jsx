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
    answerResult,
    submitQuestion,
    clearAnswer
  } = useReportQa(ticker);
  const inputId = useId();

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

  const hasAnswer = Boolean(answerResult);
  const citations = getUniqueCitations(answerResult?.citations || []);
  const showWeakSupport = Boolean(answerResult && !answerResult.grounded);

  return (
    <aside className="ask-report-panel">
      <div className="ask-report-header">
        <h3>Ask the Report</h3>
        <p className="ask-report-helper">
          Ask questions grounded in this company&apos;s research report.
          {companyName ? ` Answers are limited to ${companyName}'s published report.` : ''}
        </p>
        <p className="ask-report-subhelper">
          Try a starter prompt or press Enter to submit your own question. Use Shift+Enter for a new line.
        </p>
      </div>

      {!hasAnswer && !loading && !error && (
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

          {hasAnswer && (
            <button
              type="button"
              className="secondary-button"
              onClick={clearAnswer}
              disabled={loading}
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {error && <div className="message error ask-report-message">{error}</div>}

      {loading && (
        <div className="ask-report-response ask-report-loading">
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

      {hasAnswer && !loading && (
        <div className="ask-report-response">
          <p className="ask-report-question-label">Question asked</p>
          <p className="ask-report-question">{answerResult.question}</p>

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
            <p className="ask-report-answer">{answerResult.answer}</p>
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
                <p className="ask-report-citation-meta">
                  Source sections used in this answer
                </p>
              </div>
              <div className="ask-report-citation-list">
                {citations.map((citation) => (
                  <button
                    key={citation.chunkId}
                    type="button"
                    className={`ask-report-citation-card ${
                      onCitationClick ? 'ask-report-citation-card-actionable' : ''
                    }`}
                    onClick={() => onCitationClick?.(citation)}
                    disabled={!onCitationClick}
                  >
                    <p className="ask-report-citation-heading">
                      {citation.sectionTitle}
                      {citation.subsectionTitle ? ` - ${citation.subsectionTitle}` : ''}
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
        </div>
      )}
    </aside>
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
