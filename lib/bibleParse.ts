export interface ImportedVerse {
  reference: string;
  text: string;
}

interface RawBibleVerse {
  Chapter: number;
  Verse: number;
  Text: string;
}

interface RawBibleBook {
  id?: string;
  name: string;
  verses: RawBibleVerse[];
}

interface RawBibleFile {
  name: string;
  books: RawBibleBook[];
}

export interface ParsedBibleVersion {
  name: string;
  verses: ImportedVerse[];
}

// Distinct book names found in a version's verses, in the order they first
// appear (i.e. canonical Bible order, since that's the order imported files
// list their verses in).
export function extractBookNames(verses: ImportedVerse[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const v of verses) {
    const m = v.reference.match(/^(.+?)\s+\d+:\d+$/);
    if (m && !seen.has(m[1])) {
      seen.add(m[1]);
      names.push(m[1]);
    }
  }
  return names;
}

export function parseBibleJson(raw: string): ParsedBibleVersion {
  let data: RawBibleFile;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Fichier JSON invalide.");
  }

  if (!data || typeof data.name !== "string" || !Array.isArray(data.books)) {
    throw new Error(
      'Format inattendu : le fichier doit contenir "name" (texte) et "books" (liste).'
    );
  }

  const verses: ImportedVerse[] = [];
  for (const book of data.books) {
    if (!book || typeof book.name !== "string" || !Array.isArray(book.verses)) continue;
    for (const v of book.verses) {
      if (!v || typeof v.Text !== "string" || typeof v.Chapter !== "number" || typeof v.Verse !== "number") {
        continue;
      }
      verses.push({
        reference: `${book.name} ${v.Chapter}:${v.Verse}`,
        text: v.Text,
      });
    }
  }

  if (verses.length === 0) {
    throw new Error("Aucun verset exploitable trouvé dans ce fichier.");
  }

  return { name: data.name, verses };
}
