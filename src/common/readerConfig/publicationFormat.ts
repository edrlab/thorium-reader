// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import { isAudiobookFn, isPdfFn } from "readium-desktop/common/isManifestType";
import { PublicationView } from "readium-desktop/common/views/publication";

export type ReaderConfigPublicationFormat = "reflowable" | "fixed" | "audio";

export function detectReaderConfigPublicationFormat(
    publicationView: Partial<PublicationView> | undefined,
    r2Publication: R2Publication | undefined,
): ReaderConfigPublicationFormat {

    if (publicationView?.isAudio || isAudiobookFn(publicationView) || isAudiobookFn(r2Publication)) {
        return "audio";
    }

    const isFixedLayout =
        !!publicationView?.isFixedLayoutPublication ||
        !!publicationView?.isPDF ||
        !!publicationView?.isDivina ||
        !!publicationView?.isCBZ ||
        r2Publication?.Metadata?.Rendition?.Layout === "fixed" ||
        isPdfFn(r2Publication as R2Publication);

    if (isFixedLayout) {
        return "fixed";
    }

    return "reflowable";
}
