export interface ReferenceRangeQuery {
  book: string;
  chapter: number;
  start: number;
  end: number;
}

const REFERENCE_PATTERN = /^\s*(.+?)\s+(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+))?\s*$/;

export function parseReferenceQuery(query: string): ReferenceRangeQuery | null {
  const match = query.match(REFERENCE_PATTERN);
  if (!match) return null;
  const [, book, chapterStr, startStr, endStr] = match;
  const chapter = parseInt(chapterStr, 10);
  const start = parseInt(startStr, 10);
  const end = endStr ? parseInt(endStr, 10) : start;
  if (!book.trim() || Number.isNaN(chapter) || Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return null;
  }
  return { book: book.trim(), chapter, start, end };
}

export function referenceFor(book: string, chapter: number, verse: number): string {
  return `${book} ${chapter}:${verse}`;
}
