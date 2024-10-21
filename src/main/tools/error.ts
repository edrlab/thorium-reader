// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { dialog } from "electron";
import { getTranslator } from "readium-desktop/common/services/translator";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";
import { types } from "util";

// Logger
const filename_ = "readium-desktop:main:error";
const debug = debug_(filename_);
debug("_");

export function error(filename: string, err: any) {

    debug(err);

    let errorMessage: string;
    if (types.isNativeError(err)) {

        // disable "Error: "
        err.name = "";
        errorMessage = err.toString();
    } else {
        errorMessage = JSON.stringify(err);
    }

    const translator = getTranslator();

    dialog.showErrorBox(
        translator.translate("error.errorBox.title", { appName: _APP_NAME }),
        `
        ${translator.translate("error.errorBox.message", { filename })}

        ${translator.translate("error.errorBox.error")}
        ${errorMessage}
        `,
    );
}
