const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");
const http = require("http");

const PORT = 4173;
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
    return { action: "allow" };
  });

  contents.on("did-create-window", (childWindow, details) => {
    if (details.frameName) {
      liveWindows.set(details.frameName, childWindow);
      childWindow.on("closed", () => liveWindows.delete(details.frameName));
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
