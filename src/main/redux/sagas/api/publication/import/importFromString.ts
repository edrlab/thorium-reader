// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { SagaGenerator } from "typed-redux-saga";

import { packageFromManifestBuffer } from "../packager/packageLink";
import { importFromFsService } from "./importFromFs";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/importFromStringService");

export function* importFromStringService(
    manifest: string,
    baseFileUrl: string, // should starts with 'file://'
): SagaGenerator<[publicationDoc: PublicationDocument, alreadyImported: boolean]> {

    const baseUrl = baseFileUrl.startsWith("file://") ? baseFileUrl : "file://";
    const packagePath = yield* callTyped(packageFromManifestBuffer, baseUrl, Buffer.from(manifest));
    if (packagePath) {
        return yield* callTyped(importFromFsService, packagePath);
    } else {
        debug("package path is empty");
    }

    return [undefined, false];
}
