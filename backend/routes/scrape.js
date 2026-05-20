import express from 'express';
import { upsertContacts } from '../db/database.js';
import { scrapeGoogleMaps } from '../scraper/googleMapsScraper.js';
import { getScrapeState, subscribeToScrapeState } from '../scraper/scrapeState.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const query = String(req.body.query || '').trim();
  const maxResults = Math.max(1, Math.min(Number(req.body.maxResults || 20), 100));

  if (!query) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  const state = getScrapeState();
  if (state.active) {
    return res.status(409).json({ error: 'A scrape job is already running.' });
  }

  void scrapeGoogleMaps(query, maxResults)
    .then((results) => {
      upsertContacts(results);
    })
    .catch((error) => {
      console.error('Scrape job failed:', error);
    });

  return res.status(202).json({
    message: 'Scrape started.',
    query,
    maxResults
  });
});

router.get('/status', (req, res) => {
  const wantsSse = req.headers.accept?.includes('text/event-stream');

  if (!wantsSse) {
    return res.json(getScrapeState());
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (state) => {
    res.write(`data: ${JSON.stringify(state)}\n\n`);
  };

  send(getScrapeState());
  const unsubscribe = subscribeToScrapeState(send);

  req.on('close', () => {
    unsubscribe();
    res.end();
  });
});

export default router;
