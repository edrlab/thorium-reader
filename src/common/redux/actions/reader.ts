// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Reader } from "readium-desktop/common/models/reader";

export enum ActionType {
    OpenSuccess = "READER_OPEN_SUCCESS",
    OpenError = "READER_OPEN_ERROR",

    CloseSuccess = "READER_CLOSE_SUCCESS",
    CloseError = "READER_CLOSE_ERROR",

    CloseFromPublicationSuccess = "READER_FROM_PUBLICATION_CLOSE_SUCCESS",
    CloseFromPublicationError = "READER_FROM_PUBLICATION_CLOSE_ERROR",

    ModeSetSuccess = "READER_MODE_SET_SUCCESS",
    ModeSetError = "READER_MODE_SET_ERROR",

    ConfigSetError = "READER_CONFIG_SET_ERROR",

    BookmarkSaveRequest = "READER_BOOKMARK_SAVE_REQUEST",
    BookmarkSaveSuccess = "READER_BOOKMARK_SAVE_SUCCESS",
    BookmarkSaveError = "READER_BOOKMARK_SAVE_ERROR",
}

export interface ActionPayloadReaderMain {
    reader: Reader;
}
