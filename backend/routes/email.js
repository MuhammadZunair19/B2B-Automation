import express from 'express';
import { getDatabase } from '../db/database.js';
import { scheduleWarmupSequence } from '../email/scheduler.js';
import { sendEmail } from '../email/sender.js';
import { renderTemplate } from '../email/templates.js';

const router = express.Router();

function statusForTemplate(templateKey) {
  if (templateKey === 'warmup1') {
    return 'warmup_1';
  }
  if (templateKey === 'warmup2') {
    return 'warmup_2';
  }
  if (templateKey === 'permission') {
    return 'permission_sent';
  }
  return null;
}

router.post('/send', async (req, res) => {
  const db = getDatabase();
  const { contactId, templateKey, subject, html, text, to } = req.body;

  let payload = { subject, html, text };
  let recipient = to;
  let contact = null;

  if (contactId) {
    contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(Number(contactId));
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found.' });
    }
    recipient = recipient || contact.email;
  }

  if (templateKey) {
    if (!contact) {
      return res.status(400).json({ error: 'contactId is required when using templateKey.' });
    }
    payload = renderTemplate(templateKey, contact);
  }

  if (!recipient || !payload.subject || (!payload.html && !payload.text)) {
    return res.status(400).json({ error: 'Recipient, subject, and message content are required.' });
  }

  try {
    const info = await sendEmail({ to: recipient, ...payload });

    if (contact) {
      db.prepare(`
        INSERT INTO email_history (contact_id, sequence_step, subject, html, text, delivery_status, message_id)
        VALUES (?, ?, ?, ?, ?, 'sent', ?)
      `).run(
        contact.id,
        templateKey || 'manual',
        payload.subject,
        payload.html || '',
        payload.text || '',
        info.messageId || ''
      );

      const nextStatus = statusForTemplate(templateKey);
      if (nextStatus) {
        db.prepare(`UPDATE contacts SET status = ? WHERE id = ?`).run(nextStatus, contact.id);
      }
    }

    res.json({ ok: true, messageId: info.messageId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/schedule', (req, res) => {
  const db = getDatabase();
  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(Number(req.body.contactId));

  if (!contact) {
    return res.status(404).json({ error: 'Contact not found.' });
  }

  const result = scheduleWarmupSequence(contact);
  return res.json(result);
});

router.get('/history/:id', (req, res) => {
  const db = getDatabase();
  const rows = db
    .prepare(`
      SELECT *
      FROM email_history
      WHERE contact_id = ?
      ORDER BY datetime(sent_at) DESC, id DESC
    `)
    .all(Number(req.params.id));

  res.json(rows);
});

export default router;
