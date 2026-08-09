const { app, BrowserWindow, Menu, shell, screen } = require("electron");
const path = require("path");
const http = require("http");

const PORT = 4173;
const LIVE_ASPECT_RATIO = 16 / 9;
const LIVE_WIDTH = 480;
const LIVE_HEIGHT = Math.round(LIVE_WIDTH / LIVE_ASPECT_RATIO);
const LIVE_MARGIN = 24;
let mainWindow;
let server;
const liveWindows = new Map();

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
