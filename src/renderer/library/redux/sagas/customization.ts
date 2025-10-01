// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { nanoid } from "nanoid";
import { customizationActions, toastActions } from "readium-desktop/common/redux/actions";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { ICustomizationLockInfo } from "readium-desktop/common/redux/states/customization";
import { ToastType } from "readium-desktop/common/models/toast";
import { call as callTyped, select as selectTyped, put as putTyped, /*take as takeTyped, race as raceTyped, delay,*/ SagaGenerator, all as allTyped } from "typed-redux-saga/macro";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";
import { THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL, THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_STREAMER } from "readium-desktop/common/streamerProtocol";
import { ICustomizationManifest, ICustomizationManifestColor } from "readium-desktop/common/readium/customization/manifest";
import { contentTypeisOpdsAuth, parseContentType } from "readium-desktop/utils/contentType";


// Logger
const filename_ = "readium-desktop:renderer:library:saga:customization";
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

        yield* putTyped(customizationActions.welcomeScreen.build(false));

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

        return;
    }

    // yield* delay(1000);


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

    const profileActivationHistory = yield* selectTyped((state: ICommonRootState) => state.customization.history);

    const profileHistoryFound = profileActivationHistory.find((profileHistory) => profileHistory.id === id);
    const welcomeScreenNeeded = !profileHistoryFound || profileHistoryFound.version !== manifestJson.version;

    yield* putTyped(customizationActions.welcomeScreen.build(welcomeScreenNeeded));

    // const logoObj = manifestJson.images?.find((ln) => ln?.rel === "logo");
    // debug("Manifest LOGO Obj:", logoObj);
    // const logoUrl = baseUrl + encodeURIComponent_RFC3986(Buffer.from(logoObj.href).toString("base64"));

    const colorsDarkLight = manifestJson.theme.color;

    // yield* putTyped(themeActions.setTheme.build(undefined, { enable: true, logo: logoUrl, color: colorsDarkLight }));


    // TODO https://github.com/edrlab/thorium-reader/pull/3095/files#diff-c6b317c691e2e0831a6aeebdf7b5dba7ca96d4abff06bf95d8ccfbed69475618R159-R167
    // https://github.com/edrlab/thorium-reader/pull/3095/files#diff-a1ba4dd633f2508df334faa03814d16f0c012313a2e451f34406e2396f97e323R19


    applyColorSet(colorsDarkLight.light, "light");
    applyColorSet(colorsDarkLight.dark, "dark");

    const catalogsLinks = manifestJson.links?.filter((ln) => ln.rel === "catalog");
    debug("Manifest CATALOGS links", catalogsLinks);

    if (catalogsLinks.length) {
        const catalogLink = catalogsLinks[0];

        let catalogLinkOpdsAuthenticateDocumentHref = "";
        if (catalogLink.properties) {
            debug("catalog properties => ", catalogLink.properties);
            if (catalogLink.properties?.authenticate) {

                const mimeType = catalogLink.properties.authenticate.type;
                const contentTypeParsed = parseContentType(mimeType);
                if (contentTypeisOpdsAuth(contentTypeParsed)) {
                    if (typeof catalogLink.properties.authenticate.href === "string") {
                        catalogLinkOpdsAuthenticateDocumentHref = catalogLink.properties.authenticate.href;
                    }
                }
            }
        }

        yield* putTyped(customizationActions.triggerOpdsAuth.build(catalogLink.href, catalogLinkOpdsAuthenticateDocumentHref));
    }

    yield* putTyped(customizationActions.addHistory.build(id, manifestJson.version));
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

            yield* putTyped(customizationActions.welcomeScreen.build(false));

            yield* putTyped(customizationActions.manifest.build(null));

            try {
                yield* callTyped(profileActivating, id);

            } catch (e) {

                yield* putTyped(toastActions.openRequest.build(ToastType.Error, `${e}`));
                debug("Critical ERROR to activate the profile", id);
                debug(e);

            } finally {

                yield* putTyped(customizationActions.lock.build("IDLE", {uuid: ""}));
            }

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
        const id = customization.activate.id;
        if (customization.lock.state !== "IDLE" || !id) {
            return ;
        }
        // const action = customizationActions.activating.build(id);
        // yield* callTyped(profileActivatingAction, action);
        yield* putTyped(customizationActions.activating.build(id));
    }),
]);
}
