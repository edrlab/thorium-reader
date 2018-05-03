// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Publication } from "readium-desktop/common/models/publication";
import { Action, ErrorAction } from "readium-desktop/common/models/redux";

export enum ActionType {
    SetRequest = "CATALOG_SET_REQUEST",
    SetError = "CATALOG_SET_ERROR",
    SetSuccess = "CATALOG_SET_SUCCESS",
    FileImportRequest = "CATALOG_FILE_IMPORT_REQUEST",
    FileImportError = "CATALOG_FILE_IMPORT_ERROR",
    LocalPublicationImportRequest = "CATALOG_LOCAL_PUBLICATION_IMPORT_REQUEST",
    LocalPublicationImportError = "CATALOG_LOCAL_PUBLICATION_IMPORT_ERROR",
    LocalPublicationImportSuccess = "CATALOG_LOCAL_PUBLICATION_IMPORT_SUCCESS",
    LocalLCPImportRequest = "CATALOG_LOCAL_LCP_IMPORT_REQUEST",
    LocalLCPImportError = "CATALOG_LOCAL_LCP_IMPORT_ERROR",
    LocalLCPImportSuccess = "CATALOG_LOCAL_LCP_IMPORT_SUCCESS",
    PublicationRemoveRequest = "CATALOG_PUBLICATION_REMOVE_REQUEST",
    PublicationRemoveError = "CATALOG_PUBLICATION_REMOVE_ERROR",
    PublicationRemoveSuccess = "CATALOG_PUBLICATION_REMOVE_SUCCESS",
    PublicationAddSuccess = "CATALOG_PUBLICATION_ADD_SUCCESS",
}

export function set(publications: Publication[]): Action {
    return {
        type: ActionType.SetRequest,
        payload: {
            publications,
        },
    };
}

/**
 * Import file (lcpl or epub) from a local path
 * @param path Local path of file
 */
export function importFile(path: string): Action {
    return {
        type: ActionType.FileImportRequest,
        payload: {
            path,
        },
    };
}

/**
 * Import publication from a local path
 * @param path Local path of publication
 */
export function importLocalPublication(path: string): Action {
    return {
        type: ActionType.LocalPublicationImportRequest,
        payload: {
            path,
        },
    };
}

export function importLocalLCPFile(path: string): Action {
    return {
        type: ActionType.LocalLCPImportRequest,
        payload: {
            path,
        },
    };
}

export function removePublication(publication: Publication): Action {
    return {
        type: ActionType.PublicationRemoveRequest,
        payload: {
            publication,
        },
    };
}
