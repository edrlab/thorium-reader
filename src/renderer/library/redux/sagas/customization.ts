// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { nanoid } from "nanoid";
import { customizationActions, themeActions, toastActions } from "readium-desktop/common/redux/actions";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { ICustomizationLockInfo } from "readium-desktop/common/redux/states/customization";
import { ToastType } from "readium-desktop/common/models/toast";
import { call as callTyped, select as selectTyped, put as putTyped, /*take as takeTyped, race as raceTyped,*/ delay, SagaGenerator, all as allTyped } from "typed-redux-saga/macro";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";
import { THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL, THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_STREAMER } from "readium-desktop/common/streamerProtocol";
import { ICustomizationManifest } from "src/common/readium/customization/manifest";

// Logger
const filename_ = "readium-desktop:renderer:library:saga:customization";
const debug = debug_(filename_);
debug("_");

function* profileActivating(id: string): SagaGenerator<void> {

    debug(`TODO activate ${id} profile`);
    yield* delay(1000);
    if (!id) {
        // THorium vanilla rollback, clear the local redux state
        yield* putTyped(themeActions.setTheme.build(undefined, { enable: false, logo: "" }));
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


    const logoObj = manifestJson.images?.find((ln) => ln?.rel === "logo");
    debug("Manifest LOGO Obj:", logoObj);
    const logoUrl = baseUrl + encodeURIComponent_RFC3986(Buffer.from("./images/logo.svg").toString("base64"));

    yield* putTyped(themeActions.setTheme.build(undefined, { enable: true, logo: logoUrl }));
}


function* profileActivatingAction(action: customizationActions.activating.TAction) {


    const id = action.payload.id;

    if (!id) {
        debug("Request to activate the default thorium profile !!!");
    }
    const lock = yield* selectTyped((state: ICommonRootState) => state.customization.lock);

    if (lock.state === "ACTIVATING" && lock.lockInfo.id === id) {

        yield* callTyped(profileActivating, id);
        
        yield* putTyped(customizationActions.lock.build("IDLE"));

    } else {

        if (lock.state === "IDLE") {

            const lockInfo: ICustomizationLockInfo = {
                uuid: nanoid(),
                id,
            };
            yield* putTyped(customizationActions.lock.build("ACTIVATING", lockInfo));

            yield* callTyped(profileActivating, id);

            yield* putTyped(customizationActions.lock.build("IDLE", {uuid: ""}));
        } else {
            debug(`profile "${id || "thorium default profile"}" cannot be activate because LOCK is enabled on ${lock.state} with ${lock.lockInfo.id || lock.lockInfo.uuid}`);
            yield* putTyped(toastActions.openRequest.build(ToastType.Success, `profile "${id || "thorium default profile"}" cannot be activate because LOCK is enabled on ${lock.state} with ${lock.lockInfo.id || lock.lockInfo.uuid}`));
        }
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
        const theme = yield* selectTyped((state: ICommonRootState) => state.theme);
        const id = customization.activate.id;
        if (customization.lock.state !== "IDLE" || (!theme.customization.enable && !id)) {
            return ;
        }
        const action = customizationActions.activating.build(id);
        yield* callTyped(profileActivatingAction, action);
    }),
]);
}
