// Lowercases and strips diacritics (accents) so search/matching treats
// "Jean", "jean" and "jéan" as equivalent — French verse references and
// book names carry accents users often skip when typing quickly.
export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
