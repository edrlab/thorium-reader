// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import path from "path";
import { customizationActions } from "readium-desktop/common/redux/actions";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { customizationPackageProvisioning, customizationPackageProvisionningFromFolder, customizationWellKnownFolder } from "readium-desktop/main/customization/provisioning";
import { tryCatch } from "readium-desktop/utils/tryCatch";

import { call as callTyped, select as selectTyped, put as putTyped } from "typed-redux-saga/macro";

const filename_ = "readium-desktop:main:redux:sagas:customization";
const debug = debug_(filename_);


export function* sagaCustomizationProfileProvisioning() {

    const customizationState = yield* selectTyped((state: ICommonRootState) => state.customization);

    if (customizationState.activate.id) {

        let error = false;
        const fileName = customizationState.provision.find(({identifier}) => identifier === customizationState.activate.id)?.fileName;
        if (!fileName) {
            debug(`CRITICAL ERROR: no pointer to ${customizationState.activate.id} found in provisioned array`);
            error = true;
        }
        const zipPath = path.join(customizationWellKnownFolder, fileName);
        const manifest = yield* callTyped(() => tryCatch(() => customizationPackageProvisioning(zipPath), filename_));
        if (!manifest) {
            debug(`CRITICAL ERROR: package not signed or correct in ${zipPath}`);
            error = true;
        }
        if (error) {
            // rollback to thorium vanilla profile
            // TODO: need to tell to the user, the action, how !?

            yield* putTyped(customizationActions.activating.build("")); // no profile
        }
    }

    const packagesArray = yield* callTyped(() => tryCatch(() => customizationPackageProvisionningFromFolder(customizationWellKnownFolder), filename_));
    if (!packagesArray || !packagesArray.length) {
        debug("no package profile found");
    } else {
        debug("packages profile found =", JSON.stringify(packagesArray, null, 4));
    }
    yield* putTyped(customizationActions.provisioning.build(customizationState.provision, packagesArray || []));
}
