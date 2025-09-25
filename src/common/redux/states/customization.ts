// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IStringMap } from "r2-shared-js/dist/es8-es2017/src/models/metadata-multilang";

// export type TCustomizationProvisioningPackage = Array<[identifier: string, fileName: string, version: string]>;

export interface ICustomizationProfileProvisioned {
    identifier: string; // identifier URI from manifest
    fileName: string; // relative file from well-known folder, not an absolute file path. Allow to move well-known folder without compromise internal redux state
    version: string; // semantic versionning from manifest
    logo: string;
    description: IStringMap;
    title: IStringMap;
}

export interface ICustomizationProfileError {
fileName: string; error: boolean; message: string;
}

export type ICustomizationProfileProvisionedWithError = ICustomizationProfileProvisioned | ICustomizationProfileError;

export interface ICustomizationProfileActivated {
    id: string, // identifier URI from manifest // pointer to ICustomizationProfileProvisioned.id
}

export interface ICustomizationLockInfo {
    uuid: string;
    id?: string;
    fileName?: string;
    filePath?: string;
    packagePath?: string;
    fileSize?: number;
}
export interface ICustomizationProfileLock {
    state: "IDLE" | "DOWNLOAD" | "COPY" | "PROVISIONING" | "ACTIVATING", // finite state machine
    lockInfo: ICustomizationLockInfo,
}
