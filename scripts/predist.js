// Prepares a platform-native, production-only node_modules for
// electron-builder to bundle (see package.json's build.mac/win
// extraResources). Written in plain Node.js instead of shell commands
// (rm -rf, mkdir -p, cp) so it runs the same on Windows, macOS, and Linux.
// npm resolves optional platform-specific packages (like @next/swc-*)
// against the host it runs on, so this must run natively on the target OS.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const target = process.argv[2];
if (target !== "mac" && target !== "win") {
  console.error("Usage: node scripts/predist.js <mac|win>");
  process.exit(1);
}

const root = path.join(__dirname, "..");
const deployDir = path.join(root, `.deploy-${target}`);

fs.rmSync(deployDir, { recursive: true, force: true });
fs.mkdirSync(deployDir, { recursive: true });
fs.copyFileSync(path.join(root, "package.json"), path.join(deployDir, "package.json"));
fs.copyFileSync(path.join(root, "package-lock.json"), path.join(deployDir, "package-lock.json"));

execSync("npm install --omit=dev --no-audit --no-fund", { cwd: deployDir, stdio: "inherit" });
