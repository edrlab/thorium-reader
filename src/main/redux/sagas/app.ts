// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app, protocol } from "electron";
import * as path from "path";
import { LocaleConfigIdentifier, LocaleConfigValueType } from "readium-desktop/common/config";
import { i18nActions } from "readium-desktop/common/redux/actions";
import { callTyped } from "readium-desktop/common/redux/typed-saga";
import { AvailableLanguages } from "readium-desktop/common/services/translator";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { diMainGet } from "readium-desktop/main/di";
import { appActions, winActions } from "readium-desktop/main/redux/actions";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";
import { eventChannel } from "redux-saga";
import { all, call, put, take } from "redux-saga/effects";

// Logger
const debug = debug_("readium-desktop:main:saga:app");

const defaultLocale = () => {
    const loc = app.getLocale().split("-")[0];
    const langCodes = ObjectKeys(AvailableLanguages);
    const lang = langCodes.find((l) => l === loc) || "en";

    return lang;
};

function* mainApp() {

    app.setAppUserModelId("io.github.edrlab.thorium");

    app.on("window-all-closed", async () => {
        // At the moment, there are no menu items to revive / re-open windows,
        // so let's terminate the app on MacOS too.
        // if (process.platform !== "darwin") {
        //     app.quit();
        // }

        setTimeout(() => app.exit(0), 2000);
    });

    app.on("accessibility-support-changed", (_ev, accessibilitySupportEnabled) => {
        debug(`accessibilitySupportEnabled: ${accessibilitySupportEnabled}`);
    });

    yield call(() => app.whenReady());

    debug("Main app ready");

    try {

        const configRepository: ConfigRepository<LocaleConfigValueType> = diMainGet("config-repository");
        const i18nLocale = yield* callTyped(() => configRepository.get(LocaleConfigIdentifier));

        if (i18nLocale && i18nLocale.value && i18nLocale.value.locale) {
            put(i18nActions.setLocale.build(i18nLocale.value.locale));
        } else {
            put(i18nActions.setLocale.build(defaultLocale()));
        }
    } catch {
        put(i18nActions.setLocale.build(defaultLocale()));
    }

    // register file protocol to link locale file to renderer
    protocol.registerFileProtocol("store",
        (request, callback) => {

            // Extract publication item relative url
            const relativeUrl = request.url.substr(6);
            const pubStorage = diMainGet("publication-storage");
            const filePath: string = path.join(pubStorage.getRootPath(), relativeUrl);
            callback(filePath);
        },
    );

}

function* appInitWatcher() {
    yield take(appActions.initRequest.ID);

    yield call(mainApp);

    yield put(appActions.initSuccess.build());

    yield put(winActions.library.openRequest.build());
}

// On OS X it's common to re-create a window in the app when the dock icon is clicked and there are no other
// windows open.
export function* appActivate() {

    const appActivateChannel = eventChannel<void>(
        (emit) => {

            const handler = () => emit();
            app.on("activate", handler);

            return () => {
                app.removeListener("activate", handler);
            };
        },
    );

    yield take(appActivateChannel);

    yield put(winActions.library.openRequest.build());
}

export function* watchers() {
    yield all([
        call(appInitWatcher),
    ]);
}
