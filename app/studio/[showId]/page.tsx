"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { BackgroundSource, Point, Show, Slide } from "@/lib/types";
import { getShow, newSlide, saveShow } from "@/lib/store";
import { loadMediaBlob, removeMediaBlob, storeMediaBlob } from "@/lib/mediaDb";
import { pushLiveState } from "@/lib/liveSync";
import ProjectionCanvas from "@/components/ProjectionCanvas";
import SlideList from "@/components/SlideList";
import VerseSearch from "@/components/VerseSearch";
import StylePanel from "@/components/StylePanel";
import BackgroundPicker from "@/components/BackgroundPicker";

export default function StudioShowPage() {
  const params = useParams<{ showId: string }>();
  const showId = params.showId;

  const [show, setShow] = useState<Show | null | undefined>(undefined);
  const [activeIndex, setActiveIndex] = useState(0);
  const [blackout, setBlackout] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState(0);
  const [dragStyle, setDragStyle] = useState<Partial<Show["style"]> | null>(null);

  useEffect(() => {
    setShow(getShow(showId) ?? null);
  }, [showId]);

  const persist = useCallback((next: Show) => {
    saveShow(next);
    setShow({ ...next });
    setSavedTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function loadMedia() {
      if (!show) return;
      if (show.background.type === "videoFile" || show.background.type === "imageFile") {
        const blob = await loadMediaBlob(show.id);
        if (blob && !cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setMediaUrl(objectUrl);
        } else if (!cancelled) {
          setMediaUrl(null);
        }
      } else if (show.background.type === "videoUrl" || show.background.type === "imageUrl") {
        setMediaUrl(show.background.url);
      } else {
        setMediaUrl(null);
      }
    }
    loadMedia();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [show?.id, show?.background]);

  useEffect(() => {
    if (!show) return;
    pushLiveState(show.id, { show, slideIndex: activeIndex, blackout });
  }, [show, activeIndex, blackout]);

  const activeSlide = useMemo(
    () => (show && show.slides[activeIndex]) ?? null,
    [show, activeIndex]
  );

  const liveWindowRef = useRef<Window | null>(null);

  const openLiveWindow = useCallback(() => {
    if (!show) return;
    if (!liveWindowRef.current || liveWindowRef.current.closed) {
      liveWindowRef.current = window.open(
        `/live/${show.id}`,
        `verseflow-live-${show.id}`,
        "noopener"
      );
    }
  }, [show]);

  const goTo = useCallback(
    (index: number) => {
      if (!show) return;
      const clamped = Math.max(0, Math.min(index, show.slides.length - 1));
      setActiveIndex(clamped);
      setBlackout(false);
      // Push before opening: a brand-new live window's first fetch would
      // otherwise race the state update and briefly show the old slide.
      pushLiveState(show.id, { show, slideIndex: clamped, blackout: false });
      openLiveWindow();
    },
    [show, openLiveWindow]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goTo(activeIndex + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(activeIndex - 1);
      } else if (e.key === "Escape" || e.key.toLowerCase() === "b") {
        setBlackout((b) => !b);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, goTo]);

  if (show === undefined) {
    return <main className="flex min-h-screen items-center justify-center text-white/40">Chargement…</main>;
  }
  if (show === null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-white/60">
        <p>Présentation introuvable.</p>
        <Link href="/studio" className="text-accent2 hover:underline">Retour au studio</Link>
      </main>
    );
  }

  const addSlides = (items: { reference: string; text: string; version: string }[]) => {
    const newSlides = items.map((it) => newSlide(it.reference, it.text, it.version));
    persist({ ...show, slides: [...show.slides, ...newSlides] });
  };

  const addSlide = (reference: string, text: string, version: string) => {
    addSlides([{ reference, text, version }]);
  };

  const editSlide = (id: string, patch: Partial<Pick<Slide, "reference" | "text" | "version">>) => {
    const next = {
      ...show,
      slides: show.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    };
    persist(next);
  };

  const removeSlide = (id: string) => {
    const idx = show.slides.findIndex((s) => s.id === id);
    const next = { ...show, slides: show.slides.filter((s) => s.id !== id) };
    persist(next);
    if (idx <= activeIndex) setActiveIndex((i) => Math.max(0, i - (idx === activeIndex ? 0 : 1)));
  };

  const moveSlide = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= show.slides.length) return;
    const slides = [...show.slides];
    [slides[index], slides[target]] = [slides[target], slides[index]];
    persist({ ...show, slides });
    if (activeIndex === index) setActiveIndex(target);
    else if (activeIndex === target) setActiveIndex(index);
  };

  const setBackground = (background: BackgroundSource) => persist({ ...show, background });

  const handleVideoFile = async (file: File) => {
    await storeMediaBlob(show.id, file);
    setBackground({ type: "videoFile", name: file.name });
  };

  const handleVideoUrl = async (url: string) => {
    await removeMediaBlob(show.id);
    setBackground({ type: "videoUrl", url });
  };

  const handleImageFile = async (file: File) => {
    await storeMediaBlob(show.id, file);
    setBackground({ type: "imageFile", name: file.name });
  };

  const handleImageUrl = async (url: string) => {
    await removeMediaBlob(show.id);
    setBackground({ type: "imageUrl", url });
  };

  const handleClearBackground = async () => {
    await removeMediaBlob(show.id);
    setBackground({ type: "none" });
  };

  return (
    <main className="min-h-screen bg-ink px-6 py-6">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/studio" className="text-white/40 hover:text-white">←</Link>
            <input
              value={show.title}
              onChange={(e) => persist({ ...show, title: e.target.value })}
              className="rounded-lg border border-transparent bg-transparent px-2 py-1 text-lg font-semibold outline-none hover:border-white/10 focus:border-accent focus:bg-panel"
            />
            <span className="text-xs text-white/30">
              {savedTick > 0 ? "Enregistré" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBlackout((b) => !b)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                blackout
                  ? "border-red-400/50 bg-red-500/20 text-red-300"
                  : "border-white/15 text-white/70 hover:bg-white/5"
              }`}
            >
              {blackout ? "Écran noir actif" : "Passer à l'écran noir"}
            </button>
            <button
              onClick={openLiveWindow}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90"
            >
              Ouvrir le Live ↗
            </button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          <section className="col-span-12 lg:col-span-3">
            <h2 className="mb-2 text-sm font-semibold text-white/60">Déroulé ({show.slides.length})</h2>
            <SlideList
              slides={show.slides}
              activeIndex={activeIndex}
              onSelect={goTo}
              onRemove={removeSlide}
              onMove={moveSlide}
              onEdit={editSlide}
            />
          </section>

          <section className="col-span-12 lg:col-span-6">
            <h2 className="mb-2 text-sm font-semibold text-white/60">Aperçu</h2>
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl">
              <ProjectionCanvas
                mediaUrl={mediaUrl}
                background={show.background}
                slide={activeSlide}
                style={dragStyle ? { ...show.style, ...dragStyle } : show.style}
                blackout={blackout}
                editable
                onMoveVerse={(p: Point) => setDragStyle((prev) => ({ ...prev, versePos: p }))}
                onMoveReference={(p: Point) => setDragStyle((prev) => ({ ...prev, referencePos: p }))}
                onVerseDragEnd={(p: Point) => {
                  setDragStyle(null);
                  persist({ ...show, style: { ...show.style, versePos: p } });
                }}
                onReferenceDragEnd={(p: Point) => {
                  setDragStyle(null);
                  persist({ ...show, style: { ...show.style, referencePos: p } });
                }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => goTo(activeIndex - 1)}
                disabled={activeIndex <= 0}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5 disabled:opacity-30"
              >
                ← Précédent
              </button>
              <p className="text-xs text-white/30">
                Flèches ← → pour naviguer · Échap / B pour l&apos;écran noir
              </p>
              <button
                onClick={() => goTo(activeIndex + 1)}
                disabled={activeIndex >= show.slides.length - 1}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5 disabled:opacity-30"
              >
                Suivant →
              </button>
            </div>

            <div className="mt-6">
              <VerseSearch onAdd={addSlide} onAddMany={addSlides} />
            </div>
          </section>

          <section className="col-span-12 space-y-6 lg:col-span-3">
            <BackgroundPicker
              background={show.background}
              onVideoFile={handleVideoFile}
              onVideoUrl={handleVideoUrl}
              onImageFile={handleImageFile}
              onImageUrl={handleImageUrl}
              onClear={handleClearBackground}
            />
            <StylePanel
              style={show.style}
              onChange={(patch) => persist({ ...show, style: { ...show.style, ...patch } })}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
