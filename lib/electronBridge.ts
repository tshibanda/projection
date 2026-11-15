"use client";

export interface CaptureSource {
  id: string;
  name: string;
  thumbnailDataUrl: string | null;
}

interface VerseflowElectronBridge {
  sendLiveState: (showId: string, state: unknown) => void;
  onLiveState: (callback: (state: unknown) => void) => () => void;
  notifyRenderReady: () => void;
  listCaptureSources: () => Promise<CaptureSource[]>;
  setSelectedCaptureSource: (id: string) => Promise<void>;
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

export function notifyElectronRenderReady(): void {
  if (typeof window !== "undefined") {
    window.verseflowElectron?.notifyRenderReady();
  }
}

// Whether the screen/window-capture bridge (and therefore WorshipToolsSync)
// is available at all — false in a plain browser tab, true only inside the
// actual Electron app.
export function isCaptureAvailable(): boolean {
  return typeof window !== "undefined" && Boolean(window.verseflowElectron?.listCaptureSources);
}

export function listElectronCaptureSources(): Promise<CaptureSource[]> {
  if (typeof window === "undefined" || !window.verseflowElectron) return Promise.resolve([]);
  return window.verseflowElectron.listCaptureSources();
}

export function setElectronCaptureSource(id: string): Promise<void> {
  if (typeof window === "undefined" || !window.verseflowElectron) return Promise.resolve();
  return window.verseflowElectron.setSelectedCaptureSource(id);
}
