import { app, dialog, BrowserWindow } from "electron";
import * as path from "path";

// Preprocessing directive
declare var __RENDERER_BASE_URL__: string;

// Global reference to the main window,
// so the garbage collector doesn't close it.
var mainWindow: Electron.BrowserWindow = null;

// Opens the main window, with a native menu bar.
function createWindow() {
    mainWindow = new BrowserWindow({width: 800, height: 600});
    let rendererBaseUrl = __RENDERER_BASE_URL__;

    if (rendererBaseUrl == "file://") {
        // This is a local url
        rendererBaseUrl += path.normalize(path.join(__dirname, "index.html"));
    } else {
        // This is a remote url
        rendererBaseUrl += "index.html";
    }

    mainWindow.loadURL(rendererBaseUrl);
    mainWindow.webContents.openDevTools();

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin')
		app.quit();
});

// Call 'createWindow()' on startup.
app.on("ready", () => {
    createWindow();
});

// On OS X it's common to re-create a window in the app when the dock icon is clicked and there are no other
// windows open.
app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
