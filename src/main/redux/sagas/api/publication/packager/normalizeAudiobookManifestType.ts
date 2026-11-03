// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Publication } from "@r2-shared-js/models/publication";
import { ContentType, parseContentType } from "readium-desktop/utils/contentType";

export function normalizeAudiobookManifestType(publication: Publication, isAudiobook = false): void {
    const metadata = publication.Metadata;
    if (!metadata || (metadata.RDFType && !/^https?:\/\/schema\.org\/book\/?$/i.test(metadata.RDFType))) {
        return;
    }

    const declaredAudiobook = isAudiobook || publication.Links?.some((link) =>
        link.HasRel("self") && parseContentType(link.TypeLink) === ContentType.AudioBook);
    const readingOrder = publication.Spine;
    if (declaredAudiobook && readingOrder?.length && readingOrder.every((link) =>
        /^audio\/[a-z0-9.+-]+(?:\s*;.*)?$/i.test(link.TypeLink || ""))) {
        // Some Cantook manifests declare Book despite their audiobook media type and audio-only spine.
        metadata.RDFType = "http://schema.org/Audiobook";
    }
}
