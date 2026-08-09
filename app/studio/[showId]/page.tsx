"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Show, VideoSource } from "@/lib/types";
import { getShow, newSlide, saveShow } from "@/lib/store";
import { loadVideoBlob, removeVideoBlob, storeVideoBlob } from "@/lib/videoDb";
import { pushLiveState } from "@/lib/liveSync";
import ProjectionCanvas from "@/components/ProjectionCanvas";
import SlideList from "@/components/SlideList";
import VerseSearch from "@/components/VerseSearch";
import StylePanel from "@/components/StylePanel";
import VideoPicker from "@/components/VideoPicker";

export default function StudioShowPage() {
  const params = useParams<{ showId: string }>();
  const showId = params.showId;

  const [show, setShow] = useState<Show | null | undefined>(undefined);
  const [activeIndex, setActiveIndex] = useState(0);
  const [blackout, setBlackout] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState(0);

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

    async function loadVideo() {
      if (!show) return;
      if (show.video.type === "file") {
        const blob = await loadVideoBlob(show.id);
        if (blob && !cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setVideoUrl(objectUrl);
        } else if (!cancelled) {
          setVideoUrl(null);
        }
      } else if (show.video.type === "url") {
        setVideoUrl(show.video.url);
      } else {
        setVideoUrl(null);
      }
    }
    loadVideo();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [show?.id, show?.video]);

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

  const addSlide = (reference: string, text: string) => {
    const next = { ...show, slides: [...show.slides, newSlide(reference, text)] };
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

  const setVideo = (video: VideoSource) => persist({ ...show, video });

  const handleFile = async (file: File) => {
    await storeVideoBlob(show.id, file);
    setVideo({ type: "file", name: file.name });
  };

  const handleUrl = async (url: string) => {
    await removeVideoBlob(show.id);
    setVideo({ type: "url", url });
  };

  const handleClearVideo = async () => {
    await removeVideoBlob(show.id);
    setVideo({ type: "none" });
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
            />
          </section>

          <section className="col-span-12 lg:col-span-6">
            <h2 className="mb-2 text-sm font-semibold text-white/60">Aperçu</h2>
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl">
              <ProjectionCanvas
                videoUrl={videoUrl}
                video={show.video}
                slide={activeSlide}
                style={show.style}
                blackout={blackout}
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
              <VerseSearch onAdd={addSlide} />
            </div>
          </section>

          <section className="col-span-12 space-y-6 lg:col-span-3">
            <VideoPicker
              video={show.video}
              onFile={handleFile}
              onUrl={handleUrl}
              onClear={handleClearVideo}
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
