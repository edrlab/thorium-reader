import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { combineReducers, createStore } from "redux";
import { app, ipcMain } from "electron";
import { screenReaderReducer } from "readium-desktop/common/redux/reducers/screenReader";
import { build as saveOptimization } from "readium-desktop/common/redux/actions/screenReader/save";
import { registerAccessibilitySupport } from "readium-desktop/main/accessibilitySupport";
import { diMainGet, getAllReaderWindowFromDi, getLibraryWindowFromDi } from "readium-desktop/main/di";

jest.mock("electron", () => {
    const { EventEmitter } = jest.requireActual<typeof import("events")>("events");
    return {
        app: Object.assign(new EventEmitter(), {
            accessibilitySupportEnabled: true,
            getAccessibilitySupportFeatures: jest.fn(() => ["screenReader"]),
        }),
        ipcMain: new EventEmitter(),
    };
});
jest.mock("readium-desktop/main/di", () => ({
    diMainGet: jest.fn(),
    getAllReaderWindowFromDi: jest.fn(),
    getLibraryWindowFromDi: jest.fn(),
}));

const makeWindow = () => ({
    isDestroyed: jest.fn(() => false),
    webContents: { isDestroyed: jest.fn(() => false), send: jest.fn() },
});
let unsubscribe: () => void;

beforeEach(() => {
    jest.clearAllMocks();
    app.removeAllListeners();
    ipcMain.removeAllListeners();
    app.accessibilitySupportEnabled = true;
    jest.mocked(app.getAccessibilitySupportFeatures).mockReturnValue(["screenReader"]);
});
afterEach(() => unsubscribe?.());

function setup() {
    const store = createStore(combineReducers({ screenReader: screenReaderReducer }));
    const library = makeWindow();
    const readers = [makeWindow(), makeWindow()];
    jest.mocked(diMainGet).mockReturnValue(store as never);
    jest.mocked(getLibraryWindowFromDi).mockReturnValue(library as never);
    jest.mocked(getAllReaderWindowFromDi).mockReturnValue(readers as never);
    unsubscribe = registerAccessibilitySupport();
    return { store, library, readers };
}

test("enabling optimization refreshes all open Readers without another native accessibility event", () => {
    const { store, library, readers } = setup();
    const event = { sender: readers[0].webContents, returnValue: true };
    ipcMain.emit("accessibility-support-query", event);
    expect(event.returnValue).toBe(false);

    store.dispatch(saveOptimization(true));
    for (const win of [library, ...readers]) {
        expect(win.webContents.send).toHaveBeenCalledWith("accessibility-support-changed", true);
        expect(win.webContents.send).toHaveBeenCalledWith("accessibility-support-changed-raw", true);
        win.webContents.send.mockClear();
    }
    store.dispatch(saveOptimization(false));
    for (const win of [library, ...readers]) {
        expect(win.webContents.send).toHaveBeenCalledWith("accessibility-support-changed", false);
        // Optimization must not change the reported OS detection.
        expect(win.webContents.send).toHaveBeenCalledWith("accessibility-support-changed-raw", true);
        win.webContents.send.mockClear();
    }
    store.dispatch(saveOptimization(false));
    store.dispatch({ type: "UNRELATED" });
    for (const win of [library, ...readers]) expect(win.webContents.send).not.toHaveBeenCalled();
});

test("native start and stop still refresh optimized Readers", () => {
    const { store, readers } = setup();
    app.accessibilitySupportEnabled = false;
    store.dispatch(saveOptimization(true));
    expect(readers[0].webContents.send).toHaveBeenLastCalledWith("accessibility-support-changed-raw", false);
    app.accessibilitySupportEnabled = true;
    app.emit("accessibility-support-changed", {}, true);
    expect(readers[0].webContents.send).toHaveBeenCalledWith("accessibility-support-changed", true);
    app.emit("accessibility-support-changed", {}, false);
    expect(readers[0].webContents.send).toHaveBeenLastCalledWith("accessibility-support-changed-raw", false);
});

test("optimization alone does not invent screen-reader detection", () => {
    const { store, readers } = setup();
    jest.mocked(app.getAccessibilitySupportFeatures).mockReturnValue(["nativeAPIs"]);
    store.dispatch(saveOptimization(true));
    expect(readers[0].webContents.send).toHaveBeenCalledWith("accessibility-support-changed", false);
    const event = { sender: readers[0].webContents, returnValue: true };
    ipcMain.emit("accessibility-support-query-raw", event);
    expect(event.returnValue).toBe(false);
});

test("a closed or failing window does not prevent other Readers from updating", () => {
    const { store, library, readers } = setup();
    library.webContents.send.mockImplementation(() => {
        throw new Error("Window closed");
    });
    readers[0].isDestroyed.mockReturnValue(true);
    store.dispatch(saveOptimization(true));
    expect(readers[0].webContents.send).not.toHaveBeenCalled();
    expect(readers[1].webContents.send).toHaveBeenCalledWith("accessibility-support-changed", true);
});
