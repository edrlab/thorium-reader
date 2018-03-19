import { BrowserWindow } from "electron";
import { injectable } from "inversify";
import * as uuid from "uuid";

export interface WinDictionary {
    [winId: string]: BrowserWindow;
}

@injectable()
export class WinRegistry {
    private windows: WinDictionary;

    constructor() {
        // No windows are registered
        this.windows = {};
    }

    /**
     * Register new electron browser window
     *
     * @param win Electron BrowserWindows
     * @return Id of registered window
     */
    public registerWindow(win: BrowserWindow): string {
        const winId = uuid.v4();
        this.windows[winId] = win;
        return winId;
    }

    /**
     * Unregister electron browser window
     *
     * @param winId Id of registered window
     */
    public unregisterWindow(winId: string) {
        if (this.windows.hasOwnProperty(winId)) {
            // Window not found
            return;
        }

        delete this.windows[winId];
    }

    /** Returns all registered windows */
    public getWindows() {
        return this.windows;
    }
}
