// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { DialogType } from "readium-desktop/common/models/dialog";

export enum ActionType {
    ImportVerificationRequest = "IMPORT_VERIFICATION_REQUEST",
}

export function verifyImport(data: {publication: any, downloadSample: boolean}) {
    return {
        type: ActionType.ImportVerificationRequest,
        payload: { data },
    };
}
