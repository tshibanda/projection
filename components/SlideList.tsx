"use client";

import { Slide } from "@/lib/types";

interface SlideListProps {
  slides: Slide[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
}

export default function SlideList({
  slides,
  activeIndex,
  onSelect,
  onRemove,
  onMove,
}: SlideListProps) {
  if (slides.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/40">
        Aucun verset pour l&apos;instant. Ajoutez-en depuis la bibliothèque à droite.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`group flex items-start gap-2 rounded-xl border p-3 transition ${
            i === activeIndex
              ? "border-accent bg-accent/10"
              : "border-white/10 bg-panel hover:border-white/20"
          }`}
        >
          <button onClick={() => onSelect(i)} className="flex-1 text-left">
            <span className="block text-xs font-semibold uppercase tracking-wide text-accent2">
              {slide.reference || `Diapositive ${i + 1}`}
            </span>
            <span className="mt-1 block line-clamp-2 text-sm text-white/70">
              {slide.text}
            </span>
          </button>
          <div className="flex flex-col gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              onClick={() => onMove(i, -1)}
              disabled={i === 0}
              className="rounded px-1.5 py-0.5 text-xs text-white/50 hover:bg-white/10 disabled:opacity-20"
              title="Monter"
            >
              ↑
            </button>
            <button
              onClick={() => onMove(i, 1)}
              disabled={i === slides.length - 1}
              className="rounded px-1.5 py-0.5 text-xs text-white/50 hover:bg-white/10 disabled:opacity-20"
              title="Descendre"
            >
              ↓
            </button>
            <button
              onClick={() => onRemove(slide.id)}
              className="rounded px-1.5 py-0.5 text-xs text-red-400/70 hover:bg-red-500/10"
              title="Supprimer"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
