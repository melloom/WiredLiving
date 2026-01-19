import type { Metadata } from 'next';
import { BookmarksClient } from './bookmarks-client';

export const metadata: Metadata = {
  title: 'My Bookmarks',
  description: 'Your saved articles for later reading',
};

export default function BookmarksPage() {
  return <BookmarksClient />;
}
