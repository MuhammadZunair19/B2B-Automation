import { useEffect, useState } from 'react';
import { AnalyticsDash } from './components/AnalyticsDash.jsx';
import { CSVTable } from './components/CSVTable.jsx';
import { EmailComposer } from './components/EmailComposer.jsx';
import { ScraperPanel } from './components/ScraperPanel.jsx';
import { SequenceStatus } from './components/SequenceStatus.jsx';

const API_BASE_URL = 'http://localhost:3001/api';

export default function App() {
  const [contacts, setContacts] = useState([]);
  const [scrapeStatus, setScrapeStatus] = useState({
    active: false,
    processed: 0,
    total: 0,
    message: 'Idle'
  });
  const [selectedContactId, setSelectedContactId] = useState(null);
  const selectedContact = contacts.find((contact) => contact.id === selectedContactId) ?? null;

  async function loadContacts() {
    const response = await fetch(`${API_BASE_URL}/contacts`);
    const data = await response.json();
    setContacts(data);
    if (!selectedContactId && data[0]) {
      setSelectedContactId(data[0].id);
    }
  }

  useEffect(() => {
    void loadContacts();
  }, []);

  useEffect(() => {
    const stream = new EventSource(`${API_BASE_URL}/scrape/status`);
    stream.onmessage = (event) => {
      const next = JSON.parse(event.data);
      setScrapeStatus(next);
      if (!next.active && next.finishedAt) {
        void loadContacts();
      }
    };

    return () => stream.close();
  }, []);

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">B2B RESTAURANT OUTREACH</p>
        <h1>Control the scrape, review prospects, and launch warmup sequences.</h1>
        <p className="hero-copy">
          This first implementation pass wires the backend and dashboard together so we can start
          scraping, storing, and reviewing contacts end to end.
        </p>
      </section>

      <div className="dashboard-grid">
        <ScraperPanel apiBaseUrl={API_BASE_URL} scrapeStatus={scrapeStatus} />
        <AnalyticsDash contacts={contacts} />
        <CSVTable
          contacts={contacts}
          selectedContactId={selectedContactId}
          onSelectContact={setSelectedContactId}
        />
        <SequenceStatus
          contact={selectedContact}
          apiBaseUrl={API_BASE_URL}
          onRefreshContacts={loadContacts}
        />
        <EmailComposer
          contact={selectedContact}
          apiBaseUrl={API_BASE_URL}
          onRefreshContacts={loadContacts}
        />
      </div>
    </main>
  );
}
