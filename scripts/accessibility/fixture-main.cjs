const { app, BrowserWindow, session, protocol } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
app.setPath('userData', path.resolve('dist/accessibility-fixtures/profile'));
app.commandLine.appendSwitch('remote-debugging-port', '9224');
app.commandLine.appendSwitch('remote-allow-origins', '*');
app.whenReady().then(() => {
    protocol.handle('thoriumhttps', () => new Response('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect width="200" height="150" fill="navy"/><circle cx="100" cy="75" r="40" fill="white"/></svg>', { headers: { 'Content-Type': 'image/svg+xml' } }));
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
