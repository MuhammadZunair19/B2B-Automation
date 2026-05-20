import { useEffect, useState } from 'react';

const statusSteps = ['pending', 'warmup_1', 'warmup_2', 'permission_sent', 'replied', 'opted_out'];

export function SequenceStatus({ contact, apiBaseUrl, onRefreshContacts }) {
  const currentIndex = contact ? statusSteps.indexOf(contact.status) : -1;
  const [history, setHistory] = useState([]);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    async function loadHistory() {
      if (!contact?.id) {
        setHistory([]);
        return;
      }

      const response = await fetch(`${apiBaseUrl}/email/history/${contact.id}`);
      const data = await response.json();
      setHistory(data);
    }

    void loadHistory();
  }, [apiBaseUrl, contact?.id, contact?.status]);

  async function handleScheduleWarmup() {
    if (!contact?.id) {
      return;
    }

    setFeedback('');
    const response = await fetch(`${apiBaseUrl}/email/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId: contact.id })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setFeedback(payload.error || 'Unable to schedule warmup.');
      return;
    }

    setFeedback(payload.reason || 'Warmup sequence scheduled.');
    if (onRefreshContacts) {
      await onRefreshContacts();
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Sequence Status</h2>
        <span>{contact ? contact.status : 'No contact selected'}</span>
      </div>

      <div className="timeline">
        {statusSteps.map((step, index) => (
          <div key={step} className={`timeline-step ${index <= currentIndex ? 'is-active' : ''}`}>
            <span>{index + 1}</span>
            <div>
              <strong>{step}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="stack compact">
        <button type="button" onClick={handleScheduleWarmup} disabled={!contact?.id}>
          Schedule warmup
        </button>
        {feedback ? <p className="muted-text">{feedback}</p> : null}
      </div>

      <div className="history-list">
        <h3>Recent Email History</h3>
        {history.length ? (
          history.slice(0, 4).map((item) => (
            <article key={item.id} className="history-item">
              <strong>{item.sequence_step}</strong>
              <span>{item.subject}</span>
              <small>{item.delivery_status}</small>
            </article>
          ))
        ) : (
          <p className="muted-text">No email history yet.</p>
        )}
      </div>
    </section>
  );
}
