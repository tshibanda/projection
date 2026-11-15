// Turns noisy OCR text (read off a cropped region of a WorshipTools
// Presenter window/screen capture) into a verse from the user's own
// imported Bible version — matched by reference only, never by the OCR'd
// verse body itself, since a reference like "Jean 3:16" is short and far
// less likely to be misread than a full sentence.
import { ImportedVerse, extractBookNames } from "./bibleParse";
import { referenceFor } from "./verseReference";
import { normalizeForSearch } from "./textNormalize";

export interface DetectedVerse {
  reference: string;
  text: string;
}

function cleanOcrText(raw: string): string {
  return raw
    .replace(/\n+/g, " ")
    .replace(/[|_~`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Looks for "<chapter><separator><verse>" immediately after a known book
// name inside the (cleaned, normalized) OCR text, tolerating a little OCR
// noise between the book name and the digits (misread punctuation, a
// stray character) as well as a dropped/extra space inside multi-word
// book names (e.g. "1corinthiens" for "1 Corinthiens"). Longer book names
// are tried first so "1 Corinthiens" wins over a shorter false match.
function findReferenceInText(
  normalizedText: string,
  bookNames: string[]
): { book: string; chapter: number; verse: number } | null {
  const sorted = [...bookNames].sort((a, b) => b.length - a.length);
  for (const book of sorted) {
    const normalizedBook = normalizeForSearch(book);
    const flexiblePattern = normalizedBook.split(" ").map(escapeRegExp).join("\\s*");
    const match = normalizedText.match(new RegExp(flexiblePattern));
    if (!match || match.index === undefined) continue;
    const endIdx = match.index + match[0].length;
    const after = normalizedText.slice(endIdx, endIdx + 12);
    const m = after.match(/^\D{0,3}(\d{1,3})\D{1,3}(\d{1,3})/);
    if (!m) continue;
    const chapter = parseInt(m[1], 10);
    const verse = parseInt(m[2], 10);
    if (Number.isNaN(chapter) || Number.isNaN(verse)) continue;
    return { book, chapter, verse };
  }
  return null;
}

// Tries to resolve one OCR read into a verse that actually exists in the
// given version. Returns null if nothing recognizable was found.
export function matchDetectedReference(ocrText: string, verses: ImportedVerse[]): DetectedVerse | null {
  const cleaned = cleanOcrText(ocrText);
  if (!cleaned || verses.length === 0) return null;

  const bookNames = extractBookNames(verses);
  if (bookNames.length === 0) return null;

  const found = findReferenceInText(normalizeForSearch(cleaned), bookNames);
  if (!found) return null;

  const target = normalizeForSearch(referenceFor(found.book, found.chapter, found.verse));
  const verse = verses.find((v) => normalizeForSearch(v.reference) === target);
  return verse ? { reference: verse.reference, text: verse.text } : null;
}

// OCR reads the same frame slightly differently from one poll to the
// next, so a single read is never trusted on its own. A detection only
// fires once the same reference has come back on `requiredStableReads`
// consecutive reads, and only once per *new* reference — repeated reads
// of a reference already acted on are silently ignored, so the verse
// isn't re-projected (and doesn't reset the déroulé selection) every poll
// for as long as it stays on screen.
export class StableDetector {
  private lastFired: string | null = null;
  private pendingReference: string | null = null;
  private pendingCount = 0;

  constructor(private readonly requiredStableReads = 2) {}

  feed(detected: DetectedVerse | null): DetectedVerse | null {
    if (!detected) {
      this.pendingReference = null;
      this.pendingCount = 0;
      return null;
    }
    if (detected.reference === this.pendingReference) {
      this.pendingCount++;
    } else {
      this.pendingReference = detected.reference;
      this.pendingCount = 1;
    }
    if (this.pendingCount >= this.requiredStableReads && detected.reference !== this.lastFired) {
      this.lastFired = detected.reference;
      return detected;
    }
    return null;
  }

  // Lets the same reference fire again later (e.g. the operator moved
  // away and came back to it).
  reset() {
    this.lastFired = null;
    this.pendingReference = null;
    this.pendingCount = 0;
  }
}
