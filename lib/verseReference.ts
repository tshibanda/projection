export interface ReferenceRangeQuery {
  book: string;
  chapter: number;
  start: number | null; // null = whole chapter (no verse specified)
  end: number | null;
}

const RANGE_PATTERN = /^\s*(.+?)\s+(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+))?\s*$/;
const CHAPTER_PATTERN = /^\s*(.+?)\s+(\d+)\s*$/;

export function parseReferenceQuery(query: string): ReferenceRangeQuery | null {
  const rangeMatch = query.match(RANGE_PATTERN);
  if (rangeMatch) {
    const [, book, chapterStr, startStr, endStr] = rangeMatch;
    const chapter = parseInt(chapterStr, 10);
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : start;
    if (!book.trim() || Number.isNaN(chapter) || Number.isNaN(start) || Number.isNaN(end) || end < start) {
      return null;
    }
    return { book: book.trim(), chapter, start, end };
  }

  // No verse given (e.g. "Jean 5") — matched separately from the range
  // pattern above so a trailing "chapter:verse" always takes precedence.
  const chapterMatch = query.match(CHAPTER_PATTERN);
  if (chapterMatch) {
    const [, book, chapterStr] = chapterMatch;
    const chapter = parseInt(chapterStr, 10);
    if (!book.trim() || Number.isNaN(chapter)) return null;
    return { book: book.trim(), chapter, start: null, end: null };
  }

  return null;
}

export function referenceFor(book: string, chapter: number, verse: number): string {
  return `${book} ${chapter}:${verse}`;
}

// Prefix shared by every verse of a chapter (e.g. "Jean 5:"), used to pull
// the whole chapter when no verse number was given.
export function chapterPrefixFor(book: string, chapter: number): string {
  return `${book} ${chapter}:`;
}
