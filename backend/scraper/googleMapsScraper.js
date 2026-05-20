import fs from 'node:fs';
import path from 'node:path';
import { createObjectCsvWriter } from 'csv-writer';
import { updateScrapeState } from './scrapeState.js';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const CONTACT_PATH_HINTS = ['contact', 'about', 'reach', 'support', 'menu'];

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveCsvPath() {
  const configuredPath = process.env.CSV_OUTPUT_PATH || '../data/results.csv';
  return path.resolve(process.cwd(), configuredPath);
}

async function exportToCsv(results) {
  const csvPath = resolveCsvPath();
  fs.mkdirSync(path.dirname(csvPath), { recursive: true });

  const writer = createObjectCsvWriter({
    path: csvPath,
    header: [
      { id: 'name', title: 'name' },
      { id: 'address', title: 'address' },
      { id: 'phone', title: 'phone' },
      { id: 'email', title: 'email' },
      { id: 'website', title: 'website' },
      { id: 'rating', title: 'rating' },
      { id: 'area', title: 'area' },
      { id: 'status', title: 'status' }
    ]
  });

  await writer.writeRecords(results);
  return csvPath;
}

async function loadPuppeteer() {
  const module = await import('puppeteer');
  return module.default ?? module;
}

function extractFirstEmail(value) {
  const matches = String(value || '').match(EMAIL_REGEX) || [];
  const filtered = matches.filter((entry) => !entry.includes('.png') && !entry.includes('.jpg'));
  return filtered[0] || '';
}

async function scrapeEmailFromWebsite(browser, websiteUrl) {
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  );

  try {
    await page.goto(websiteUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const directEmail = await page.evaluate((emailRegexSource) => {
      const emailRegex = new RegExp(emailRegexSource, 'g');
      const bodyText = document.body?.innerText || '';
      const bodyMatch = bodyText.match(emailRegex)?.[0];
      if (bodyMatch) {
        return bodyMatch;
      }

      const mailtoLink = Array.from(document.querySelectorAll('a[href^="mailto:"]'))[0];
      return mailtoLink?.getAttribute('href') || '';
    }, EMAIL_REGEX.source);

    const firstEmail = extractFirstEmail(directEmail);
    if (firstEmail) {
      return firstEmail;
    }

    const contactLinks = await page.$$eval('a[href]', (links, pathHints) => {
      return links
        .map((link) => link.href)
        .filter(Boolean)
        .filter((href) => pathHints.some((hint) => href.toLowerCase().includes(hint)))
        .slice(0, 5);
    }, CONTACT_PATH_HINTS);

    for (const link of contactLinks) {
      try {
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 10000 });
        const text = await page.evaluate(() => document.body?.innerText || '');
        const nestedEmail = extractFirstEmail(text);
        if (nestedEmail) {
          return nestedEmail;
        }
      } catch {
        // Keep trying other likely contact pages.
      }
    }

    return '';
  } catch {
    return '';
  } finally {
    await page.close();
  }
}

export async function scrapeGoogleMaps(query, maxResults = 20) {
  updateScrapeState({
    active: true,
    query,
    total: maxResults,
    processed: 0,
    message: 'Launching scraper',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    error: null,
    results: []
  });

  let browser;

  try {
    const puppeteer = await loadPuppeteer();
    browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );

    const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    updateScrapeState({ message: 'Opening Google Maps search' });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    await page.waitForSelector('[role="feed"]', { timeout: 15000 });
    const resultsPanel = await page.$('[role="feed"]');

    for (let i = 0; i < 8; i += 1) {
      if (!resultsPanel) {
        break;
      }

      updateScrapeState({ message: `Loading map results (${i + 1}/8)` });
      await page.evaluate((panel) => panel.scrollBy(0, 1000), resultsPanel);
      await delay(1200 + Math.floor(Math.random() * 800));
    }

    const listings = await page.$$('a[href*="/maps/place/"]');
    const dedupedListings = [];
    const seen = new Set();

    for (const listing of listings) {
      const href = await listing.evaluate((node) => node.href);
      if (href && !seen.has(href)) {
        seen.add(href);
        dedupedListings.push(listing);
      }
    }

    const results = [];
    const slice = dedupedListings.slice(0, maxResults);

    for (let index = 0; index < slice.length; index += 1) {
      const listing = slice[index];
      updateScrapeState({
        message: `Processing listing ${index + 1} of ${slice.length}`,
        processed: index
      });

      await listing.click();
      await page.waitForSelector('h1', { timeout: 10000 });
      await delay(1800 + Math.floor(Math.random() * 1200));

      const data = await page.evaluate(() => ({
        name: document.querySelector('h1')?.textContent?.trim() || '',
        address:
          document.querySelector('[data-item-id="address"]')?.textContent?.trim() || '',
        phone:
          document.querySelector('[data-item-id*="phone"]')?.textContent?.trim() || '',
        website:
          document.querySelector('[data-item-id="authority"] a')?.href?.trim() || '',
        rating:
          document.querySelector('[role="img"][aria-label*="stars"]')?.getAttribute('aria-label') ||
          ''
      }));

      const email = data.website ? await scrapeEmailFromWebsite(browser, data.website) : '';

      results.push({
        ...data,
        email,
        area: query,
        status: 'pending'
      });

      updateScrapeState({
        processed: index + 1,
        results: [...results]
      });
    }

    const csvPath = await exportToCsv(results);
    updateScrapeState({
      active: false,
      message: `Scrape complete. Exported to ${csvPath}`,
      finishedAt: new Date().toISOString(),
      results
    });

    return results;
  } catch (error) {
    updateScrapeState({
      active: false,
      error: error.message,
      message: 'Scrape failed',
      finishedAt: new Date().toISOString()
    });
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
