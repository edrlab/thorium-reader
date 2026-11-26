// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import DOMPurify from "dompurify";
import { resolveProfileDocumentResources } from "readium-desktop/renderer/common/customization/profileResourceUrl";

export function prepareProfileWelcomeScreenHtml(
    rawHtmlContent: string,
    screenHref: string,
    customizationBaseUrl: string,
): string {
    const sanitizedHtml = DOMPurify.sanitize(rawHtmlContent);
    const document = new DOMParser().parseFromString(sanitizedHtml, "text/html");
    resolveProfileDocumentResources(document, screenHref, customizationBaseUrl);
    return document.body.innerHTML;
}
