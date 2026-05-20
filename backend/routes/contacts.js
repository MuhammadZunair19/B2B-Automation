import express from 'express';
import { getDatabase } from '../db/database.js';

const router = express.Router();

router.get('/', (_req, res) => {
  const db = getDatabase();
  const rows = db
    .prepare('SELECT * FROM contacts ORDER BY datetime(created_at) DESC, id DESC')
    .all();
  res.json(rows);
});

router.put('/:id', (req, res) => {
  const db = getDatabase();
  const id = Number(req.params.id);
  const current = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);

  if (!current) {
    return res.status(404).json({ error: 'Contact not found.' });
  }

  const next = {
    ...current,
    ...req.body
  };

  db.prepare(`
    UPDATE contacts
    SET name = ?, address = ?, phone = ?, email = ?, website = ?, rating = ?,
        owner_name = ?, area = ?, notes = ?, status = ?
    WHERE id = ?
  `).run(
    next.name,
    next.address,
    next.phone,
    next.email,
    next.website,
    next.rating,
    next.owner_name,
    next.area,
    next.notes,
    next.status,
    id
  );

  res.json(db.prepare('SELECT * FROM contacts WHERE id = ?').get(id));
});

router.delete('/:id/optout', (req, res) => {
  const db = getDatabase();
  const id = Number(req.params.id);
  const result = db
    .prepare(`UPDATE contacts SET status = 'opted_out' WHERE id = ?`)
    .run(id);

  if (!result.changes) {
    return res.status(404).json({ error: 'Contact not found.' });
  }

  res.status(204).send();
});

export default router;
