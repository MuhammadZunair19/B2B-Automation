import { useState } from 'react';

const templateOptions = [
  { value: 'warmup1', label: 'Warm Intro' },
  { value: 'warmup2', label: 'Value Add' },
  { value: 'permission', label: 'Permission Ask' }
];

export function EmailComposer({ contact, apiBaseUrl, onRefreshContacts }) {
  const [templateKey, setTemplateKey] = useState('warmup1');
  const [feedback, setFeedback] = useState('');

  const canSend = Boolean(contact?.id && contact?.email);

  async function handleSend() {
    if (!contact) {
      return;
    }

    setFeedback('');
    const response = await fetch(`${apiBaseUrl}/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactId: contact.id,
        templateKey
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setFeedback(payload.error || 'Unable to send email.');
      return;
    }

    setFeedback(`Email sent. Message ID: ${payload.messageId}`);
    if (onRefreshContacts) {
      await onRefreshContacts();
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Email Composer</h2>
        <span>{contact ? contact.name : 'No contact selected'}</span>
      </div>

      <div className="stack">
        <label>
          Template
          <select value={templateKey} onChange={(event) => setTemplateKey(event.target.value)}>
            {templateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button type="button" onClick={handleSend} disabled={!canSend}>
          Send selected template
        </button>

        {contact && !contact.email ? (
          <p className="muted-text">This contact has no email yet, so sending is disabled.</p>
        ) : null}
        {feedback ? <p className="muted-text">{feedback}</p> : null}
      </div>
    </section>
  );
}
