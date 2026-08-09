"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Show } from "@/lib/types";
import { fetchLiveState, subscribeLiveState } from "@/lib/liveSync";
import { loadMediaBlob } from "@/lib/mediaDb";
import ProjectionCanvas from "@/components/ProjectionCanvas";

export default function LivePage() {
  const params = useParams<{ showId: string }>();
  const showId = params.showId;

  const [show, setShow] = useState<Show | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [blackout, setBlackout] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchLiveState(showId).then((state) => {
      if (!mounted || !state) return;
      if (state.show) setShow(state.show);
      setSlideIndex(state.slideIndex);
      setBlackout(state.blackout);
    });
    const unsubscribe = subscribeLiveState(showId, (state) => {
      if (state.show) setShow(state.show);
      setSlideIndex(state.slideIndex);
      setBlackout(state.blackout);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [showId]);

  useEffect(() => {
    const transparent = show?.style.transparentBg ?? false;
    document.documentElement.style.backgroundColor = transparent ? "transparent" : "#000";
    document.body.style.backgroundColor = transparent ? "transparent" : "#000";
  }, [show?.style.transparentBg]);

  useEffect(() => {
    document.title = "VerseFlow LIVE";
  }, []);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function loadMedia() {
      if (!show) {
        setMediaUrl(null);
        return;
      }
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
  }, [show]);

  const slide = show?.slides[slideIndex] ?? null;
  const transparent = show?.style.transparentBg ?? false;

  return (
    <main className="group relative h-screen w-screen overflow-hidden">
      <button
        onClick={() => window.close()}
        title="Quitter le mode live"
        className="absolute right-3 top-3 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition-opacity duration-150 hover:bg-black/80 group-hover:opacity-100"
      >
        ✕
      </button>
      {show ? (
        <ProjectionCanvas
          mediaUrl={mediaUrl}
          background={show.background}
          slide={slide}
          style={show.style}
          blackout={blackout}
        />
      ) : (
        !transparent && (
          <div className="flex h-full items-center justify-center bg-black text-sm text-white/30">
            En attente de connexion au studio…
          </div>
        )
      )}
    </main>
  );
}
