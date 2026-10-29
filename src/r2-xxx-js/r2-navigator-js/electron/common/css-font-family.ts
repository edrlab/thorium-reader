// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// Serialize an installed font's family name as a CSS string, including names
// containing digit-leading words (e.g. Inter 18pt), quotes, or backslashes.
export function cssFontFamilyName(font: string): string {
    const escaped = font.replace(/["\\\n\r\f]/g,
        (character) => `\\${character.charCodeAt(0).toString(16)} `);
    return `"${escaped}"`;
}
