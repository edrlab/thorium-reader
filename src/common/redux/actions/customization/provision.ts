// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { ICustomizationProfileProvisioned, ICustomizationProfileProvisionedWithError } from "../../states/customization";

export const ID = "CUSTOMIZATION_PROVISION_PROFILE";

export interface Payload {
    // oldPackagesProvisioned: ICustomizationProfileProvisioned[];
    provsionedPackages: ICustomizationProfileProvisioned[];
    errorPackages: ICustomizationProfileProvisionedWithError[];
}

export function build(/*oldPackagesProvisioned: ICustomizationProfileProvisioned[],*/ provsionedPackages: ICustomizationProfileProvisioned[], errorPackages: ICustomizationProfileProvisionedWithError[]): Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            // oldPackagesProvisioned,
            provsionedPackages,
            errorPackages,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
