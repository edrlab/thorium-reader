// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { encodeB64, decodeB64 } from "../../common/logics/base64";

/**
 * formating customization screen route to react-router route
 * @param href href of the customization "screen" link (manifest.json)
 */
export function buildCustomizationRoute(href: string) {
    return `/customization/${encodeB64(href)}`;
}

export function decodeCustomizationRouteParam(hrefEncoded: string) {
    return decodeB64(hrefEncoded);
}
