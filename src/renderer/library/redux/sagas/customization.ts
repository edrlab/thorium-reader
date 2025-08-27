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
import { ToastType } from "src/common/models/toast";

import { call as callTyped, select as selectTyped, put as putTyped, /*take as takeTyped, race as raceTyped,*/ delay, SagaGenerator } from "typed-redux-saga/macro";

// Logger
const filename_ = "readium-desktop:renderer:library:saga:customization";
const debug = debug_(filename_);
debug("_");

function* profileActivating(id: string): SagaGenerator<void> {

    debug(`TODO activate ${id} profile`);
    yield* delay(1000);
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

            yield* putTyped(customizationActions.lock.build("IDLE"));
        } else {
            debug(`profile "${id || "thorium default profile"}" cannot be activate because LOCK is enabled on ${lock.state} with ${lock.lockInfo.id || lock.lockInfo.uuid}`);
            yield* putTyped(toastActions.openRequest.build(ToastType.Success, `profile "${id || "thorium default profile"}" cannot be activate because LOCK is enabled on ${lock.state} with ${lock.lockInfo.id || lock.lockInfo.uuid}`));
        }
    }
}


export function saga() {

    return takeSpawnLeading(
        customizationActions.activating.ID,
        profileActivatingAction,
        (e) => debug(e),
    );
}
