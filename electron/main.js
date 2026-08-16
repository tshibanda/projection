const { app, BrowserWindow, Menu, shell, screen, ipcMain } = require("electron");
const path = require("path");
const http = require("http");
const fs = require("fs");

const PORT = 4173;
const LIVE_ASPECT_RATIO = 16 / 9;
// Larger on Windows, where the live window is captured directly (Window
// Capture) rather than via an OBS Browser Source, so its on-screen pixel
// size is what determines OBS output quality there.
const LIVE_WIDTH = process.platform === "win32" ? 1280 : 480;
const LIVE_HEIGHT = Math.round(LIVE_WIDTH / LIVE_ASPECT_RATIO);
const LIVE_MARGIN = 24;
const PRELOAD_PATH = path.join(__dirname, "preload.js");
let mainWindow;
let server;
const liveWindows = new Map();

// Headless render pipeline: instead of (or alongside) an on-screen live
// window, mirror whatever live state is currently pushed into a hidden
// window and snapshot it to a single well-known PNG file, for setups that
// feed OBS an Image Source rather than a Browser/Window Capture. Any
// presentation's pushes land here — there's only ever one output file.
const RENDER_WIDTH = 1920;
const RENDER_HEIGHT = 1080;
// Fallback only: the live page pings "live-render-ready" once its content
// (background image included) has actually finished painting, and that
// triggers an immediate capture — this fixed delay is just a safety net in
// case that signal is ever lost, so a generous value is fine here.
const RENDER_CAPTURE_FALLBACK_MS = 800;
let renderWindow = null;
let renderCaptureTimer = null;
let lastPushedLiveState = null;
let renderOutputPath = null;

// app.getPath must not be called until the app is ready, so this is
// resolved lazily (getRenderWindow/captureRenderWindowNow only ever run
// after app.whenReady()) rather than at module load time.
function getRenderOutputPath() {
  if (!renderOutputPath) {
    renderOutputPath = path.join(app.getPath("desktop"), "VerseFlowLIVERender.png");
  }
  return renderOutputPath;
}

function getRenderWindow() {
  if (renderWindow && !renderWindow.isDestroyed()) return renderWindow;
  renderWindow = new BrowserWindow({
    width: RENDER_WIDTH,
    height: RENDER_HEIGHT,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    paintWhenInitiallyHidden: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: PRELOAD_PATH,
      backgroundThrottling: false,
    },
  });
  // "render" is never a real show id, so this page just sits idle
  // (nothing pushed yet) until the first live-state-push arrives over IPC.
  renderWindow.loadURL(`http://127.0.0.1:${PORT}/live/render`);
  renderWindow.webContents.once("did-finish-load", () => {
    if (lastPushedLiveState) {
      renderWindow.webContents.send("live-state-update", lastPushedLiveState);
      scheduleRenderCaptureFallback();
    }
  });
  return renderWindow;
}

async function captureRenderWindowNow() {
  if (!renderWindow || renderWindow.isDestroyed()) return;
  try {
    const image = await renderWindow.webContents.capturePage();
    fs.writeFileSync(getRenderOutputPath(), image.toPNG());
  } catch (err) {
    console.error("Failed to write VerseFlowLIVERender.png:", err);
  }
}

function scheduleRenderCaptureFallback() {
  if (renderCaptureTimer) clearTimeout(renderCaptureTimer);
  renderCaptureTimer = setTimeout(() => {
    renderCaptureTimer = null;
    captureRenderWindowNow();
  }, RENDER_CAPTURE_FALLBACK_MS);
}

// Relays state pushed by the studio window straight to the matching live
// window's renderer, over IPC — same-process and independent of the
// HTTP/SSE sync (which the live window still uses too, and which OBS's
// Browser Source relies on since it isn't an Electron window at all). Also
// mirrors every push into the hidden render window, regardless of which
// show/live window (if any) it targets, and re-snapshots the PNG output.
ipcMain.on("live-state-push", (_event, { showId, state }) => {
  const win = liveWindows.get(`verseflow-live-${showId}`);
  if (win && !win.isDestroyed()) {
    win.webContents.send("live-state-update", state);
  }
  lastPushedLiveState = state;
  getRenderWindow().webContents.send("live-state-update", state);
  scheduleRenderCaptureFallback();
});

// The live page's own cue that its current frame is actually painted and
// safe to screenshot — supersedes the fallback timer above when it arrives.
ipcMain.on("live-render-ready", (event) => {
  if (!renderWindow || event.sender !== renderWindow.webContents) return;
  if (renderCaptureTimer) {
    clearTimeout(renderCaptureTimer);
    renderCaptureTimer = null;
  }
  captureRenderWindowNow();
});

function getAppDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "app")
    : path.join(__dirname, "..");
}

async function startServer() {
  const dir = getAppDir();
  const next = require(path.join(dir, "node_modules", "next"));
  const nextApp = next({ dev: false, dir });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  server = http.createServer((req, res) => handle(req, res));
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(PORT, "127.0.0.1", resolve);
  });
}

function isLiveFrame(frameName) {
  return Boolean(frameName) && frameName.startsWith("verseflow-live-");
}

function attachLiveWindowHandling(contents) {
  contents.setWindowOpenHandler(({ url, frameName }) => {
    if (!url.startsWith(`http://127.0.0.1:${PORT}`)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    const existing = liveWindows.get(frameName);
    if (existing && !existing.isDestroyed()) {
      existing.focus();
      return { action: "deny" };
    }
    if (isLiveFrame(frameName)) {
      const { workArea } = screen.getPrimaryDisplay();
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          title: "VerseFlow LIVE",
          width: LIVE_WIDTH,
          height: LIVE_HEIGHT,
          x: workArea.x + LIVE_MARGIN,
          y: workArea.y + workArea.height - LIVE_HEIGHT - LIVE_MARGIN,
          frame: false,
          transparent: true,
          backgroundColor: "#00000000",
          hasShadow: false,
          alwaysOnTop: false,
          fullscreenable: true,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: PRELOAD_PATH,
          },
        },
      };
    }
    return { action: "allow" };
  });

  contents.on("did-create-window", (childWindow, details) => {
    if (details.frameName) {
      liveWindows.set(details.frameName, childWindow);
      childWindow.on("closed", () => liveWindows.delete(details.frameName));
    }
    if (isLiveFrame(details.frameName)) {
      childWindow.setAspectRatio(LIVE_ASPECT_RATIO);
      // Frameless windows have no menu/title bar, so the OS close shortcut
      // still needs to be wired up manually.
      childWindow.webContents.on("before-input-event", (event, input) => {
        const closeCombo =
          input.type === "keyDown" &&
          input.key.toLowerCase() === "w" &&
          (input.meta || input.control);
        if (closeCombo) {
          event.preventDefault();
          childWindow.close();
        }
      });
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    title: "VerseFlow",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: PRELOAD_PATH,
    },
  });
  attachLiveWindowHandling(mainWindow.webContents);
  mainWindow.loadURL(`http://127.0.0.1:${PORT}/studio`);
  mainWindow.on("closed", () => {
    // The hidden render window is a real BrowserWindow, so without this it
    // would keep counting toward "window-all-closed" forever and the app
    // would never quit on Windows/Linux after the user closes the main one.
    if (renderWindow && !renderWindow.isDestroyed()) {
      renderWindow.destroy();
    }
  });
}

Menu.setApplicationMenu(null);

app.whenReady().then(async () => {
  try {
    await startServer();
    createWindow();
  } catch (err) {
    console.error("Failed to start the VerseFlow server:", err);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (server) server.close();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
