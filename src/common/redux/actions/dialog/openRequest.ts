// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { DialogType, IFileImport } from "readium-desktop/common/models/dialog";
import { Action } from "readium-desktop/common/models/redux";
import { IOpdsFeedView, IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";

export const ID = "DIALOG_OPEN_REQUEST";

export interface IDataPayload {
    "file-import": {
        files: IFileImport[];
    };
    // "publication-info-opds"
    "publication-info-opds": {
        publication: IOpdsPublicationView;
    };
    "publication-info-reader": {
        publicationIndentifier: string;
    };
    "opds-feed-add-form": {
    };
    "delete-publication-confirm": {
        publicationView: PublicationView;
    };
    "delete-opds-feed-confirm": {
        feed: IOpdsFeedView;
    };
    "lcp-authentication": {
        publicationView: PublicationView;
        hint: string;
        message: string | undefined;
    };
    "lsd-return-confirm": {
        publicationView: PublicationView;
    };
    "lsd-renew-confirm": {
        publicationView: PublicationView;
    };
    "about-thorium": {
    };
}

export interface Payload<T extends keyof IDataPayload> {
    type: T;
    data: IDataPayload[T];
}

export function build<T extends keyof DialogType>(type: T, data: IDataPayload[T]):
    Action<typeof ID, Payload<T>> {

    return {
        type: ID,
        payload: {
            type,
            data,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
