// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { authActions, customizationActions, toastActions } from "readium-desktop/common/redux/actions";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { customizationPackageProvisioning, customizationPackageProvisionningFromFolder, customizationWellKnownFolder } from "readium-desktop/main/customization/provisioning";
import { tryCatch } from "readium-desktop/utils/tryCatch";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { error } from "readium-desktop/main/tools/error";
import { copyFile } from "node:fs/promises";
import { nanoid } from "nanoid";
import * as semver from "semver";
import { fork as forkTyped, call as callTyped, select as selectTyped, put as putTyped, take as takeTyped, race as raceTyped, delay, SagaGenerator, all as allTyped } from "typed-redux-saga/macro";
import { existsSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import { ICustomizationLockInfo } from "readium-desktop/common/redux/states/customization";
import { ToastType } from "readium-desktop/common/models/toast";
import { getAuthenticationToken, httpGet, httpGetWithAuth } from "readium-desktop/main/network/http";
import { getOpdsAuthenticationChannel } from "readium-desktop/main/event";
import { OPDSAuthenticationDoc } from "@r2-opds-js/opds/opds2/opds2-authentication-doc";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { diMainGet } from "readium-desktop/main/di";
import { net } from "electron";
import * as fs from "fs";
import isURL from "validator/lib/isURL";

const filename_ = "readium-desktop:main:redux:sagas:customization";
const debug = debug_(filename_);


export function* sagaCustomizationProfileProvisioning() {

    const customizationState = yield* selectTyped((state: ICommonRootState) => state.customization);

    debug("INIT Customization with Persisted REDUX State :=> ", JSON.stringify(customizationState, null, 4));

    const [packagesArray, errorPackages] = yield* callTyped(() => tryCatch(() => customizationPackageProvisionningFromFolder(customizationWellKnownFolder), filename_));
    if (!packagesArray || !packagesArray.length) {
        debug("no package profile found");
    } else {
        debug("packages profile found =", JSON.stringify(packagesArray, null, 4));
    }
    yield* putTyped(customizationActions.provisioning.build(customizationState.provision, packagesArray || [], errorPackages || []));

    if (customizationState.activate.id) {

        let error = false;
        const packageFileName = packagesArray.find(({id}) => id === customizationState.activate.id)?.fileName;
        if (!packageFileName) {
            debug(`CRITICAL ERROR: no pointer to identifier:"${customizationState.activate.id}" found in provisioned array`);
            error = true;
        } else {
            const manifest = yield* callTyped(() => tryCatch(() => customizationPackageProvisioning(packageFileName), filename_));
            if (!manifest) {
                debug(`CRITICAL ERROR: package not signed or correct in ${packageFileName}`);
                error = true;
            }
        }
        if (error) {
            // TODO: need to tell to the user, the action, how !?

            debug("rollback to thorium vanilla profile");
            yield* putTyped(customizationActions.activating.build("")); // no profile
        }
    }
}


export function* acquireProvisionsActivates(action: customizationActions.acquire.TAction) {

    const { httpUrlOrFilePath } = action.payload;

    let copyDownloadAndQuit = false;
    let lockInfo: ICustomizationLockInfo;
    let fileName: string;
    let packagePath: string;

    if (!httpUrlOrFilePath) {
        debug("ERROR: No FilePath or URL !!!!");
        return ;
    }

    // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
    if (/*isURL(httpUrlOrFilePath) && */ /^https?:\/\//.test(httpUrlOrFilePath)) {

        fileName = `${nanoid(10)}_downloaded_profile.thorium`;
        packagePath = path.join(customizationWellKnownFolder, fileName);

        lockInfo = {
            uuid: nanoid(),
            fileName,
            packagePath,
            originHttpUrlOrFilePath: httpUrlOrFilePath,
        };

        const lock = yield* selectTyped((state: ICommonRootState) => state.customization.lock);
        copyDownloadAndQuit = false;
        if (lock.state !== "IDLE") {
            debug("ERROR: already in profile activating phase, need a manual action to activate this profile !!!");

            copyDownloadAndQuit = true;
        } else {
            yield* putTyped(customizationActions.lock.build("DOWNLOAD", lockInfo));
        }

        yield* forkTyped(function* () {

            let error = false;
            try {

                yield* callTyped(() => {

                    return new Promise<void>((resolve, reject) => {
                        debug("[Download] Starting request...");

                        const request = net.request({ method: "GET", url: httpUrlOrFilePath, redirect: "follow" });
                        const fileStream = fs.createWriteStream(packagePath);

                        debug(`[Download] Created write stream for: ${packagePath}`);

                        fileStream.on("open", () => {
                            debug(`[FileStream] File opened for writing: ${packagePath}`);
                        });

                        fileStream.on("finish", () => {
                            debug("[FileStream] Writing finished successfully.");
                        });

                        fileStream.on("close", () => {
                            debug("[FileStream] Stream closed.");
                        });

                        fileStream.on("error", (err) => {
                            console.error("[FileStream] Error while writing file:", err);
                            reject(err);
                        });

                        request.on("response", (response) => {
                            debug(`[Download] Received response with status code: ${response.statusCode}`);

                            if (response.statusCode !== 200) {
                                console.error(`[Download] HTTP error: ${response.statusCode}`);
                                reject(new Error(`HTTP status ${response.statusCode}`));
                                return;
                            }

                            response.on("data", (chunk) => {
                                debug(`[Download] Writing chunk of size: ${chunk.length}`);
                                fileStream.write(chunk);
                            });

                            response.on("end", () => {
                                debug("[Download] Response ended. Ending file stream...");
                                fileStream.end();
                                debug("[Download] File successfully written.");
                                resolve();
                            });

                            response.on("error", (err) => {
                                console.error("[Download] Error during response:", err);
                                fileStream.close();
                                reject(err);
                            });
                        });

                        request.on("error", (err) => {
                            console.error("[Download] Request error:", err);
                            reject(err);
                        });

                        request.end();
                        debug("[Download] Request sent.");
                    });

                });
            } catch (e) {
                error = true;
                debug("Error to download the profile", e);
            }

            if (!error && !existsSync(packagePath)) {
                debug("ERROR: file doesn't exists", packagePath);
                error = true;
            }
            if (!error) {
                const filePathStat = statSync(packagePath);
                if (!filePathStat.isFile()) {
                    debug("ERROR: file is not a file probably a directory", httpUrlOrFilePath);
                    error = true;
                } else {
                    lockInfo.fileSize = filePathStat.size;
                }
            }

            if (copyDownloadAndQuit) {
                if (error) {
                    // nothing
                }
                return;
            } else {
                if (error) {
                    yield* putTyped(customizationActions.lock.build("IDLE"));
                    return;
                }
                yield* putTyped(customizationActions.lock.build("PROVISIONING", lockInfo));
            }
        });


    } else {

        if (!existsSync(httpUrlOrFilePath)) {
            debug("ERROR: file doesn't exists", httpUrlOrFilePath);
            return;
        }
        const filePath = httpUrlOrFilePath;
        const filePathStat = statSync(filePath);
        if (!filePathStat.isFile()) {
            debug("ERROR: file is not a file probably a directory", httpUrlOrFilePath);
            return;
        }
        fileName = `${nanoid(10)}_${path.basename(filePath)}`;
        if (path.extname(fileName) !== ".thorium") {
            debug("ERROR: file is not a .thorium extension", fileName);
            return;
        }

        packagePath = path.join(customizationWellKnownFolder, fileName);
        lockInfo = {
            uuid: nanoid(),
            fileName,
            packagePath,
            fileSize: filePathStat.size,
            originHttpUrlOrFilePath: filePath,
        };

        const lock = yield* selectTyped((state: ICommonRootState) => state.customization.lock);
        copyDownloadAndQuit = false;
        if (lock.state !== "IDLE") {
            debug("ERROR: already in profile activating phase, need a manual action to activate this profile !!!");

            copyDownloadAndQuit = true;
        } else {
            yield* putTyped(customizationActions.lock.build("COPY", lockInfo));
        }

        yield* forkTyped(function* () {

            yield* delay(100);
            let error = false;
            debug(`COPY "${filePath}" to "${packagePath}"`);
            try {
                yield* callTyped(() => copyFile(filePath, packagePath));
                debug("COPY SUCCESS");
            } catch (e) {
                debug("ERROR: copy", filePath, e);
                error = true;
            }

            if (!error && !existsSync(packagePath)) {
                debug("ERROR: file doesn't exists", packagePath);
                error = true;
            }
            if (!error) {
                const filePathStat = statSync(packagePath);
                if (!filePathStat.isFile()) {
                    debug("ERROR: file is not a file probably a directory", httpUrlOrFilePath);
                    error = true;
                }
            }

            if (copyDownloadAndQuit) {
                if (error) {
                    // nothing
                }
                return;
            } else {
                if (error) {
                    yield* putTyped(customizationActions.lock.build("IDLE"));
                    return;
                }
                yield* putTyped(customizationActions.lock.build("PROVISIONING", lockInfo));
            }
        });
    }

    const { a: timeoutResult, b: fileNameProvisioned } = yield* raceTyped({
        a: delay(20000),
        b: callTyped(function* (): SagaGenerator<boolean> {
            if (copyDownloadAndQuit) {
                return undefined;
            }

            while (1) {

                debug("Waiting for provisionning action");
                const provisioningAction = yield* takeTyped(customizationActions.provisioning.build);
                debug("Provisionning action found", JSON.stringify(provisioningAction, null, 4));

                const removeOldPackage = () => {
                    const oldProvisionedPackage = provisioningAction.payload.oldPackagesProvisioned.filter(({ fileName: fileNameOldPackage }) => !provisioningAction.payload.newPackagesProvisioned.find(({fileName: fileNameNewPackage}) => fileNameNewPackage === fileNameOldPackage));
                    debug("OldProvisionedPackage need to be removed:", JSON.stringify(oldProvisionedPackage, null, 4));
                    for (const { fileName } of oldProvisionedPackage) {
                        debug("REMOVE (unlinkSync):", fileName);
                        try {
                            unlinkSync(path.join(customizationWellKnownFolder, fileName));
                        } catch (e) {
                            debug("not removed !?", e);
                        }
                    }
                };

                const fileNameProvisionedFound = provisioningAction.payload.newPackagesProvisioned.find(({ fileName: fileNameProvisioned }) => fileNameProvisioned === fileName);
                if (fileNameProvisionedFound) {

                    const packageId = fileNameProvisionedFound.id;
                    lockInfo.id = packageId;
                    yield* putTyped(customizationActions.lock.build("ACTIVATING", lockInfo));
                    yield* putTyped(customizationActions.activating.build(packageId));
                    yield* callTyped(() => removeOldPackage());
                    return true;
                } else {

                    const fileNameErrorFound = provisioningAction.payload.errorPackages.find(({ fileName: fileNameProvisioned }) => fileNameProvisioned === fileName);
                    if (!fileNameErrorFound) {
                        debug("Error not found!?");
                        return false;
                    }

                    const newPackagesProvisioned = provisioningAction.payload.newPackagesProvisioned;
                    const packageProvisionedWithTheSameIdSortedBySemver = newPackagesProvisioned.filter(({ id }) => id && id === fileNameErrorFound.id).sort(({version: va}, {version: vb}) => semver.gt(va, vb) ? 1 : -1);
                    if (packageProvisionedWithTheSameIdSortedBySemver.length) {
                        const packageId = packageProvisionedWithTheSameIdSortedBySemver[0].id;
                        lockInfo.id = packageId;
                        yield* putTyped(customizationActions.lock.build("ACTIVATING", lockInfo));
                        yield* putTyped(customizationActions.activating.build(packageId));
                        yield* callTyped(() => removeOldPackage());
                        try {
                            unlinkSync(path.join(customizationWellKnownFolder, fileNameErrorFound.fileName));
                        } catch (e) {
                            debug("not removed !?", e);
                        }
                        return true;
                    }

                    debug(`ERROR: profile (${fileName}) [${fileNameErrorFound.message}]`);
                    yield* putTyped(toastActions.openRequest.build(ToastType.Error, `ERROR: profile (${fileName}) [${fileNameErrorFound.message}]`));
                    yield* putTyped(customizationActions.lock.build("IDLE"));
                    try {
                        unlinkSync(path.join(customizationWellKnownFolder, fileNameErrorFound.fileName));
                    } catch (e) {
                        debug("not removed !?", e);
                    }
                    return true;
                }
            }

            return false; // never returned
        }),
    });

    if (copyDownloadAndQuit) {
        return ;
    }

    if (!fileNameProvisioned) {

        if (timeoutResult) {
            debug(`ERROR: fileName (${fileName}) not provisioned TIMEOUT`);
            yield* putTyped(toastActions.openRequest.build(ToastType.Error, `ERROR: fileName (${fileName}) not provisioned TIMEOUT`));
        } else {
            debug(`ERROR: cannot provisioning this profile (${fileName})`);
            yield* putTyped(toastActions.openRequest.build(ToastType.Error, `ERROR: cannot provisioning this profile (${fileName})`));
        }
        yield* putTyped(customizationActions.lock.build("IDLE"));
        return;
    }
}

function* triggerCatalogOpdsAuthentication(action: customizationActions.triggerOpdsAuth.TAction) {

    const payload = action.payload;
    const { opdsAuthenticationHref, catalogHref } = payload;

    debug("START SAGA Routine to trigger if not authenticated the OPDS Authentication dialog modal");
    debug("Receive:  opdsAuthenticationHref=", opdsAuthenticationHref, "catalogHref=", catalogHref);

    /*
        {
            "rel": "catalog",
            "href": "https://demoreader.test.com/v1/home.opds2",
            "title": {
                "en": "test catalog"
            },
            "properties": {
                "authenticate": {
                    "type": "application/opds-authentication+json"
                    "href": "https://demoreader.test.com/v1/sign_in.opds2"
                },
                "logo": {
                    "rel": "logo",
                    "href": "./images/catalog.svg"
                }
            }
        }
    */


    const triggerAndWaitAuthenticationDialogModal = function* (linkHref: string, opdsAuthJsonObj: any): SagaGenerator<boolean> {

        const r2OpdsAuth = TaJsonDeserialize(
            opdsAuthJsonObj,
            OPDSAuthenticationDoc,
        );

        const opdsAuthChannel = getOpdsAuthenticationChannel();

        debug("put the authentication model in the saga authChannel", JSON.stringify(r2OpdsAuth, null, 4));
        opdsAuthChannel.put([r2OpdsAuth, linkHref]);

        const { cancel } = yield* raceTyped({
            cancel: takeTyped(authActions.cancel.build),
            done: takeTyped(authActions.done.build),
        });
        debug("authentication modal closed");

        return !!cancel;
    };


    // authenticate only the first catalog for the moment
    let catalogLinkUrl: URL;
    try {
        catalogLinkUrl = (new URL(catalogHref));
    } catch {
        // nothing
    }
    if (!catalogLinkUrl) {
        debug("No catalogLinkUrl found, return");
        return;
    }
    const authToken = yield* callTyped(() => getAuthenticationToken(catalogLinkUrl));
    // debug("AUTH_TOKEN found", authToken);
    if (authToken?.accessToken) {
        debug("authentication token found");
        // authenticated
        debug("let's try to verify the authentication access token validity");

        // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
        if (!catalogHref || !isURL(catalogHref)) {
            debug("isURL() NOK", catalogHref);
            return;
        }
        const response = yield* callTyped(() => httpGet(catalogHref));
        const opdsService = yield* callTyped(() => diMainGet("opds-service"));
        const opdsView = yield* callTyped(() => opdsService.opdsRequestTransformer(response));
        if (!opdsView) {
            debug("no network!?");
        } else if (opdsView?.title === "Unauthorized") {
            debug("authentication dialog modal triggered");
        } else {
            debug("odpsFeed seems to be authentified");
            debug(opdsView);
        }
    } else {
        debug("Authentication token not found !!");

        if (opdsAuthenticationHref) {
            debug("There is an opds authentication document link");

            // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
            if (!opdsAuthenticationHref || !isURL(opdsAuthenticationHref)) {
                debug("isURL() NOK", opdsAuthenticationHref);
                return;
            }
            const response = yield* callTyped(() => httpGetWithAuth(false)(opdsAuthenticationHref));
            if (response.isSuccess) {
                debug("authentication document receive");
                const opdsAuthJsonObj = yield* callTyped(() => response.response.json());
                debug(opdsAuthJsonObj);
                const cancelled = yield* callTyped(triggerAndWaitAuthenticationDialogModal, catalogHref, opdsAuthJsonObj);
                if (cancelled) {
                    debug("authentication modal cancelled");
                }
            } else {
                debug("Error to get opds authentication document", response.statusCode, response.statusMessage, response.isTimeout, response.isNetworkError);
            }

        }
    }
}

export function saga() {

    return allTyped([
        takeSpawnLeading(
            customizationActions.triggerOpdsAuth.ID,
            triggerCatalogOpdsAuthentication,
            (e) => error(filename_, e),
        ),
        takeSpawnLeading(
            customizationActions.acquire.ID,
            acquireProvisionsActivates,
            (e) => error(filename_, e),
        ),
        takeSpawnLeading(
            customizationActions.deleteProfile.ID,
            function* (action: customizationActions.deleteProfile.TAction) {
                const filename = path.join(customizationWellKnownFolder, action.payload.fileName);
                try {
                    if (existsSync(filename)) {
                        unlinkSync(filename);
                    }
                } catch (e) {
                    debug("error to delete", filename, e);
                }
            },
            (e) => error(filename_, e),
        ),
        takeSpawnLeading(
            customizationActions.activating.ID,
            function* (action: customizationActions.activating.TAction) {

                const payload = action.payload;
                const id = payload.id;


                debug("TODO need to persist activate ID profile HERE", id);

            },
            (e) => debug(e),
        )]);
}
