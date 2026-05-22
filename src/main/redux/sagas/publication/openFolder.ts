// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { shell } from "electron";
import { ToastType } from "readium-desktop/common/models/toast";
import { toastActions } from "readium-desktop/common/redux/actions";
import { diMainGet } from "readium-desktop/main/di";
import { SagaGenerator, call as callTyped, put as putTyped } from "typed-redux-saga";

export function* openPublicationFolder(identifier?: string): SagaGenerator<void> {

    let folderPath: string;

    if (!identifier) {
        folderPath = yield* callTyped(() => diMainGet("publication-storage").getDirectoryPath());
    } else {
        try {
            folderPath = yield* callTyped(() => diMainGet("publication-storage").getPublicationPath(identifier));
        } catch {
            yield* putTyped(toastActions.openRequest.build(
                ToastType.Error,
                "The publication folder cannot be found. Re-import it, or configure the external publication folder in Settings > Storage.",
            ));
            return;
        }
    }

    yield* callTyped(() => shell.openPath(folderPath));
}
