"use client";

// Thin wrapper around tesseract.js, configured to load its worker, WASM
// core and French language data from files bundled with the app (public/
// tesseract/) instead of a CDN — the capture/OCR loop has to keep working
// at a live service with no internet, and shouldn't depend on a network
// fetch succeeding on first use either way.
//
// Only ever imported dynamically (`await import("@/lib/ocrEngine")`) from
// a client-side effect, never at module-eval time: creating the worker
// spins up a real Web Worker, which doesn't exist during Next's
// build/SSR pass.

let workerPromise: Promise<import("tesseract.js").Worker> | null = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker, OEM, PSM } = await import("tesseract.js");
      const worker = await createWorker("fra", OEM.LSTM_ONLY, {
        workerPath: "/tesseract/worker.min.js",
        corePath: "/tesseract/",
        langPath: "/tesseract/",
        gzip: true,
      });
      // The capture crop is meant to contain just the reference ("Jean
      // 3:16"), i.e. one short line — telling Tesseract that up front
      // measurably improves both speed and accuracy over general-purpose
      // page segmentation.
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE });
      return worker;
    })();
  }
  return workerPromise;
}

// Recognizes text from a canvas (the cropped capture region). Returns ""
// rather than throwing on a transient OCR failure, since the caller polls
// repeatedly anyway and a single bad read should never surface as an
// error to the user.
export async function recognizeText(source: HTMLCanvasElement): Promise<string> {
  try {
    const worker = await getWorker();
    const { data } = await worker.recognize(source);
    return data.text ?? "";
  } catch (err) {
    console.error("OCR read failed:", err);
    return "";
  }
}

export async function terminateOcrEngine(): Promise<void> {
  if (!workerPromise) return;
  const pending = workerPromise;
  workerPromise = null;
  try {
    const worker = await pending;
    await worker.terminate();
  } catch {
    // Already gone or never finished loading — nothing to clean up.
  }
}
