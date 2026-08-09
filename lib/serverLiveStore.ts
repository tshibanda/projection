import { ServerLiveState } from "./types";

// In-memory pub/sub, scoped to this Node process. Sufficient for the
// self-hosted, single-instance usage this app targets (a laptop running
// `next start` during a live service, with OBS pointed at /live/[showId]).
// It intentionally does not persist across process restarts or scale
// across multiple server instances.

type Listener = (state: ServerLiveState) => void;

const states = new Map<string, ServerLiveState>();
const listeners = new Map<string, Set<Listener>>();

function emptyState(): ServerLiveState {
  return { show: null, slideIndex: 0, blackout: false, updatedAt: 0 };
}

export function getServerState(showId: string): ServerLiveState {
  return states.get(showId) ?? emptyState();
}

export function setServerState(
  showId: string,
  patch: Partial<Omit<ServerLiveState, "updatedAt">>
): ServerLiveState {
  const current = getServerState(showId);
  const next: ServerLiveState = { ...current, ...patch, updatedAt: Date.now() };
  states.set(showId, next);
  listeners.get(showId)?.forEach((fn) => fn(next));
  return next;
}

export function subscribeServerState(showId: string, fn: Listener): () => void {
  if (!listeners.has(showId)) listeners.set(showId, new Set());
  listeners.get(showId)!.add(fn);
  return () => {
    listeners.get(showId)?.delete(fn);
  };
}
