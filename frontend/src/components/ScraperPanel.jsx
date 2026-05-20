import { useState } from 'react';

export function ScraperPanel({ apiBaseUrl, scrapeStatus }) {
  const [query, setQuery] = useState('small restaurant in Islamabad');
  const [maxResults, setMaxResults] = useState(20);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const response = await fetch(`${apiBaseUrl}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, maxResults })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || 'Unable to start scrape.');
    }
  }

  const progress = scrapeStatus.total
    ? Math.round((scrapeStatus.processed / scrapeStatus.total) * 100)
    : 0;

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Search & Scrape</h2>
        <span className={`status-pill ${scrapeStatus.active ? 'status-live' : ''}`}>
          {scrapeStatus.active ? 'Running' : 'Ready'}
        </span>
      </div>

      <form className="stack" onSubmit={handleSubmit}>
        <label>
          Search query
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>

        <label>
          Max results
          <input
            type="number"
            min="1"
            max="100"
            value={maxResults}
            onChange={(event) => setMaxResults(Number(event.target.value))}
          />
        </label>

        <button type="submit" disabled={scrapeStatus.active}>
          {scrapeStatus.active ? 'Scraping...' : 'Start scrape'}
        </button>
      </form>

      <div className="stack compact">
        <div className="progress-row">
          <strong>{progress}%</strong>
          <span>{scrapeStatus.message}</span>
        </div>
        <div className="progress-bar">
          <div style={{ width: `${progress}%` }} />
        </div>
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </section>
  );
}
