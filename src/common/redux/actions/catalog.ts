// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Publication } from "readium-desktop/common/models/publication";
import { Action } from "readium-desktop/common/models/redux";

export enum ActionType {
    FileImportRequest = "CATALOG_FILE_IMPORT_REQUEST",
    FileImportError = "CATALOG_FILE_IMPORT_ERROR",
    FileImportSuccess = "CATALOG_FILE_IMPORT_SUCCESS",
    PublicationRemoveRequest = "CATALOG_PUBLICATION_REMOVE_REQUEST",
    PublicationRemoveError = "CATALOG_PUBLICATION_REMOVE_ERROR",
    PublicationRemoveSuccess = "CATALOG_PUBLICATION_REMOVE_SUCCESS",
    PublicationAddSuccess = "CATALOG_PUBLICATION_ADD_SUCCESS",
    TagListRequest = "TAG_LIST_REQUEST",
    TagListSuccess = "TAG_LIST_SUCCESS",
    TagListError = "TAG_LIST_ERROR",
    TagAddRequest = "TAG_ADD_REQUEST",
    TagAddSuccess = "TAG_ADD_SUCCESS",
    TagAddError = "TAG_ADD_ERROR",
    TagRemoveRequest = "TAG_REMOVE_REQUEST",
    TagRemoveSuccess = "TAG_REMOVE_SUCCESS",
    TagRemoveError = "TAG_REMOVE_ERROR",
    TagEditRequest = "TAG_EDIT_REQUEST",
    TagEditSuccess = "TAG_EDIT_SUCCESS",
    TagEditError = "TAG_EDIT_ERROR",
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

export function removePublication(publication: Publication): Action {
    return {
        type: ActionType.PublicationRemoveRequest,
        payload: {
            publication,
        },
    };
}

export function tagListRequest(): Action {
    return {
        type: ActionType.TagListRequest,
    };
}

export function addTagRequest(name: string): Action {
    return {
        type: ActionType.TagAddRequest,
        payload: {
            name,
        },
    };
}

export function removeTagRequest(id: string): Action {
    return {
        type: ActionType.TagRemoveRequest,
        payload: {
            id,
        },
    };
}

export function editTagRequest(id: string, name: string): Action {
    return {
        type: ActionType.TagEditRequest,
        payload: {
            id,
            name,
        },
    };
}
