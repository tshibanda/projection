"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CaptureSource,
  isCaptureAvailable,
  listElectronCaptureSources,
  setElectronCaptureSource,
} from "@/lib/electronBridge";
import { listImportedVersionNames, loadBibleVersion } from "@/lib/bibleDb";
import { ImportedVerse } from "@/lib/bibleParse";
import { matchDetectedReference, StableDetector } from "@/lib/worshipToolsSync";

interface CropRect {
  x: number; // percentages of the captured frame, 0-100
  y: number;
  w: number;
  h: number;
}

interface PersistedSettings {
  sourceId: string | null;
  sourceName: string | null;
  cropRect: CropRect;
  versionName: string | null;
  enabled: boolean;
}

const SETTINGS_KEY = "verseflow:worshiptools-sync";
const DEFAULT_CROP: CropRect = { x: 15, y: 70, w: 70, h: 20 };
const OCR_INTERVAL_MS = 1300;

function loadSettings(): PersistedSettings {
  if (typeof window === "undefined") {
    return { sourceId: null, sourceName: null, cropRect: DEFAULT_CROP, versionName: null, enabled: false };
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) throw new Error("none");
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    return {
      sourceId: parsed.sourceId ?? null,
      sourceName: parsed.sourceName ?? null,
      cropRect: parsed.cropRect ?? DEFAULT_CROP,
      versionName: parsed.versionName ?? null,
      enabled: parsed.enabled ?? false,
    };
  } catch {
    return { sourceId: null, sourceName: null, cropRect: DEFAULT_CROP, versionName: null, enabled: false };
  }
}

function saveSettings(settings: PersistedSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Grabs the current video frame, crops it to `rect` (percentages of the
// full frame), and upscales small crops — the reference text is usually
// only a few dozen pixels tall at native capture resolution, and OCR
// accuracy drops sharply below roughly 200px of text height.
function captureCroppedFrame(video: HTMLVideoElement, rect: CropRect): HTMLCanvasElement | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;
  const sx = (rect.x / 100) * vw;
  const sy = (rect.y / 100) * vh;
  const sw = (rect.w / 100) * vw;
  const sh = (rect.h / 100) * vh;
  if (sw <= 0 || sh <= 0) return null;
  const scale = Math.max(1, 220 / sh);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export interface WorshipToolsSyncProps {
  // Fired once a reference has been read back-to-back and resolved
  // against the selected Bible version — the parent re-uses its existing
  // "add to déroulé + show live" flow, exactly as if the user had clicked
  // a search result themselves.
  onVerseDetected: (reference: string, text: string, version: string) => void;
}

export default function WorshipToolsSync({ onVerseDetected }: WorshipToolsSyncProps) {
  const [available, setAvailable] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [settings, setSettings] = useState<PersistedSettings>(() => loadSettings());
  const [sources, setSources] = useState<CaptureSource[] | null>(null);
  const [loadingSources, setLoadingSources] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [lastDetection, setLastDetection] = useState<{ reference: string; at: number } | null>(null);
  const [previewTick, setPreviewTick] = useState(0);

  const [importedNames, setImportedNames] = useState<string[]>([]);
  const [verses, setVerses] = useState<ImportedVerse[] | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef(new StableDetector(2));
  const dragRef = useRef<{ mode: "move" | "resize"; startX: number; startY: number; startRect: CropRect } | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAvailable(isCaptureAvailable());
    setImportedNames(listImportedVersionNames());
  }, []);

  useEffect(() => {
    const name = settings.versionName ?? importedNames[0] ?? null;
    if (!name) {
      setVerses(null);
      return;
    }
    let cancelled = false;
    loadBibleVersion(name).then((v) => {
      if (!cancelled) setVerses(v ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [settings.versionName, importedNames]);

  const updateSettings = useCallback((patch: Partial<PersistedSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const stopStream = useCallback(() => {
    setStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  useEffect(() => stopStream, [stopStream]);

  const openPicker = async () => {
    setStatusError(null);
    setLoadingSources(true);
    try {
      const list = await listElectronCaptureSources();
      setSources(list);
    } catch {
      setStatusError("Impossible de lister les fenêtres disponibles.");
    } finally {
      setLoadingSources(false);
    }
  };

  const chooseSource = async (source: CaptureSource) => {
    setStatusError(null);
    try {
      await setElectronCaptureSource(source.id);
      const media = await navigator.mediaDevices.getDisplayMedia({ video: true });
      media.getVideoTracks()[0]?.addEventListener("ended", () => {
        stopStream();
        setStatusError("La capture s'est arrêtée (fenêtre fermée ?). Resélectionnez la source.");
      });
      stopStream();
      setStream(media);
      updateSettings({ sourceId: source.id, sourceName: source.name });
      detectorRef.current.reset();
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Échec de la capture de cette source.");
    }
  };

  // Attach/detach the chosen stream to the hidden <video> element used
  // both for the crop-rectangle preview and for the OCR polling loop.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) video.play().catch(() => {});
  }, [stream]);

  // Setup-mode preview: redraw the full frame every second so the crop
  // rectangle can be positioned against something that's actually on
  // screen right now, without running this (slightly wasteful) draw loop
  // once the panel is collapsed.
  useEffect(() => {
    if (!expanded || !stream) return;
    const video = videoRef.current;
    const canvas = previewCanvasRef.current;
    if (!video || !canvas) return;
    const id = setInterval(() => {
      if (!video.videoWidth) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      setPreviewTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [expanded, stream]);

  // The actual sync loop: OCR the cropped region, resolve it to a verse,
  // and fire onVerseDetected once a *new* reference reads stable twice in
  // a row. Runs whenever a stream is attached and the user has enabled
  // sync — independent of whether the setup panel is expanded, since the
  // whole point is to keep working unattended through a service.
  useEffect(() => {
    if (!settings.enabled || !stream || !verses || verses.length === 0) return;
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    let running = false;
    const id = setInterval(async () => {
      if (running || cancelled) return;
      running = true;
      try {
        const frame = captureCroppedFrame(video, settings.cropRect);
        if (!frame) return;
        const { recognizeText } = await import("@/lib/ocrEngine");
        const text = await recognizeText(frame);
        const detected = matchDetectedReference(text, verses);
        const fired = detectorRef.current.feed(detected);
        if (fired && !cancelled) {
          const versionName = settings.versionName ?? importedNames[0] ?? "";
          setLastDetection({ reference: fired.reference, at: Date.now() });
          onVerseDetected(fired.reference, fired.text, versionName);
        }
      } finally {
        running = false;
      }
    }, OCR_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [settings.enabled, settings.cropRect, settings.versionName, stream, verses, importedNames, onVerseDetected]);

  // Drag-to-move / drag-to-resize for the crop rectangle, in percentages
  // of the preview container so the same rect maps 1:1 onto the actual
  // capture frame regardless of its native resolution.
  const onRectPointerDown = (mode: "move" | "resize") => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { mode, startX: e.clientX, startY: e.clientY, startRect: settings.cropRect };
    const container = containerRef.current;
    if (!container) return;
    const bounds = container.getBoundingClientRect();

    const onMove = (ev: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dxPct = ((ev.clientX - drag.startX) / bounds.width) * 100;
      const dyPct = ((ev.clientY - drag.startY) / bounds.height) * 100;
      let next = drag.startRect;
      if (drag.mode === "move") {
        next = {
          ...drag.startRect,
          x: Math.min(100 - drag.startRect.w, Math.max(0, drag.startRect.x + dxPct)),
          y: Math.min(100 - drag.startRect.h, Math.max(0, drag.startRect.y + dyPct)),
        };
      } else {
        next = {
          ...drag.startRect,
          w: Math.min(100 - drag.startRect.x, Math.max(5, drag.startRect.w + dxPct)),
          h: Math.min(100 - drag.startRect.y, Math.max(5, drag.startRect.h + dyPct)),
        };
      }
      updateSettings({ cropRect: next });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const canEnable = Boolean(stream && verses && verses.length > 0);
  const previewDataUrl = useMemo(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !canvas.width) return null;
    return canvas.toDataURL();
    // previewTick is the only thing that changes without canvas identity
    // changing, so it has to stay a dependency even though it's unused.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewTick]);

  if (!available) {
    return (
      <div className="rounded-xl border border-white/10 bg-panel p-4">
        <h3 className="mb-1 text-sm font-semibold text-white/80">Synchronisation WorshipTools</h3>
        <p className="text-xs text-white/40">
          Disponible uniquement dans l&apos;application de bureau VerseFlow (pas dans un navigateur).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-panel p-4">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <h3 className="text-sm font-semibold text-white/80">Synchronisation WorshipTools</h3>
        <span className="text-xs text-white/40">{expanded ? "Réduire ▲" : "Configurer ▼"}</span>
      </button>

      <div className="mt-2 flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs text-white/60">
          <input
            type="checkbox"
            checked={settings.enabled}
            disabled={!canEnable}
            onChange={(e) => updateSettings({ enabled: e.target.checked })}
          />
          Projection automatique active
        </label>
        {lastDetection && (
          <span className="text-xs text-white/40">
            Dernier verset : {lastDetection.reference}
          </span>
        )}
      </div>

      {!stream && settings.sourceName && (
        <p className="mt-2 text-xs text-amber-300/80">
          Capture non active pour « {settings.sourceName} ». Cliquez sur « Choisir une fenêtre » pour la reprendre.
        </p>
      )}
      {statusError && <p className="mt-2 text-xs text-red-400">{statusError}</p>}

      {expanded && (
        <div className="mt-3 space-y-3 rounded-lg border border-white/10 bg-ink p-3">
          <p className="text-xs text-white/40">
            Choisissez la fenêtre (ou l&apos;écran) où WorshipTools Presenter projette, puis dessinez un
            rectangle autour de la référence biblique (ex. « Jean 3:16 ») affichée sur la diapositive — le texte
            du verset lui-même n&apos;a pas besoin d&apos;être dans le cadre.
          </p>

          <div>
            <label className="mb-1 block text-xs text-white/50">Version à utiliser pour la correspondance</label>
            <select
              value={settings.versionName ?? importedNames[0] ?? ""}
              onChange={(e) => updateSettings({ versionName: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
            >
              {importedNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={openPicker}
            disabled={loadingSources}
            className="w-full rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80 hover:bg-white/5 disabled:opacity-40"
          >
            {loadingSources ? "Recherche des fenêtres…" : "Choisir une fenêtre ou un écran…"}
          </button>

          {sources && (
            <div className="grid grid-cols-3 gap-2">
              {sources.map((source) => (
                <button
                  key={source.id}
                  onClick={() => chooseSource(source)}
                  className={`rounded-lg border p-1 text-left hover:border-accent ${
                    settings.sourceId === source.id ? "border-accent" : "border-white/10"
                  }`}
                >
                  {source.thumbnailDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={source.thumbnailDataUrl} alt="" className="mb-1 w-full rounded" />
                  )}
                  <span className="block truncate text-[11px] text-white/60">{source.name}</span>
                </button>
              ))}
            </div>
          )}

          <video ref={videoRef} className="hidden" muted playsInline />

          {stream && (
            <div>
              <p className="mb-1 text-xs text-white/50">
                Faites glisser le rectangle pour l&apos;ajuster sur la référence.
              </p>
              <div
                ref={containerRef}
                className="relative aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-black"
              >
                <canvas ref={previewCanvasRef} className="hidden" />
                {previewDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewDataUrl} alt="" className="absolute inset-0 h-full w-full" />
                )}
                <div
                  onPointerDown={onRectPointerDown("move")}
                  className="absolute cursor-move border-2 border-accent2 bg-accent2/10"
                  style={{
                    left: `${settings.cropRect.x}%`,
                    top: `${settings.cropRect.y}%`,
                    width: `${settings.cropRect.w}%`,
                    height: `${settings.cropRect.h}%`,
                  }}
                >
                  <div
                    onPointerDown={onRectPointerDown("resize")}
                    className="absolute bottom-0 right-0 h-3 w-3 cursor-nwse-resize bg-accent2"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
