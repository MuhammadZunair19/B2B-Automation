const scrapeState = {
  active: false,
  query: '',
  processed: 0,
  total: 0,
  message: 'Idle',
  startedAt: null,
  finishedAt: null,
  error: null,
  results: []
};

const listeners = new Set();

export function getScrapeState() {
  return { ...scrapeState };
}

export function updateScrapeState(patch) {
  Object.assign(scrapeState, patch);
  for (const listener of listeners) {
    listener(getScrapeState());
  }
}

export function subscribeToScrapeState(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
