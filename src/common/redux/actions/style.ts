import { HighContrastColors } from "readium-desktop/renderer/redux/states/style";

// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export enum ActionType {
    HighContrastChanged = "HIGH_CONTRAST_CHANGED",
}

export function highContrastChanged(enabled: boolean, colors: HighContrastColors) {
    return {
        type: ActionType.HighContrastChanged,
        payload: { enabled, colors },
    };
}
