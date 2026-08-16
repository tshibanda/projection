"use client";

import { useEffect, useRef, useState } from "react";
import { defaultStyle, ShowStyle } from "@/lib/types";
import { deleteStylePreset, listStylePresets, saveStylePreset, StylePreset } from "@/lib/stylePresets";

interface StylePanelProps {
  style: ShowStyle;
  onChange: (patch: Partial<ShowStyle>) => void;
  showImageControls?: boolean;
  isVideoBackground?: boolean;
}

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_FONT_BYTES = 6 * 1024 * 1024;

export default function StylePanel({
  style,
  onChange,
  showImageControls = false,
  isVideoBackground = false,
}: StylePanelProps) {
  const bandImageInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const [presets, setPresets] = useState<StylePreset[]>([]);
  const [newPresetName, setNewPresetName] = useState("");

  useEffect(() => {
    setPresets(listStylePresets());
  }, []);

  const handleSavePreset = () => {
    const name = newPresetName.trim();
    if (!name) return;
    const saved = saveStylePreset(name, style);
    if (!saved) {
      alert("Impossible d'enregistrer ce style favori (stockage local plein).");
      return;
    }
    setPresets(listStylePresets());
    setNewPresetName("");
  };

  const handleDeletePreset = (id: string) => {
    deleteStylePreset(id);
    setPresets(listStylePresets());
  };

  const handleBandImage = (file: File) => {
    if (file.size > MAX_IMAGE_BYTES) {
      alert("Image trop lourde (max 3 Mo). Choisissez une image plus légère.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange({ bandImage: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleFontImport = (file: File) => {
    if (file.size > MAX_FONT_BYTES) {
      alert("Police trop lourde (max 6 Mo). Choisissez un fichier plus léger.");
      return;
    }
    const name = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, " ").trim() || "Police importée";
    const reader = new FileReader();
    reader.onload = () =>
      onChange({
        fontFamily: "custom",
        customFontName: name,
        customFontData: reader.result as string,
      });
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-panel p-4">
      <h3 className="mb-3 text-sm font-semibold text-white/80">Styles favoris</h3>
      <div className="mb-6 space-y-2 border-b border-white/10 pb-4 text-sm">
        <div className="flex gap-2">
          <input
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
            placeholder="Nom du style (ex: Culte du dimanche)"
            className="flex-1 rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            onClick={handleSavePreset}
            disabled={!newPresetName.trim()}
            className="rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
          >
            Enregistrer
          </button>
        </div>
        {presets.length > 0 && (
          <ul className="space-y-1">
            {presets.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-white/70"
              >
                <span className="truncate">{p.name}</span>
                <span className="flex shrink-0 gap-3">
                  <button
                    onClick={() => onChange({ ...defaultStyle, ...p.style })}
                    className="text-accent2 hover:underline"
                  >
                    Appliquer
                  </button>
                  <button
                    onClick={() => handleDeletePreset(p.id)}
                    className="text-red-400/70 hover:underline"
                  >
                    Supprimer
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

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
            {style.customFontName && (
              <button
                onClick={() => onChange({ fontFamily: "custom" })}
                className={`flex-1 truncate rounded-lg border px-3 py-2 ${
                  style.fontFamily === "custom"
                    ? "border-accent bg-accent/20 text-white"
                    : "border-white/10 text-white/60 hover:bg-white/5"
                }`}
                title={style.customFontName}
              >
                {style.customFontName}
              </button>
            )}
          </div>
          <input
            ref={fontInputRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFontImport(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fontInputRef.current?.click()}
            className="mt-2 w-full rounded-lg border border-dashed border-white/15 px-3 py-2 text-xs text-white/60 hover:bg-white/5"
          >
            Importer une police (.ttf, .otf, .woff, .woff2)…
          </button>
        </div>

        <div>
          <label className="mb-1 flex justify-between text-white/60">
            <span>Taille du texte</span>
            <span>{style.fontSize.toFixed(1)}</span>
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
          <label className="mb-1 block text-white/60">Couleur du verset</label>
          <input
            type="color"
            value={style.textColor}
            onChange={(e) => onChange({ textColor: e.target.value })}
            className="h-9 w-full cursor-pointer rounded-lg border border-white/10 bg-ink"
          />
        </div>

        <div>
          <label className="mb-1 block text-white/60">Couleur de la référence</label>
          <input
            type="color"
            value={style.referenceColor ?? "#22d3ee"}
            onChange={(e) => onChange({ referenceColor: e.target.value })}
            className="h-9 w-full cursor-pointer rounded-lg border border-white/10 bg-ink"
          />
        </div>

        <div>
          <label className="mb-1 block text-white/60">Police de la référence / version</label>
          <div className="flex gap-2">
            {(["serif", "sans"] as const).map((f) => (
              <button
                key={f}
                onClick={() => onChange({ referenceFontFamily: f })}
                className={`flex-1 rounded-lg border px-3 py-2 ${
                  (style.referenceFontFamily ?? defaultStyle.referenceFontFamily) === f
                    ? "border-accent bg-accent/20 text-white"
                    : "border-white/10 text-white/60 hover:bg-white/5"
                }`}
              >
                {f === "serif" ? "Classique" : "Moderne"}
              </button>
            ))}
            {style.customFontName && (
              <button
                onClick={() => onChange({ referenceFontFamily: "custom" })}
                className={`flex-1 truncate rounded-lg border px-3 py-2 ${
                  (style.referenceFontFamily ?? defaultStyle.referenceFontFamily) === "custom"
                    ? "border-accent bg-accent/20 text-white"
                    : "border-white/10 text-white/60 hover:bg-white/5"
                }`}
                title={style.customFontName}
              >
                {style.customFontName}
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 flex justify-between text-white/60">
            <span>Taille de la référence</span>
            <span>{(style.referenceFontSize ?? defaultStyle.referenceFontSize).toFixed(1)}</span>
          </label>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.1}
            value={style.referenceFontSize ?? defaultStyle.referenceFontSize}
            onChange={(e) => onChange({ referenceFontSize: parseFloat(e.target.value) })}
            className="w-full"
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

        <div>
          <label className="mb-1 block text-white/60">Alignement du verset</label>
          <div className="flex gap-2">
            {(["left", "center", "right"] as const).map((a) => (
              <button
                key={a}
                onClick={() => onChange({ verseTextAlign: a })}
                className={`flex-1 rounded-lg border px-3 py-2 ${
                  (style.verseTextAlign ?? "left") === a
                    ? "border-accent bg-accent/20 text-white"
                    : "border-white/10 text-white/60 hover:bg-white/5"
                }`}
              >
                {a === "left" ? "Gauche" : a === "center" ? "Centre" : "Droite"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 flex justify-between text-white/60">
            <span>Largeur de la zone — verset</span>
            <span>{style.verseBoxWidth ?? 88}%</span>
          </label>
          <input
            type="range"
            min={20}
            max={100}
            value={style.verseBoxWidth ?? 88}
            onChange={(e) => onChange({ verseBoxWidth: parseInt(e.target.value, 10) })}
            className="w-full"
          />
        </div>
        <div>
          <label className="mb-1 flex justify-between text-white/60">
            <span>Hauteur de la zone — verset</span>
            <span>{style.verseBoxHeight ?? defaultStyle.verseBoxHeight}%</span>
          </label>
          <input
            type="range"
            min={5}
            max={95}
            value={style.verseBoxHeight ?? defaultStyle.verseBoxHeight}
            onChange={(e) => onChange({ verseBoxHeight: parseInt(e.target.value, 10) })}
            className="w-full"
          />
        </div>
        <div>
          <label className="mb-1 flex justify-between text-white/60">
            <span>Largeur de la zone — référence</span>
            <span>{style.referenceBoxWidth ?? 88}%</span>
          </label>
          <input
            type="range"
            min={20}
            max={100}
            value={style.referenceBoxWidth ?? 88}
            onChange={(e) => onChange({ referenceBoxWidth: parseInt(e.target.value, 10) })}
            className="w-full"
          />
        </div>
        <div>
          <label className="mb-1 flex justify-between text-white/60">
            <span>Hauteur de la zone — référence</span>
            <span>{style.referenceBoxHeight ?? defaultStyle.referenceBoxHeight}%</span>
          </label>
          <input
            type="range"
            min={5}
            max={95}
            value={style.referenceBoxHeight ?? defaultStyle.referenceBoxHeight}
            onChange={(e) => onChange({ referenceBoxHeight: parseInt(e.target.value, 10) })}
            className="w-full"
          />
        </div>

        <p className="text-xs leading-relaxed text-white/35">
          Le texte qui dépasse la zone allouée continue automatiquement sur une
          nouvelle diapo dans le déroulé.
        </p>

        <label className="flex items-center justify-between">
          <span className="text-white/60">Fond transparent</span>
          <input
            type="checkbox"
            checked={style.transparentBg}
            onChange={(e) => onChange({ transparentBg: e.target.checked })}
            className="h-4 w-4 accent-accent"
          />
        </label>
        <p className="-mt-2 text-xs leading-relaxed text-white/40">
          Rend la page (et les zones transparentes d&apos;une image PNG) réellement
          transparentes — utile pour incruster le texte par-dessus une autre
          source (OBS, régie vidéo...).
        </p>
        {isVideoBackground && !style.transparentBg && (
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

      {showImageControls && (
        <div className="mt-6 border-t border-white/10 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-white/80">Image de fond</h3>
          <div className="space-y-4 text-sm">
            <div>
              <label className="mb-1 flex justify-between text-white/60">
                <span>Taille</span>
                <span>{style.imageScale ?? 100}%</span>
              </label>
              <input
                type="range"
                min={10}
                max={200}
                value={style.imageScale ?? 100}
                onChange={(e) => onChange({ imageScale: parseInt(e.target.value, 10) })}
                className="w-full"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-ink px-3 py-2 text-xs text-white/50">
              <span>Glissez l&apos;image dans l&apos;aperçu pour la repositionner.</span>
              <button
                onClick={() => onChange({ imagePos: defaultStyle.imagePos, imageScale: defaultStyle.imageScale })}
                className="ml-2 shrink-0 whitespace-nowrap text-accent2 hover:underline"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

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
