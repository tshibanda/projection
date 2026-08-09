"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Show } from "@/lib/types";
import { fetchLiveState, subscribeLiveState } from "@/lib/liveSync";
import { subscribeElectronLiveState } from "@/lib/electronBridge";
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
    let gotShow = false;

    const applyState = (state: { show: Show | null; slideIndex: number; blackout: boolean }) => {
      if (!mounted) return;
      if (state.show) {
        gotShow = true;
        setShow(state.show);
      }
      setSlideIndex(state.slideIndex);
      setBlackout(state.blackout);
    };

    fetchLiveState(showId).then((state) => {
      if (state) applyState(state);
    });

    const unsubscribe = subscribeLiveState(showId, applyState);

    // In the desktop app, also listen on the direct IPC relay from the
    // studio window — same-process, so it isn't affected by whatever
    // might be interrupting the HTTP/SSE path. The payload here mirrors
    // what the studio pushes: a partial {show?, slideIndex?, blackout?}.
    const unsubscribeElectron = subscribeElectronLiveState((raw) => {
      const patch = raw as { show?: Show; slideIndex?: number; blackout?: boolean };
      if (!mounted) return;
      if (patch.show) {
        gotShow = true;
        setShow(patch.show);
      }
      if (typeof patch.slideIndex === "number") setSlideIndex(patch.slideIndex);
      if (typeof patch.blackout === "boolean") setBlackout(patch.blackout);
    });

    // Belt-and-suspenders: if the initial fetch and the SSE stream both
    // miss the studio's state (a dropped connection right after the live
    // window opens, for instance), keep polling until one succeeds
    // instead of getting stuck on "waiting" forever.
    const pollId = window.setInterval(() => {
      if (gotShow) {
        window.clearInterval(pollId);
        return;
      }
      fetchLiveState(showId).then((state) => {
        if (state) applyState(state);
      });
    }, 2000);

    return () => {
      mounted = false;
      unsubscribe();
      unsubscribeElectron();
      window.clearInterval(pollId);
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
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-black text-sm text-white/30">
            <span>En attente de connexion au studio…</span>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5"
            >
              Réessayer
            </button>
          </div>
        )
      )}
    </main>
  );
}
