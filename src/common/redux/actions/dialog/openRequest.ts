// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import { Action } from "readium-desktop/common/models/redux";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";

import { LocatorExtended } from "@r2-navigator-js/electron/renderer";

export const ID = "DIALOG_OPEN_REQUEST";

interface IDataPayload {
    [DialogTypeName.PublicationInfoOpds]: {
        publication: IOpdsPublicationView;
    };
    [DialogTypeName.PublicationInfoLib]: {
        publicationIdentifier: string;
    };
    [DialogTypeName.PublicationInfoReader]: {
        publicationIdentifier: string;
        focusWhereAmI: boolean;
        pdfPlayerNumberOfPages: number | undefined; // super hacky :(
        divinaNumberOfPages: number | undefined; // super hacky :(
        divinaContinousEqualTrue: boolean;
        readerReadingLocation: LocatorExtended;
        handleLinkUrl: ((url: string) => void) | undefined;
    };
    [DialogTypeName.ToastModal]: {
        message: string;
    };
}

type TDialogType = Omit<DialogType, DialogTypeName.PublicationInfoOpds | DialogTypeName.PublicationInfoReader>;
type TDialogTypeOpen = TDialogType & IDataPayload;

export interface Payload<T extends keyof TDialogTypeOpen> {
    type: T;
    data: TDialogTypeOpen[T];
}

export function build<T extends keyof DialogType>(type: T, data: TDialogTypeOpen[T]):
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
