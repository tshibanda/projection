"use client";

import { useRef } from "react";
import { defaultStyle, ShowStyle } from "@/lib/types";

interface StylePanelProps {
  style: ShowStyle;
  onChange: (patch: Partial<ShowStyle>) => void;
}

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

export default function StylePanel({ style, onChange }: StylePanelProps) {
  const bandImageInputRef = useRef<HTMLInputElement>(null);

  const handleBandImage = (file: File) => {
    if (file.size > MAX_IMAGE_BYTES) {
      alert("Image trop lourde (max 3 Mo). Choisissez une image plus légère.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange({ bandImage: reader.result as string });
    reader.readAsDataURL(file);
  };

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

        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-ink px-3 py-2 text-xs text-white/50">
          <span>Glissez le verset ou la référence dans l&apos;aperçu pour les repositionner.</span>
          <button
            onClick={() =>
              onChange({ versePos: defaultStyle.versePos, referencePos: defaultStyle.referencePos })
            }
            className="ml-2 shrink-0 whitespace-nowrap text-accent2 hover:underline"
          >
            Réinitialiser
          </button>
        </div>

        <label className="flex items-center justify-between">
          <span className="text-white/60">Fond transparent</span>
          <input
            type="checkbox"
            checked={style.transparentBg}
            onChange={(e) => onChange({ transparentBg: e.target.checked })}
            className="h-4 w-4 accent-accent"
          />
        </label>
        {style.transparentBg ? (
          <p className="-mt-2 text-xs leading-relaxed text-white/40">
            Aucune vidéo/fond n&apos;est affichée sur l&apos;écran Live — utile pour
            incruster le texte par-dessus une autre source (OBS, régie vidéo...).
          </p>
        ) : (
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
        )}

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
        <h3 className="mb-3 text-sm font-semibold text-white/80">Bandeau derrière le verset</h3>
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
              <div>
                <label className="mb-1 block text-white/60">Image de fond du bandeau</label>
                <input
                  ref={bandImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleBandImage(file);
                    e.target.value = "";
                  }}
                />
                {style.bandImage ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={style.bandImage}
                      alt="Aperçu du bandeau"
                      className="h-12 w-20 rounded-lg border border-white/10 object-cover"
                    />
                    <button
                      onClick={() => bandImageInputRef.current?.click()}
                      className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 hover:bg-white/5"
                    >
                      Changer
                    </button>
                    <button
                      onClick={() => onChange({ bandImage: null })}
                      className="text-xs text-red-400/70 hover:underline"
                    >
                      Retirer
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => bandImageInputRef.current?.click()}
                    className="w-full rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
                  >
                    Importer une image…
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
