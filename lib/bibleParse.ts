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
