// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TPublication } from "readium-desktop/common/type/publication.type";
import { IOpdsFeedView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";

import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";
import { IReaderDialogOrDockSettingsMenuState } from "./reader";

interface IPubInfoState {
    publication?: TPublication;
    coverZoom?: boolean;
}
interface IPubInfoStateReader extends IPubInfoState {
    focusWhereAmI: boolean;
    pdfPlayerNumberOfPages: number | undefined; // super hacky :(
    divinaNumberOfPages: number | undefined; // super hacky :(
    divinaContinousEqualTrue: boolean;
    readerReadingLocation: MiniLocatorExtended;
    handleLinkUrl: ((url: string) => void) | undefined;
}

export interface IFileImport {
    name: string;
    path: string;
}

export enum DialogTypeName {
    FileImport = "file-import",
    PublicationInfoOpds = "publication-info-opds",
    PublicationInfoLib = "publication-info-lib",
    PublicationInfoReader = "publication-info-reader",
    OpdsFeedAddForm = "opds-feed-add-form",
    OpdsFeedUpdateForm = "opds-feed-update-form",
    ApiappAddForm = "apiapp-add-form",
    DeletePublicationConfirm = "delete-publication-confirm",
    DeleteOpdsFeedConfirm = "delete-opds-feed-confirm",
    LcpAuthentication = "lcp-authentication",
    LsdReturnConfirm = "lsd-return-confirm",
    LsdRenewConfirm = "lsd-renew-confirm",
    AboutThorium = "about-thorium",
    ReaderMenu = "reader-menu",
    ReaderSettings = "reader-settings",
}

export interface DialogType {
    [DialogTypeName.ReaderMenu]: IReaderDialogOrDockSettingsMenuState,
    [DialogTypeName.ReaderSettings]: IReaderDialogOrDockSettingsMenuState,
    [DialogTypeName.FileImport]: {
        files: IFileImport[];
    };
    [DialogTypeName.PublicationInfoOpds]: IPubInfoState;
    [DialogTypeName.PublicationInfoLib]: IPubInfoState;
    [DialogTypeName.PublicationInfoReader]: IPubInfoStateReader;
    [DialogTypeName.OpdsFeedAddForm]: {};
    [DialogTypeName.OpdsFeedUpdateForm]: {
        feed: IOpdsFeedView;
    };
    [DialogTypeName.ApiappAddForm]: {};
    [DialogTypeName.DeleteOpdsFeedConfirm]: {
        feed: IOpdsFeedView;
    };
    [DialogTypeName.LcpAuthentication]: {
        publicationView: PublicationView;
        hint: string;
        urlHint: {
            href: string | undefined;
            title?: string;
        };
        message: string | undefined;
    };
    [DialogTypeName.LsdReturnConfirm]: {
        publicationView: PublicationView;
    };
    [DialogTypeName.LsdRenewConfirm]: {
        publicationView: PublicationView;
    };
    [DialogTypeName.AboutThorium]: {};
}
