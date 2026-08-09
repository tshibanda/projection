"use client";

interface VerseflowElectronBridge {
  sendLiveState: (showId: string, state: unknown) => void;
  onLiveState: (callback: (state: unknown) => void) => () => void;
}

declare global {
  interface Window {
    verseflowElectron?: VerseflowElectronBridge;
  }
}

export function sendLiveStateToElectron(showId: string, state: unknown): void {
  if (typeof window !== "undefined") {
    window.verseflowElectron?.sendLiveState(showId, state);
  }
}

export function subscribeElectronLiveState(callback: (state: unknown) => void): () => void {
  if (typeof window === "undefined" || !window.verseflowElectron) return () => {};
  return window.verseflowElectron.onLiveState(callback);
}
