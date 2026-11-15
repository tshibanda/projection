const { contextBridge, ipcRenderer } = require("electron");

// Direct main-process relay between the studio window and a live window,
// used alongside (not instead of) the HTTP/SSE sync so the in-app live
// window doesn't depend solely on a network round trip to itself.
contextBridge.exposeInMainWorld("verseflowElectron", {
  sendLiveState: (showId, state) => ipcRenderer.send("live-state-push", { showId, state }),
  onLiveState: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on("live-state-update", handler);
    return () => ipcRenderer.removeListener("live-state-update", handler);
  },
  // Sent by the live page once its current slide has actually finished
  // painting (background image decoded, etc.) — the render pipeline's cue
  // that a screenshot right now won't catch a half-loaded frame.
  notifyRenderReady: () => ipcRenderer.send("live-render-ready"),

  // WorshipToolsSync's own capture-source picker: list windows/screens
  // with thumbnails, then record which one was chosen so the next
  // getDisplayMedia() call (a plain web API, called directly from the
  // renderer) resolves to that exact source instead of popping a picker.
  listCaptureSources: () => ipcRenderer.invoke("capture-list-sources"),
  setSelectedCaptureSource: (id) => ipcRenderer.invoke("capture-set-selected-source", id),
});
