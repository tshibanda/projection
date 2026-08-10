const { app, BrowserWindow, Menu, shell, screen, ipcMain } = require("electron");
const path = require("path");
const http = require("http");

const PORT = 4173;
const LIVE_ASPECT_RATIO = 16 / 9;
// Sized relative to the screen's work area (like vw/vh) instead of a fixed
// pixel width, so the preview stays proportionate across resolutions.
// Clamped so it stays legible on small screens and doesn't get oversized
// on very large ones (mirrors a CSS clamp()).
const LIVE_WIDTH_RATIO = 0.15;
const LIVE_MIN_WIDTH = 220;
const LIVE_MAX_WIDTH = 380;
const LIVE_MARGIN = 24;
const PRELOAD_PATH = path.join(__dirname, "preload.js");
let mainWindow;
let server;
const liveWindows = new Map();

// Relays state pushed by the studio window straight to the matching live
// window's renderer, over IPC — same-process and independent of the
// HTTP/SSE sync (which the live window still uses too, and which OBS's
// Browser Source relies on since it isn't an Electron window at all).
ipcMain.on("live-state-push", (_event, { showId, state }) => {
  const win = liveWindows.get(`verseflow-live-${showId}`);
  if (win && !win.isDestroyed()) {
    win.webContents.send("live-state-update", state);
  }
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
      const liveWidth = Math.round(
        Math.min(LIVE_MAX_WIDTH, Math.max(LIVE_MIN_WIDTH, workArea.width * LIVE_WIDTH_RATIO))
      );
      const liveHeight = Math.round(liveWidth / LIVE_ASPECT_RATIO);
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          title: "VerseFlow LIVE",
          width: liveWidth,
          height: liveHeight,
          x: workArea.x + LIVE_MARGIN,
          y: workArea.y + workArea.height - liveHeight - LIVE_MARGIN,
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
