import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

let db;

function resolveDatabasePath() {
  const configuredPath = process.env.DATABASE_PATH || './db/contacts.sqlite';
  return path.resolve(process.cwd(), configuredPath);
}

export function getDatabase() {
  if (!db) {
    const dbPath = resolveDatabasePath();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }

  return db;
}

export function initializeDatabase() {
  const database = getDatabase();

  database.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      website TEXT DEFAULT '',
      rating TEXT DEFAULT '',
      owner_name TEXT DEFAULT '',
      area TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS email_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      sequence_step TEXT NOT NULL,
      subject TEXT NOT NULL,
      html TEXT DEFAULT '',
      text TEXT DEFAULT '',
      sent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      delivery_status TEXT NOT NULL DEFAULT 'queued',
      message_id TEXT DEFAULT '',
      FOREIGN KEY(contact_id) REFERENCES contacts(id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS contacts_unique_website
    ON contacts(website)
    WHERE website != '';

    CREATE UNIQUE INDEX IF NOT EXISTS contacts_unique_email
    ON contacts(email)
    WHERE email != '';
  `);

  const updateTimestampTrigger = `
    CREATE TRIGGER IF NOT EXISTS contacts_updated_at
    AFTER UPDATE ON contacts
    FOR EACH ROW
    BEGIN
      UPDATE contacts
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = OLD.id;
    END;
  `;

  database.exec(updateTimestampTrigger);
}

export function upsertContacts(contacts) {
  const database = getDatabase();
  const findByWebsite = database.prepare(`
    SELECT *
    FROM contacts
    WHERE website = ?
      AND website != ''
  `);
  const findByEmail = database.prepare(`
    SELECT *
    FROM contacts
    WHERE email = ?
      AND email != ''
  `);
  const findByNamePhone = database.prepare(`
    SELECT *
    FROM contacts
    WHERE lower(name) = lower(?)
      AND phone = ?
      AND phone != ''
  `);
  const insert = database.prepare(`
    INSERT INTO contacts (name, address, phone, email, website, rating, owner_name, area, status)
    VALUES (@name, @address, @phone, @email, @website, @rating, @owner_name, @area, @status)
  `);
  const update = database.prepare(`
    UPDATE contacts
    SET name = @name,
        address = @address,
        phone = @phone,
        email = @email,
        website = @website,
        rating = @rating,
        owner_name = @owner_name,
        area = @area,
        status = @status
    WHERE id = @id
  `);

  const transaction = database.transaction((rows) => {
    for (const row of rows) {
      const nextRow = {
        name: row.name || 'Unknown',
        address: row.address || '',
        phone: row.phone || '',
        email: row.email || '',
        website: row.website || '',
        rating: row.rating || '',
        owner_name: row.owner_name || '',
        area: row.area || '',
        status: row.status || 'pending'
      };

      const existing =
        (nextRow.website ? findByWebsite.get(nextRow.website) : null) ||
        (nextRow.email ? findByEmail.get(nextRow.email) : null) ||
        (nextRow.phone ? findByNamePhone.get(nextRow.name, nextRow.phone) : null);

      if (existing) {
        update.run({
          ...existing,
          ...nextRow,
          status: existing.status === 'replied' || existing.status === 'opted_out'
            ? existing.status
            : nextRow.status,
          id: existing.id
        });
        continue;
      }

      insert.run(nextRow);
    }
  });

  transaction(contacts);
}
