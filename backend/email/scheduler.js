import cron from 'node-cron';
import { getDatabase } from '../db/database.js';
import { renderTemplate } from './templates.js';

const scheduledJobs = new Map();

function recordEmailHistory(contactId, sequenceStep, payload) {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO email_history (contact_id, sequence_step, subject, html, text, delivery_status, message_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    contactId,
    sequenceStep,
    payload.subject,
    payload.html,
    payload.text,
    payload.deliveryStatus || 'queued',
    payload.messageId || ''
  );
}

export function scheduleWarmupSequence(contact) {
  const jobKey = `warmup-${contact.id}`;
  if (scheduledJobs.has(jobKey)) {
    return { scheduled: false, reason: 'Sequence already scheduled.' };
  }

  const db = getDatabase();
  const nowTemplate = renderTemplate('warmup1', contact);
  recordEmailHistory(contact.id, 'warmup_1', {
    ...nowTemplate,
    deliveryStatus: 'scheduled'
  });
  db.prepare(`UPDATE contacts SET status = 'warmup_1' WHERE id = ?`).run(contact.id);

  const task = cron.schedule('0 10 * * *', () => {
    const current = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contact.id);
    if (!current || current.status === 'opted_out' || current.status === 'replied') {
      task.stop();
      scheduledJobs.delete(jobKey);
      return;
    }
  });

  scheduledJobs.set(jobKey, task);

  return { scheduled: true };
}
