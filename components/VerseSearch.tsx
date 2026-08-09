"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseBibleJson, ImportedVerse } from "@/lib/bibleParse";
import { parseReferenceQuery, referenceFor } from "@/lib/verseReference";
import {
  listImportedVersionNames,
  loadBibleVersion,
  removeBibleVersion,
  storeBibleVersion,
} from "@/lib/bibleDb";

export interface VerseToAdd {
  reference: string;
  text: string;
  version: string;
}

interface VerseSearchProps {
  onAdd: (reference: string, text: string, version: string) => void;
  onAddMany: (items: VerseToAdd[]) => void;
}

const MAX_IMPORT_BYTES = 30 * 1024 * 1024;

function searchImported(verses: ImportedVerse[], query: string): ImportedVerse[] {
  const q = query.trim().toLowerCase();
  if (!q) return verses.slice(0, 8);
  const results: ImportedVerse[] = [];
  for (const v of verses) {
    if (v.reference.toLowerCase().includes(q) || v.text.toLowerCase().includes(q)) {
      results.push(v);
      if (results.length >= 8) break;
    }
  }
  return results;
}

export default function VerseSearch({ onAdd, onAddMany }: VerseSearchProps) {
  const [query, setQuery] = useState("");
  const [customRef, setCustomRef] = useState("");
  const [customText, setCustomText] = useState("");
  const [customVersion, setCustomVersion] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [showManageVersions, setShowManageVersions] = useState(false);

  const [importedNames, setImportedNames] = useState<string[]>([]);
  const [activeVersion, setActiveVersion] = useState("");
  const [activeVerses, setActiveVerses] = useState<ImportedVerse[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const names = listImportedVersionNames();
    setImportedNames(names);
    if (names.length > 0) setActiveVersion(names[0]);
  }, []);

  useEffect(() => {
    if (!activeVersion) {
      setActiveVerses(null);
      return;
    }
    let cancelled = false;
    loadBibleVersion(activeVersion).then((verses) => {
      if (!cancelled) setActiveVerses(verses ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [activeVersion]);

  const refQuery = useMemo(() => parseReferenceQuery(query), [query]);

  const exactMatches = useMemo(() => {
    if (!refQuery || !activeVerses) return [];
    const wanted: ImportedVerse[] = [];
    for (let v = refQuery.start; v <= refQuery.end; v++) {
      const target = referenceFor(refQuery.book, refQuery.chapter, v).toLowerCase();
      const found = activeVerses.find((av) => av.reference.toLowerCase() === target);
      if (found) wanted.push(found);
    }
    return wanted;
  }, [refQuery, activeVerses]);

  const results = useMemo(() => {
    if (refQuery || !activeVerses) return [];
    return searchImported(activeVerses, query);
  }, [refQuery, activeVerses, query]);

  const handleImportFile = async (file: File) => {
    setImportError(null);
    if (file.size > MAX_IMPORT_BYTES) {
      setImportError("Fichier trop volumineux (max 30 Mo).");
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = parseBibleJson(text);
      await storeBibleVersion(parsed.name, parsed.verses);
      setImportedNames(listImportedVersionNames());
      setActiveVersion(parsed.name);
      setActiveVerses(parsed.verses);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Échec de l'import.");
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteVersion = async (name: string) => {
    await removeBibleVersion(name);
    const names = listImportedVersionNames();
    setImportedNames(names);
    if (activeVersion === name) setActiveVersion(names[0] ?? "");
  };

  return (
    <div className="rounded-xl border border-white/10 bg-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/80">Bibliothèque de versets</h3>
        <button
          onClick={() => setShowManageVersions((v) => !v)}
          className="text-xs font-medium text-accent2 hover:underline"
        >
          Versions…
        </button>
      </div>

      {showManageVersions && (
        <div className="mb-3 space-y-2 rounded-lg border border-white/10 bg-ink p-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="w-full rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80 hover:bg-white/5 disabled:opacity-40"
          >
            {importing ? "Import en cours…" : "Importer une version (.json)"}
          </button>
          {importError && <p className="text-xs text-red-400">{importError}</p>}
          <p className="text-xs text-white/35">
            Format attendu :{" "}
            <code className="rounded bg-white/10 px-1">
              {"{ name, books: [{ name, verses: [{ Chapter, Verse, Text }] }] }"}
            </code>
          </p>
          {importedNames.length > 0 && (
            <ul className="space-y-1 pt-1">
              {importedNames.map((name) => (
                <li key={name} className="flex items-center justify-between text-xs text-white/60">
                  <span>{name}</span>
                  <button
                    onClick={() => handleDeleteVersion(name)}
                    className="text-red-400/70 hover:underline"
                  >
                    Supprimer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {importedNames.length === 0 ? (
        <p className="mb-3 text-sm text-white/40">
          Aucune version importée. Utilisez « Versions… » pour en ajouter une, ou ajoutez un
          verset personnalisé ci-dessous.
        </p>
      ) : (
        <>
          <label className="mb-2 block text-xs text-white/50">Version</label>
          <select
            value={activeVersion}
            onChange={(e) => setActiveVersion(e.target.value)}
            className="mb-3 w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
          >
            {importedNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (ex: Jean 4:4, Jean 4:4-6, espérance...)"
            className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
            {refQuery ? (
              exactMatches.length === 0 ? (
                <p className="px-3 py-2 text-sm text-white/40">
                  {activeVerses ? "Aucun verset trouvé pour cette référence." : "Chargement…"}
                </p>
              ) : refQuery.end === refQuery.start ? (
                <button
                  onClick={() => onAdd(exactMatches[0].reference, exactMatches[0].text, activeVersion)}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5"
                >
                  <span className="block font-medium text-accent2">{exactMatches[0].reference}</span>
                  <span className="block truncate text-white/60">{exactMatches[0].text}</span>
                </button>
              ) : (
                <button
                  onClick={() =>
                    onAddMany(
                      exactMatches.map((m) => ({ reference: m.reference, text: m.text, version: activeVersion }))
                    )
                  }
                  className="w-full rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-left text-sm hover:bg-accent/20"
                >
                  <span className="block font-medium text-accent2">
                    Ajouter {refQuery.book} {refQuery.chapter}:{refQuery.start}-{refQuery.end} (
                    {exactMatches.length} versets)
                  </span>
                  <span className="block text-white/60">
                    Chaque verset sera ajouté séparément dans le déroulé.
                  </span>
                </button>
              )
            ) : (
              <>
                {results.map((v) => (
                  <button
                    key={v.reference}
                    onClick={() => onAdd(v.reference, v.text, activeVersion)}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5"
                  >
                    <span className="block font-medium text-accent2">{v.reference}</span>
                    <span className="block truncate text-white/60">{v.text}</span>
                  </button>
                ))}
                {results.length === 0 && (
                  <p className="px-3 py-2 text-sm text-white/40">
                    {!activeVerses ? "Chargement…" : "Aucun résultat."}
                  </p>
                )}
              </>
            )}
          </div>
        </>
      )}

      <button
        onClick={() => setShowCustom((v) => !v)}
        className="mt-4 text-xs font-medium text-accent2 hover:underline"
      >
        {showCustom ? "Masquer" : "+ Ajouter un verset personnalisé"}
      </button>

      {showCustom && (
        <div className="mt-3 space-y-2">
          <input
            value={customRef}
            onChange={(e) => setCustomRef(e.target.value)}
            placeholder="Référence (ex: Romains 8:31)"
            className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            value={customVersion}
            onChange={(e) => setCustomVersion(e.target.value)}
            placeholder="Version (ex: LSG, NIV, Segond 21...)"
            className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Texte du verset"
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            disabled={!customText.trim()}
            onClick={() => {
              onAdd(customRef.trim() || "Verset personnalisé", customText.trim(), customVersion.trim());
              setCustomRef("");
              setCustomVersion("");
              setCustomText("");
            }}
            className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Ajouter à la présentation
          </button>
        </div>
      )}
    </div>
  );
}
