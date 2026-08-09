"use client";

import { ShowStyle } from "@/lib/types";

interface StylePanelProps {
  style: ShowStyle;
  onChange: (patch: Partial<ShowStyle>) => void;
}

export default function StylePanel({ style, onChange }: StylePanelProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-panel p-4">
      <h3 className="mb-3 text-sm font-semibold text-white/80">Style du texte</h3>

      <div className="space-y-4 text-sm">
        <div>
          <label className="mb-1 block text-white/60">Police</label>
          <div className="flex gap-2">
            {(["serif", "sans"] as const).map((f) => (
              <button
                key={f}
                onClick={() => onChange({ fontFamily: f })}
                className={`flex-1 rounded-lg border px-3 py-2 ${
                  style.fontFamily === f
                    ? "border-accent bg-accent/20 text-white"
                    : "border-white/10 text-white/60 hover:bg-white/5"
                }`}
              >
                {f === "serif" ? "Classique" : "Moderne"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 flex justify-between text-white/60">
            <span>Taille du texte</span>
            <span>{style.fontSize.toFixed(1)}vw</span>
          </label>
          <input
            type="range"
            min={1.5}
            max={8}
            step={0.1}
            value={style.fontSize}
            onChange={(e) => onChange({ fontSize: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <label className="mb-1 block text-white/60">Couleur du texte</label>
          <input
            type="color"
            value={style.textColor}
            onChange={(e) => onChange({ textColor: e.target.value })}
            className="h-9 w-full cursor-pointer rounded-lg border border-white/10 bg-ink"
          />
        </div>

        <div>
          <label className="mb-1 block text-white/60">Position</label>
          <div className="flex gap-2">
            {(["top", "center", "bottom"] as const).map((p) => (
              <button
                key={p}
                onClick={() => onChange({ position: p })}
                className={`flex-1 rounded-lg border px-3 py-2 ${
                  style.position === p
                    ? "border-accent bg-accent/20 text-white"
                    : "border-white/10 text-white/60 hover:bg-white/5"
                }`}
              >
                {p === "top" ? "Haut" : p === "center" ? "Centre" : "Bas"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 flex justify-between text-white/60">
            <span>Voile sombre sur la vidéo</span>
            <span>{style.overlayOpacity}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={90}
            value={style.overlayOpacity}
            onChange={(e) => onChange({ overlayOpacity: parseInt(e.target.value, 10) })}
            className="w-full"
          />
        </div>

        <label className="flex items-center justify-between">
          <span className="text-white/60">Contour du texte</span>
          <input
            type="checkbox"
            checked={style.showOutline}
            onChange={(e) => onChange({ showOutline: e.target.checked })}
            className="h-4 w-4 accent-accent"
          />
        </label>

        <label className="flex items-center justify-between">
          <span className="text-white/60">Ombre portée</span>
          <input
            type="checkbox"
            checked={style.showShadow}
            onChange={(e) => onChange({ showShadow: e.target.checked })}
            className="h-4 w-4 accent-accent"
          />
        </label>

        <label className="flex items-center justify-between">
          <span className="text-white/60">Afficher la référence</span>
          <input
            type="checkbox"
            checked={style.showReference}
            onChange={(e) => onChange({ showReference: e.target.checked })}
            className="h-4 w-4 accent-accent"
          />
        </label>
      </div>

      <div className="mt-6 border-t border-white/10 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-white/80">Bandeau derrière le texte</h3>
        <div className="space-y-4 text-sm">
          <label className="flex items-center justify-between">
            <span className="text-white/60">Activer le bandeau</span>
            <input
              type="checkbox"
              checked={style.bandEnabled}
              onChange={(e) => onChange({ bandEnabled: e.target.checked })}
              className="h-4 w-4 accent-accent"
            />
          </label>

          {style.bandEnabled && (
            <>
              <div>
                <label className="mb-1 block text-white/60">Couleur du bandeau</label>
                <input
                  type="color"
                  value={style.bandColor}
                  onChange={(e) => onChange({ bandColor: e.target.value })}
                  className="h-9 w-full cursor-pointer rounded-lg border border-white/10 bg-ink"
                />
              </div>
              <div>
                <label className="mb-1 flex justify-between text-white/60">
                  <span>Opacité du bandeau</span>
                  <span>{style.bandOpacity}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={style.bandOpacity}
                  onChange={(e) => onChange({ bandOpacity: parseInt(e.target.value, 10) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-white/60">Largeur</label>
                <div className="flex gap-2">
                  {(["fit", "full"] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => onChange({ bandWidth: w })}
                      className={`flex-1 rounded-lg border px-3 py-2 ${
                        style.bandWidth === w
                          ? "border-accent bg-accent/20 text-white"
                          : "border-white/10 text-white/60 hover:bg-white/5"
                      }`}
                    >
                      {w === "fit" ? "Ajustée au texte" : "Pleine largeur"}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-white/10 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-white/80">Mode OBS</h3>
        <label className="flex items-center justify-between text-sm">
          <span className="text-white/60">Fond transparent (source Navigateur OBS)</span>
          <input
            type="checkbox"
            checked={style.transparentBg}
            onChange={(e) => onChange({ transparentBg: e.target.checked })}
            className="h-4 w-4 accent-accent"
          />
        </label>
        {style.transparentBg && (
          <p className="mt-2 text-xs leading-relaxed text-white/40">
            La vidéo de fond est masquée sur l&apos;écran Live : ajoutez l&apos;URL
            <code className="mx-1 rounded bg-white/10 px-1">/live/…</code>
            comme source Navigateur dans OBS, par-dessus votre propre scène.
          </p>
        )}
      </div>
    </div>
  );
}
