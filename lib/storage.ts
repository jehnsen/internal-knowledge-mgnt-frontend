// Local storage utilities for tracking user activity

export interface SearchHistoryItem {
  query: string;
  timestamp: string;
  resultsCount: number;
}

export interface RecentlyViewedDocument {
  id: number;
  title: string;
  timestamp: string;
  fileType?: string;
}

const SEARCH_HISTORY_KEY = 'ikms_search_history';
const RECENTLY_VIEWED_KEY = 'ikms_recently_viewed';
const MAX_HISTORY_ITEMS = 50;
const MAX_RECENTLY_VIEWED = 20;

// Search History
export function addToSearchHistory(query: string, resultsCount: number = 0): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getSearchHistory();

    // Remove duplicates (keep most recent)
    const filtered = history.filter(item => item.query.toLowerCase() !== query.toLowerCase());

    // Add new item at the beginning
    const newHistory = [
      {
        query,
        timestamp: new Date().toISOString(),
        resultsCount,
      },
      ...filtered,
    ].slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Failed to save search history:', error);
  }
}

export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!stored) return [];

    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load search history:', error);
    return [];
  }
}

export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear search history:', error);
  }
}

export function removeFromSearchHistory(query: string): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getSearchHistory();
    const filtered = history.filter(item => item.query !== query);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove from search history:', error);
  }
}

// Recently Viewed Documents
export function addToRecentlyViewed(document: {
  id: number;
  title: string;
  fileType?: string;
}): void {
  if (typeof window === 'undefined') return;

  try {
    const recent = getRecentlyViewed();

    // Remove duplicates
    const filtered = recent.filter(item => item.id !== document.id);

    // Add new item at the beginning
    const newRecent = [
      {
        ...document,
        timestamp: new Date().toISOString(),
      },
      ...filtered,
    ].slice(0, MAX_RECENTLY_VIEWED);

    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(newRecent));
  } catch (error) {
    console.error('Failed to save recently viewed:', error);
  }
}

export function getRecentlyViewed(): RecentlyViewedDocument[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!stored) return [];

    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load recently viewed:', error);
    return [];
  }
}

export function clearRecentlyViewed(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
  } catch (error) {
    console.error('Failed to clear recently viewed:', error);
  }
}

export function removeFromRecentlyViewed(documentId: number): void {
  if (typeof window === 'undefined') return;

  try {
    const recent = getRecentlyViewed();
    const filtered = recent.filter(item => item.id !== documentId);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove from recently viewed:', error);
  }
}
