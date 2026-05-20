# B2B Automation System

Local outreach system for finding restaurant leads, reviewing prospects, and sending warmup emails from a simple dashboard.

This project currently includes:

- A `React + Vite` frontend dashboard
- An `Express` backend API
- A `Puppeteer` Google Maps scraper
- A `SQLite` contact database
- Basic email template sending and warmup scheduling

## Current Flow

The system is intended to work in this order:

1. Start the backend server.
2. Start the frontend dashboard.
3. Open the dashboard in the browser.
4. Run a scrape query such as `small restaurant in Islamabad`.
5. Review stored contacts in the dashboard.
6. Select a contact and send a warmup email or schedule a warmup sequence.
7. Track contact status and email history in the UI.

## Project Structure

```text
B2B Automation/
├── backend/
│   ├── db/
│   ├── email/
│   ├── routes/
│   ├── scraper/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── data/
├── B2B_Automation_System.docx
└── README.md
```

## Requirements

Make sure these are available on your machine:

- `Node.js 20+` recommended
- `npm 10+` recommended
- Internet access for Google Maps scraping and website email extraction
- A Gmail account with `App Password` enabled if you want to send emails through Gmail SMTP

Optional but recommended:

- A custom sender domain for better email deliverability
- A VPS or always-on machine if you want long-running automation

## Environment Setup

Create a backend environment file:

```powershell
Copy-Item .env.example .env
```

Run that command inside:

```text
D:\B2B Automation\backend
```

Then fill in the values in `backend/.env`.

### Required `.env` values

```env
SMTP_USER=youraddress@gmail.com
SMTP_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
SENDER_NAME=Your Name
PORT=3001
DATABASE_PATH=./db/contacts.sqlite
CSV_OUTPUT_PATH=../data/results.csv
MAX_EMAILS_PER_DAY=40
MIN_DELAY_BETWEEN_EMAILS_MS=120000
DEFAULT_FROM_PHONE=+92 XXX XXX XXXX
DEFAULT_AREA=Islamabad
```

## Install Dependencies

If dependencies are not already installed:

### Backend

```powershell
cd "D:\B2B Automation\backend"
npm install
```

### Frontend

```powershell
cd "D:\B2B Automation\frontend"
npm install
```

## Run the System

You need two terminals.

### Terminal 1: Start backend

```powershell
cd "D:\B2B Automation\backend"
npm start
```

Expected backend URL:

```text
http://localhost:3001
```

Health check:

```text
http://localhost:3001/api/health
```

### Terminal 2: Start frontend

```powershell
cd "D:\B2B Automation\frontend"
npm run dev
```

Expected frontend URL:

```text
http://localhost:5173
```

## Using the Dashboard

### 1. Run a scrape

- Open the frontend dashboard.
- Enter a search query in the `Search & Scrape` panel.
- Choose the result limit.
- Click `Start scrape`.

The backend will:

- Launch Puppeteer
- Open Google Maps search
- Collect listing details
- Try to find an email from the restaurant website
- Save contacts into SQLite
- Export the latest results to `data/results.csv`

### 2. Review contacts

- Scraped contacts appear in the `Prospect List`
- Click any row to inspect that contact
- The timeline panel shows the contact's current outreach status

### 3. Send an email

- Select a contact with an email address
- Choose one of the built-in templates
- Click `Send selected template`

Current templates:

- `Warm Intro`
- `Value Add`
- `Permission Ask`

### 4. Schedule a warmup

- Select a contact
- Click `Schedule warmup`

This currently records the first warmup step and marks the contact as `warmup_1`.

## Data Storage

### SQLite database

By default, the database is created at:

```text
backend/db/contacts.sqlite
```

### CSV export

By default, scraped results are written to:

```text
data/results.csv
```

## Available API Endpoints

### Health

- `GET /api/health`

### Scraping

- `POST /api/scrape`
- `GET /api/scrape/status`

Example scrape request:

```json
{
  "query": "small restaurant in Islamabad",
  "maxResults": 20
}
```

### Contacts

- `GET /api/contacts`
- `PUT /api/contacts/:id`
- `DELETE /api/contacts/:id/optout`

### Email

- `POST /api/email/send`
- `POST /api/email/schedule`
- `GET /api/email/history/:id`

## Recommended Run Order For Testing

Use this sequence when testing the app for the first time:

1. Set up `backend/.env`.
2. Start the backend.
3. Open `http://localhost:3001/api/health` and confirm it returns `{"ok":true}`.
4. Start the frontend.
5. Open `http://localhost:5173`.
6. Run a small scrape with `maxResults` set to `5`.
7. Confirm contacts appear in the list.
8. Confirm `data/results.csv` is created.
9. Test email sending only after SMTP credentials are configured correctly.

## Important Notes

### Scraping limitations

- Google Maps markup changes often, so selectors may need maintenance.
- Heavy scraping may trigger bot detection or temporary blocks.
- For production use, a legal API such as Google Places API is safer and more reliable.

### Email sending

- Gmail SMTP requires an App Password.
- Do not start with high-volume sending.
- Personalize emails and honor opt-out requests.

### Current implementation status

Implemented now:

- Backend server and API routes
- SQLite persistence
- Frontend dashboard shell
- Google Maps scrape job state tracking
- CSV export
- Contact storage and duplicate-aware upsert logic
- Template-based email sending
- Basic email history display

Not fully implemented yet:

- Full automated multi-step warmup execution
- IMAP reply polling
- Open tracking
- Advanced analytics
- Rich CSV review tools like filtering/sorting controls
- Production-hardening for Google Maps scraping

## Troubleshooting

### Frontend starts but no contacts appear

- Confirm the backend is running on port `3001`
- Confirm the scrape completed without errors
- Check whether `backend/db/contacts.sqlite` was created

### Scrape fails

- Google Maps may have changed its page structure
- Puppeteer may be blocked by local browser/network restrictions
- Try a smaller query and lower result count first

### Email send fails

- Verify `SMTP_USER` and `SMTP_APP_PASSWORD`
- Make sure the selected contact has an email address
- Check backend terminal logs for the SMTP error

## Next Suggested Improvements

- Add reply tracking with IMAP
- Add manual contact editing from the dashboard
- Add better sequence automation with actual timed sending
- Add CSV filtering, notes, and owner-name editing
- Add Google Places API support as an alternative scraper mode
