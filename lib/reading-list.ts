/**
 * Reading List / Bookmark functionality
 * Uses localStorage for client-side persistence
 */

export interface ReadingListItem {
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
  date: string;
  addedAt: string;
}

const READING_LIST_KEY = 'wiredliving-reading-list';

/**
 * Get all bookmarked posts
 */
export function getReadingList(): ReadingListItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(READING_LIST_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading reading list:', error);
    return [];
  }
}

/**
 * Check if a post is bookmarked
 */
export function isBookmarked(slug: string): boolean {
  const list = getReadingList();
  return list.some(item => item.slug === slug);
}

/**
 * Add a post to reading list
 */
export function addToReadingList(post: Omit<ReadingListItem, 'addedAt'>): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const list = getReadingList();
    
    // Check if already bookmarked
    if (list.some(item => item.slug === post.slug)) {
      return false;
    }
    
    const newItem: ReadingListItem = {
      ...post,
      addedAt: new Date().toISOString(),
    };
    
    list.push(newItem);
    localStorage.setItem(READING_LIST_KEY, JSON.stringify(list));
    return true;
  } catch (error) {
    console.error('Error adding to reading list:', error);
    return false;
  }
}

/**
 * Remove a post from reading list
 */
export function removeFromReadingList(slug: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const list = getReadingList();
    const filtered = list.filter(item => item.slug !== slug);
    localStorage.setItem(READING_LIST_KEY, JSON.stringify(filtered));
    return filtered.length < list.length;
  } catch (error) {
    console.error('Error removing from reading list:', error);
    return false;
  }
}

/**
 * Toggle bookmark status
 */
export function toggleBookmark(post: Omit<ReadingListItem, 'addedAt'>): boolean {
  if (isBookmarked(post.slug)) {
    return removeFromReadingList(post.slug);
  } else {
    return addToReadingList(post);
  }
}

/**
 * Clear entire reading list
 */
export function clearReadingList(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(READING_LIST_KEY);
}

