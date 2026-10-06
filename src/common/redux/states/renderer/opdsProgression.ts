// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { IOpdsProgressionDocument } from "readium-desktop/common/models/opdsProgression";

export interface IOpdsProgressionState {
    // PUT is allowed after initial retrieval and the resume decision finish.
    ready?: boolean;
    // Last observed value distinguishes navigation from locator metadata updates.
    progression?: number;
    // Ignore the locator event caused by accepting remote resume.
    suppressedProgression?: number;
    document?: IOpdsProgressionDocument;
}
