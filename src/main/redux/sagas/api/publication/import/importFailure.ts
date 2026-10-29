// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { DownloadFailure } from "readium-desktop/main/tools/downloadFailure";
import { getTranslator } from "readium-desktop/common/services/translator";

export class ImportFailure extends Error {
    constructor(public readonly reason: "unsupportedFormat" | "invalidPublication" | "invalidLicense", message: string) {
        super(message);
    }
}

export function importFailureMessage(error: unknown, name: string): string {
    const translate = getTranslator().translate;
    if (error instanceof DownloadFailure) {
        if (error.reason === "storage") {
            return translate("message.download.saveFailed");
        }
        const hostname = new URL(error.source).hostname;
        if (error.reason === "integrity") {
            return translate("message.download.integrityFailed", { hostname });
        }
        return translate("message.download.failed", { hostname });
    }
    if (error instanceof ImportFailure) {
        switch (error.reason) {
            case "unsupportedFormat":
                return translate("message.import.unsupportedFormat", { name });
            case "invalidPublication":
                return translate("message.import.invalidPublication", { name });
            case "invalidLicense":
                return translate("message.import.invalidLicense", { name });
        }
    }
    return translate("message.import.failed", { name });
}
