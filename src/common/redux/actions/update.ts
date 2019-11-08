// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { UpdateStatus } from "readium-desktop/common/redux/states/update";

export enum ActionType {
    LatestVersionSet = "UPDATE_LATEST_VERSION_SET",
}

export interface ActionPayloadLatestVersion {
    status: UpdateStatus;
    latestVersion: string;
    latestVersionUrl: string;
}

export function setLatestVersion(
    status: UpdateStatus,
    latestVersion: string,
    latestVersionUrl: string,
): Action<string, ActionPayloadLatestVersion> {
    return {
        type: ActionType.LatestVersionSet,
        payload: {
            status,
            latestVersion,
            latestVersionUrl,
        },
    };
}
