// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { getTranslator } from "readium-desktop/common/services/translator";

import type { IHttpGetResult } from "readium-desktop/common/utils/http";

export type DownloadFailureReason = "network" | "http" | "timeout" | "integrity" | "storage";

export class DownloadFailure extends Error {
    constructor(public readonly reason: DownloadFailureReason, public readonly source: string, cause?: unknown) {
        super(getTranslator().translate("message.download.errors.failed"), { cause });
    }
}

export class DownloadCancelled extends Error {
    constructor() {
        super(getTranslator().translate("message.download.cancelled"));
    }
}

// Preserve transport flags before converting the HTTP result into an exception.
export function checkDownloadResponse(data: IHttpGetResult<unknown>, source: string): void {
    if (data.isAbort) {
        throw new DownloadCancelled();
    }
    if (!data.isSuccess) {
        throw new DownloadFailure(data.isTimeout ? "timeout" : data.isNetworkError ? "network" : "http", source, data);
    }
}

export function isDownloadStorageError(error: unknown): boolean {
    return !!error && typeof error === "object" && "code" in error
        && ["ENOSPC", "EDQUOT", "EACCES", "EPERM", "EROFS", "EIO", "EMFILE", "ENFILE"].includes(String(error.code));
}
