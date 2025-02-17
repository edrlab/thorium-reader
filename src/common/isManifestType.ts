// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as path from "path";

import { Metadata as R2Metadata } from "@r2-shared-js/models/metadata";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import { PublicationView } from "./views/publication";

type TMetadataR2Publication = Partial<Pick<R2Metadata, "RDFType">>;
type TIsRdfType = Partial<Pick<PublicationView, "RDFType">> &
    Partial<Record<keyof Partial<Pick<R2Publication, "Metadata">>, TMetadataR2Publication>>;

export const isAudiobookFn = (item: TIsRdfType | undefined) =>
    (item?.RDFType && /http[s]?:\/\/schema\.org\/Audiobook[\/]?$/.test(item.RDFType)) ||
    (item?.Metadata?.RDFType && /http[s]?:\/\/schema\.org\/Audiobook[\/]?$/.test(item.Metadata.RDFType));

export const isDivinaFn = (item: TIsRdfType | undefined) =>
    (item?.Metadata?.RDFType &&
        (/http[s]?:\/\/schema\.org\/ComicStrip[\/]?$/.test(item.Metadata.RDFType) ||
            /http[s]?:\/\/schema\.org\/ComicStory[\/]?$/.test(item.Metadata.RDFType) ||
            /http[s]?:\/\/schema\.org\/VisualNarrative[\/]?$/.test(item.Metadata.RDFType))) ||
    (item?.RDFType &&
        (/http[s]?:\/\/schema\.org\/ComicStrip[\/]?$/.test(item.RDFType) ||
            /http[s]?:\/\/schema\.org\/ComicStory[\/]?$/.test(item.RDFType) ||
            /http[s]?:\/\/schema\.org\/VisualNarrative[\/]?$/.test(item.RDFType)));

export const isPdfFn = (publication: R2Publication) =>
    (
        // LCP-PDF do not include this! :(
        // publication?.Metadata?.RDFType
        // && /http[s]?:\/\/schema\.org\/Book[\/]?$/.test(publication?.Metadata?.RDFType)
        // &&
        publication?.Spine
        &&
        (publication?.Spine[0]?.Href && path.extname(publication.Spine[0].Href).toLowerCase() === ".pdf") ||
        (publication?.Spine[0]?.TypeLink && publication.Spine[0].TypeLink === "application/pdf")
    );
