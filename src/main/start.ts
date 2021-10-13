import { tryCatch } from "readium-desktop/utils/tryCatch";
import { diMainGet, createStoreFromDi } from "./di";

import * as debug_ from "debug";
import { flushSession } from "./tools/flushSession";
import { appActions } from "./redux/actions";
import { app, dialog } from "electron";

// Logger
const debug = debug_("readium-desktop:main/start");

export const start = async (flushSessionBool = false) => {

    let store = await tryCatch(() => diMainGet("store"), "Store not init");
    if (store) {
        return store;
    }

    store = await createStoreFromDi();
    debug("store loaded");

    try {

        if (flushSessionBool) await flushSession();

        store.dispatch(appActions.initRequest.build());
        debug("STORE MOUNTED -> MOUNTING THE APP NOW");

    } catch (err) {
        const message = `REDUX STATE MANAGER CAN'T BE INITIALIZED, ERROR: ${JSON.stringify(err)} \n\nYou should remove your 'AppData' folder\nThorium Exit code 1`;
        process.stderr.write(message);

        dialog.showErrorBox("THORIUM ERROR", message);

        app.exit(1);
    }

    return store;
};
