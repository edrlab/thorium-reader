// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { customizationActions, toastActions } from "readium-desktop/common/redux/actions";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { customizationPackageProvisioning, customizationPackageProvisionningFromFolder, customizationWellKnownFolder } from "readium-desktop/main/customization/provisioning";
import { tryCatch } from "readium-desktop/utils/tryCatch";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { error } from "readium-desktop/main/tools/error";
import { copyFile } from "node:fs/promises";
import { nanoid } from "nanoid";


import { fork as forkTyped, call as callTyped, select as selectTyped, put as putTyped, take as takeTyped, race as raceTyped, delay, SagaGenerator, all as allTyped } from "typed-redux-saga/macro";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { ICustomizationLockInfo } from "readium-desktop/common/redux/states/customization";
import { ToastType } from "readium-desktop/common/models/toast";

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

    if (!httpUrlOrFilePath) {
        debug("ERROR: No FilePath or URL !!!!");
        return ;
    }
    if (httpUrlOrFilePath.startsWith("http")) {
        // TODO

        debug("need to download target", httpUrlOrFilePath);
        return;
    }
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
    const fileName = `${nanoid(10)}_${path.basename(filePath)}`;
    if (path.extname(fileName) !== ".thorium") {
        debug("ERROR: file is not a .thorium extension", fileName);
        return;
    }

    const packageAbsolutePath = path.join(customizationWellKnownFolder, fileName);
    const lockInfo: ICustomizationLockInfo = {
        uuid: nanoid(),
        fileName,
        filePath,
        packagePath: packageAbsolutePath,
        fileSize: filePathStat.size,
    };

    const lock = yield* selectTyped((state: ICommonRootState) => state.customization.lock);
    let copyAndQuit = false;
    if (lock.state !== "IDLE") {
        debug("ERROR: already in profile activating phase, need a manual action to activate this profile !!!");

        copyAndQuit = true;
    } else {
        yield* putTyped(customizationActions.lock.build("COPY", lockInfo));
    }

    yield* forkTyped(function* () {

        yield* delay(100);
        let error = false;
        debug(`COPY "${filePath}" to "${packageAbsolutePath}"`);
        try {
            yield* callTyped(() => copyFile(filePath, packageAbsolutePath));
            debug("COPY SUCCESS");
        } catch (e) {
            debug("ERROR: copy", filePath, e);
            error = true;
        }

        if (copyAndQuit) {
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

    const { a: timeoutResult, b: fileNameProvisioned } = yield* raceTyped({
        a: delay(20000),
        b: callTyped(function* (): SagaGenerator<boolean> {
            if (copyAndQuit) {
                return undefined;
            }

            while (1) {

                debug("Waiting for provisionning action");
                const provisioningAction = yield* takeTyped(customizationActions.provisioning.build);
                debug("Provisionning action found", provisioningAction);

                const fileNameProvisionedFound = provisioningAction.payload.newPackagesProvisioned.find(({ fileName: fileNameProvisioned }) => fileNameProvisioned === fileName);
                if (fileNameProvisionedFound) {

                    // TODO: in the case of a drag-and-drop of an older profile than one already provisioned,
                    // it can be better to activate the newer profile vendor and do not provisioned the older profile
                    const packageId = fileNameProvisionedFound.id;
                    lockInfo.id = packageId;
                    yield* putTyped(customizationActions.lock.build("ACTIVATING", lockInfo));
                    yield* putTyped(customizationActions.activating.build(packageId));
                    return true;
                } else {
                    const fileNameErrorFound = provisioningAction.payload.errorPackages.find(({ fileName: fileNameProvisioned }) => fileNameProvisioned === fileName);
                    if (fileNameErrorFound) {
                        debug(`ERROR: profile (${fileName}) [${fileNameErrorFound.message}]`);
                        yield* putTyped(toastActions.openRequest.build(ToastType.Error, `ERROR: profile (${fileName}) [${fileNameErrorFound.message}]`));
                        yield* putTyped(customizationActions.lock.build("IDLE"));
                        return true;
                    }
                }
            }

            return false; // never returned
        }),
    });

    if (copyAndQuit) {
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

export function saga() {

    return allTyped([
        takeSpawnLeading(
            customizationActions.acquire.ID,
            acquireProvisionsActivates,
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
