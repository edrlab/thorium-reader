// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export const OPDS_PROGRESSION_REL = "http://opds-spec.org/progression";
export const OPDS_PROGRESSION_MEDIA_TYPE = "application/opds-progression+json";

export interface IOpdsProgressionDevice {
    id: string;
    name: string;
}

export interface IOpdsProgressionDocument {
    title?: string;
    modified: string;
    device: IOpdsProgressionDevice;
    progression: number;
    references?: string[];
}

export const opdsProgressionIsNewer = (
    remoteModified: string,
    localModifiedTime: number | undefined,
): boolean => {
    const remoteModifiedTime = Date.parse(remoteModified);
    return Number.isFinite(remoteModifiedTime) &&
        (typeof localModifiedTime !== "number" || remoteModifiedTime > localModifiedTime);
};
