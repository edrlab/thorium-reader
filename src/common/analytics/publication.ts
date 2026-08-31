// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { TAnalyticsEventParams } from "readium-desktop/common/api/interface/analyticsApi.interface";
import { PublicationView } from "readium-desktop/common/views/publication";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";

// Logger
const debug = debug_("readium-desktop:common:analytics:publication");

export type TPublicationAnalyticsEventName = "import" | "read" | "listen";

export const publicationAnalyticsEvents = {
    saveAs: "publication_save_as",
    deletePublication: "publication_delete",
    addTag: "publication_add_tag",
    markAs: "publication_mark_as",
    importAnnotations: "publication_import_annotations",
    exportAnnotations: "publication_export_annotations",
} as const;

export type TPublicationUserAnalyticsEventName =
    typeof publicationAnalyticsEvents[keyof typeof publicationAnalyticsEvents];

export type TPublicationMarkAsAnalyticsValue = "finished";

export const buildPublicationMarkAsAnalyticsParams = (
    value: TPublicationMarkAsAnalyticsValue,
): TAnalyticsEventParams => ({
    value,
});

export type TPublicationAnalyticsFormat =
    "reflow" |
    "fxl" |
    "pdf" |
    "divina" |
    "audiobook" |
    "webpub";

export const getPublicationAnalyticsFormat = (
    publication: PublicationView,
): TPublicationAnalyticsFormat => {


    if (
        publication.isAudio
    ) {
        return "audiobook";
    }

    if (
        publication.isPDF
    ) {
        return "pdf";
    }

    if (
        publication.isDivina
    ) {
        return "divina";
    }

    if (publication.isFixedLayoutPublication) {
        return "fxl";
    }

    if (publication.isDaisy) {
        const r2PublicationJson = publication.r2PublicationJson;
        const r2Publication = TaJsonDeserialize(r2PublicationJson, R2Publication);
        const daisy_format = r2Publication.Metadata.AdditionalJSON.ReadiumWebPublicationConvertedFrom;
        // "DAISY_audioNCX" / "DAISY_textNCX" / "DAISY_audioFullText"
        debug(
            `TODO: DAISY publication format is not yet reported to telemetry; falling back to "reflow" instead of "${daisy_format}".`,
        );

        return "reflow";
    }

    // // TODO: not yet supported
    // if (publication.isWebpub) {
    //     return "webpub";
    // }

    return "reflow";
};

export const buildPublicationAnalyticsParams = (
    publication: PublicationView,
): TAnalyticsEventParams => {
    const format = getPublicationAnalyticsFormat(publication);
    const params: TAnalyticsEventParams = {
        format,
        media_type: "", // TODO: TBD
    };

    if (publication.lcp) {
        params.lcp_license_type = publication.lcp.rights?.end ? "expiring" : "permanent";

        if (publication.lcp.provider) {
            params.lcp_provider = publication.lcp.provider;
        }
    }

    return params;
};

export const buildPublicationUserAnalyticsParams = (
    publication: PublicationView,
    params: TAnalyticsEventParams = {},
): TAnalyticsEventParams => ({
    ...buildPublicationAnalyticsParams(publication),
    ...params,
});
