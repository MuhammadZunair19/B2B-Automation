import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import contactsRouter from './routes/contacts.js';
import emailRouter from './routes/email.js';
import scrapeRouter from './routes/scrape.js';
import { initializeDatabase } from './db/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

initializeDatabase();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/data', express.static(path.resolve(__dirname, '..', 'data')));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/scrape', scrapeRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/email', emailRouter);

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
