// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export interface StyleState {
    highContrast: HighContrast;
}

export interface HighContrast {
    enabled: boolean;
    colors: HighContrastColors;
}

export interface HighContrastColors {
    background: string;
    text: string;
    buttonBackground: string;
    buttonText: string;
    highlight: string;
}
