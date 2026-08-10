"use client";

import { Show, ServerLiveState } from "./types";
import { sendLiveStateToElectron } from "./electronBridge";

export async function pushLiveState(
  showId: string,
  patch: { show?: Show; slideIndex?: number; blackout?: boolean }
): Promise<void> {
  // In the desktop app, also relay over IPC — same-process and
  // independent of this HTTP round trip, so the in-app live window isn't
  // solely reliant on the network stack reaching itself. No-ops outside
  // Electron (e.g. a plain browser tab, or OBS's Browser Source).
  sendLiveStateToElectron(showId, patch);
  try {
    await fetch(`/api/shows/${showId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
      keepalive: true,
    });
  } catch {
    // Best-effort: if the network call fails, the live window simply
    // won't see this update until the next successful push.
  }
}

export async function fetchLiveState(showId: string): Promise<ServerLiveState | null> {
  try {
    const res = await fetch(`/api/shows/${showId}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as ServerLiveState;
  } catch {
    return null;
  }
}

export function subscribeLiveState(
  showId: string,
  onState: (state: ServerLiveState) => void
): () => void {
  const es = new EventSource(`/api/shows/${showId}/stream`);
  es.onmessage = (ev) => {
    try {
      onState(JSON.parse(ev.data) as ServerLiveState);
    } catch {
      // ignore malformed/heartbeat frames
    }
  };
  return () => es.close();
}
