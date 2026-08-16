"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Show } from "@/lib/types";
import { fetchLiveState, subscribeLiveState } from "@/lib/liveSync";
import { subscribeElectronLiveState, notifyElectronRenderReady } from "@/lib/electronBridge";
import { loadMediaBlob } from "@/lib/mediaDb";
import { getShow } from "@/lib/store";
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

    // The live window shares localStorage with the studio window (same
    // app origin), so if this show is already saved there, show it right
    // away instead of blanking on "waiting" while the network/IPC push
    // catches up — which never happens at all if, say, the server process
    // was restarted since the studio last pushed. This is a display-only
    // head start: the server push below (SSE/poll/IPC) is still the source
    // of truth for the live slide index and blackout state, and overwrites
    // this the moment it arrives.
    const localShow = getShow(showId);
    if (localShow) setShow(localShow);

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
    // window opens, for instance), keep polling until one succeeds instead
    // of getting stuck on "waiting" forever. Runs on a local server, so a
    // tight interval costs nothing.
    const pollId = window.setInterval(() => {
      if (gotShow) {
        window.clearInterval(pollId);
        return;
      }
      fetchLiveState(showId).then((state) => {
        if (state) applyState(state);
      });
    }, 500);

    return () => {
      mounted = false;
      unsubscribe();
      unsubscribeElectron();
      window.clearInterval(pollId);
    };
  }, [showId]);

  useEffect(() => {
    // Whenever there's actual background media (video or image), the page
    // itself must always be transparent — for video the pixels cover the
    // frame anyway, and for a PNG this is what lets its own alpha channel
    // show through instead of a flat page-level black behind it. Only the
    // "no background at all" case is genuinely togglable, and even then it
    // defaults to transparent, never to opaque, unless explicitly set.
    const hasMedia = !!show && show.background.type !== "none";
    const transparent = hasMedia || (show?.style.transparentBg ?? true);
    document.documentElement.style.backgroundColor = transparent ? "transparent" : "#000";
    document.body.style.backgroundColor = transparent ? "transparent" : "#000";
  }, [show, show?.style.transparentBg, show?.background.type]);

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

  // Signals the render pipeline (a hidden Electron window snapshotting
  // this page to VerseFlowLIVERender.png) that it's safe to capture right
  // now — ProjectionCanvas calls this once its background image (if any)
  // has decoded AND its custom font (if any) has loaded, instead of a
  // fixed delay racing those asset loads. No-ops outside Electron (e.g.
  // OBS's Browser Source just renders the DOM directly, nothing to signal).
  const handleReady = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        notifyElectronRenderReady();
      });
    });
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {show && (
        <ProjectionCanvas
          mediaUrl={mediaUrl}
          background={show.background}
          slide={slide}
          style={show.style}
          blackout={blackout}
          onReady={handleReady}
        />
      )}
    </main>
  );
}
