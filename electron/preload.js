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
});
