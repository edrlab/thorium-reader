// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { ActionWithDestination } from "readium-desktop/common/models/sync";
import type { IReadiumAnnotationSet } from "readium-desktop/common/readium/annotation/annotationModel.type";

export const ID = "READER_PUBLICATION_NOTES_EXPORT_HTML_REQUEST";

export interface IPayload {
    publicationIdentifier: string;
    readiumAnnotationSet: IReadiumAnnotationSet;
    htmlMustacheTemplate: string;
    title?: string | undefined;
    windowIdentifier: string;
}

export function build(
    publicationIdentifier: string,
    readiumAnnotationSet: IReadiumAnnotationSet,
    htmlMustacheTemplate: string,
    title: string | undefined,
    windowIdentifier: string,
): ActionWithDestination<typeof ID, IPayload> {

    return {
        type: ID,
        payload: {
            publicationIdentifier,
            readiumAnnotationSet,
            htmlMustacheTemplate,
            title,
            windowIdentifier,
        },
        destination: {
            identifier: windowIdentifier,
        },
    };
}
build.toString = () => ID;
export type TAction = ReturnType<typeof build>;
