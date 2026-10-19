const { app, BrowserWindow, session } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
app.setPath('userData', path.resolve('dist/accessibility-fixtures/profile'));
app.commandLine.appendSwitch('remote-debugging-port', '9224');
app.commandLine.appendSwitch('remote-allow-origins', '*');
app.whenReady().then(() => {
    session.defaultSession.webRequest.onBeforeRequest((details, done) => {
        // Fixture inputs and assets only: no live catalog, lending, or authentication services.
        done({ cancel: /^https?:/.test(details.url) && !/^http:\/\/127\.0\.0\.1:9224\//.test(details.url) });
    });
    for (const runtime of ['library', 'reader']) {
        const out = path.resolve('dist/accessibility-fixtures');
        fs.writeFileSync(path.join(out, `${runtime}.html`), `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Thorium ${runtime} component audit fixture</title></head><body><div id="audit-root"></div><script src="${runtime}.js"></script></body></html>`);
        const win = new BrowserWindow({ width: 1200, height: 900, show: true, webPreferences: { nodeIntegration: true, contextIsolation: false, sandbox: false, backgroundThrottling: false } });
        win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
        win.loadFile(path.join(out, `${runtime}.html`));
    }
});
app.on('window-all-closed', () => app.quit());
