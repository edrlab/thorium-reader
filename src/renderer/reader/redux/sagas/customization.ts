// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { call as callTyped, select as selectTyped, put as putTyped, /*take as takeTyped, race as raceTyped, delay,*/ SagaGenerator, all as allTyped } from "typed-redux-saga/macro";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { customizationActions } from "readium-desktop/common/redux/actions";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { ICustomizationManifest, ICustomizationManifestColor } from "readium-desktop/common/readium/customization/manifest";
import { THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL, THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_STREAMER } from "readium-desktop/common/streamerProtocol";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

// Logger
const filename_ = "readium-desktop:renderer:reader:saga:customization";
const debug = debug_(filename_);
debug("_");

const applyColorSet = (colors: ICustomizationManifestColor, suffix: string) => {
    Object.entries(colors).forEach(([key, value]) => {
        const cssVar = `--theme-${key}_${suffix}`;
        document.documentElement.style.setProperty(cssVar, value);
    });
};

function* profileActivating(id: string): SagaGenerator<void> {

    debug(`TODO activate ${id} profile`);
    if (!id) {
        // THorium vanilla rollback, clear the local redux state

        yield* putTyped(customizationActions.manifest.build(null));

        const colorDark: ICustomizationManifestColor = {
            neutral: "#1D1D1E",
            primary: "#99A9E3",
            secondary: "#2D2D2D",
            border: "#48484b",
            background: "#27272a",
            appName: "#EAEAEA",
            scrollbarThumb: "#7c7d86",
            buttonsBorder: "#99A9E3",
        };

        const colorLight: ICustomizationManifestColor = {
            neutral: "#fff",
            primary: "#1053C8",
            secondary: "#ECF2FD",
            border: "#afb1b6",
            background: "#f5f5f5",
            appName: "#afb1b6",
            scrollbarThumb: "#7c7d86",
            buttonsBorder: "#1053C8",
        };

        applyColorSet(colorLight, "light");
        applyColorSet(colorDark, "dark");

        return ;
    }

    const baseUrl = `${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL}://${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_STREAMER}/custom-profile-zip/${encodeURIComponent_RFC3986(Buffer.from(id).toString("base64"))}/`;
    const manifestURL = baseUrl + encodeURIComponent_RFC3986(Buffer.from("manifest.json").toString("base64"));
    const response = yield* callTyped(() => fetch(manifestURL));
    if (response.status !== 200) {
        debug("ERORR in manifest request", response);
        return ;
    }
    let manifestJson: ICustomizationManifest;
    try {
        manifestJson = yield* callTyped(() => response.json());
    } catch (e) {
        // nothing
        debug("Manifest JSON parsing error", e);

    }
    if (!manifestJson) {
        return;
    }

    debug("MANIFEST FROM ", id, ":");
    debug(manifestJson);

    yield* putTyped(customizationActions.manifest.build(manifestJson));

    const colorsDarkLight = manifestJson.theme.color;

    applyColorSet(colorsDarkLight.light, "light");
    applyColorSet(colorsDarkLight.dark, "dark");
    
}

function* profileActivatingAction(action: customizationActions.activating.TAction) {


    const id = action.payload.id;

    if (!id) {
        debug("Request to activate the default thorium profile !!!");
    }
    const lock = yield* selectTyped((state: ICommonRootState) => state.customization.lock);

    if (lock.state === "ACTIVATING" && lock.lockInfo.id === id) {

        yield* callTyped(profileActivating, id);

    } else {
        debug("NOT IN ACTIVATING PHASE");
    }


}

export function saga() {

    return allTyped([
        takeSpawnLeading(
            customizationActions.activating.ID,
            profileActivatingAction,
            (e) => debug(e),
        ),

        callTyped(function* () {

            const customization = yield* selectTyped((state: ICommonRootState) => state.customization);
            const id = customization.activate.id;
            if (customization.lock.state !== "IDLE" || !id) {
                return;
            }
            // const action = customizationActions.activating.build(id);
            // yield* callTyped(profileActivatingAction, action);
            yield* putTyped(customizationActions.activating.build(id));

            yield* callTyped(profileActivating, id);
        }),
    ]);
}
