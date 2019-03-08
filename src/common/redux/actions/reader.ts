// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Bookmark, Reader, ReaderConfig } from "readium-desktop/common/models/reader";
import { Action } from "readium-desktop/common/models/redux";
import { PublicationView } from "readium-desktop/common/views/publication";

export enum ActionType {
    OpenRequest = "READER_OPEN_REQUEST",
    OpenSuccess = "READER_OPEN_SUCCESS",
    OpenError = "READER_OPEN_ERROR",

    CloseRequest = "READER_CLOSE_REQUEST",
    CloseSuccess = "READER_CLOSE_SUCCESS",
    CloseError = "READER_CLOSE_ERROR",

    ConfigSetRequest = "READER_CONFIG_SET_REQUEST",
    ConfigSetSuccess = "READER_CONFIG_SET_SUCCESS",
    ConfigSetError = "READER_CONFIG_SET_ERROR",

    BookmarkSaveRequest = "READER_BOOKMARK_SAVE_REQUEST",
    BookmarkSaveSuccess = "READER_BOOKMARK_SAVE_SUCCESS",
    BookmarkSaveError = "READER_BOOKMARK_SAVE_ERROR",
}

export function open(publication: PublicationView): Action {
    return {
        type: ActionType.OpenRequest,
        payload: {
            publication,
        },
    };
}

export function close(reader: Reader): Action {
    return {
        type: ActionType.CloseRequest,
        payload: {
            close,
        },
    };
}

export function setConfig(config: ReaderConfig): Action {
    return {
        type: ActionType.ConfigSetRequest,
        payload: {
            config,
        },
    };
}

export function saveBookmark(bookmark: Bookmark) {
    return {
        type: ActionType.BookmarkSaveRequest,
        payload: {
            bookmark,
        },
    };
}
