// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { ToastType } from "readium-desktop/common/models/toast";
import { toastActions } from "readium-desktop/common/redux/actions";
import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { put } from "redux-saga/effects";
import { SagaGenerator } from "typed-redux-saga";

import { packageFromManifestBuffer } from "../packager/packageLink";
import { importFromFsService } from "./importFromFs";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/importFromStringService");

export function* importFromStringService(
    manifest: string,
): SagaGenerator<PublicationDocument | undefined> {

    try {

        const packagePath = yield* callTyped(packageFromManifestBuffer, "file://", Buffer.from(manifest));
        if (packagePath) {
            return yield* callTyped(importFromFsService, packagePath);
        } else {
            debug("package path is empty");
        }

    } catch (e) {

        const translate = diMainGet("translator").translate;
        debug("importFromLink failed", e.toString(), e.trace);
        yield put(
            toastActions.openRequest.build(
                ToastType.Error,
                translate(
                    "message.import.fail", { path: "", err: e.toString() },
                ),
            ),
        );
    }

    debug("error to import from buffer");
    return undefined;
}
