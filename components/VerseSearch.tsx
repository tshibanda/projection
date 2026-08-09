"use client";

import { useMemo, useState } from "react";
import { searchVerses } from "@/lib/verses";

interface VerseSearchProps {
  onAdd: (reference: string, text: string) => void;
}

export default function VerseSearch({ onAdd }: VerseSearchProps) {
  const [query, setQuery] = useState("");
  const [customRef, setCustomRef] = useState("");
  const [customText, setCustomText] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const results = useMemo(() => searchVerses(query).slice(0, 8), [query]);

  return (
    <div className="rounded-xl border border-white/10 bg-panel p-4">
      <h3 className="mb-3 text-sm font-semibold text-white/80">Bibliothèque de versets</h3>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher (ex: Jean 3:16, espérance...)"
        className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
        {results.map((v) => (
          <button
            key={v.reference}
            onClick={() => onAdd(v.reference, v.text)}
            className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5"
          >
            <span className="block font-medium text-accent2">{v.reference}</span>
            <span className="block truncate text-white/60">{v.text}</span>
          </button>
        ))}
        {results.length === 0 && (
          <p className="px-3 py-2 text-sm text-white/40">Aucun résultat.</p>
        )}
      </div>

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
              onAdd(customRef.trim() || "Verset personnalisé", customText.trim());
              setCustomRef("");
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
