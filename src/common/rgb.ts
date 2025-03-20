// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IColor } from "@r2-navigator-js/electron/common/highlight";

export function rgbToHex(color: { red: number; green: number; blue: number }): string {
    const { red, green, blue } = color;
    const redHex = Math.min(255, Math.max(0, red)).toString(16).padStart(2, "0");
    const greenHex = Math.min(255, Math.max(0, green)).toString(16).padStart(2, "0");
    const blueHex = Math.min(255, Math.max(0, blue)).toString(16).padStart(2, "0");
    return `#${redHex}${greenHex}${blueHex}`.toUpperCase();
}

export function hexToRgb(hex: string): IColor | undefined {

    const rgbresultmatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.toLowerCase());
    const colorObj = rgbresultmatch ? {
        red: parseInt(rgbresultmatch[1], 16),
        green: parseInt(rgbresultmatch[2], 16),
        blue: parseInt(rgbresultmatch[3], 16),
      } : undefined;

    return colorObj;
}
