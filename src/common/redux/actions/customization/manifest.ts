// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ICustomizationManifest } from "readium-desktop/common/readium/customization/manifest";

export const ID = "CUSTOMIZATION_MANIFEST";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IPayload extends ICustomizationManifest {};

export function build(manifest: ICustomizationManifest) {

    return {
        type: ID,
        payload: manifest,
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;

