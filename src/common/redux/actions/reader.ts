// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export enum ActionType {
    OpenError = "READER_OPEN_ERROR",

    ModeSetSuccess = "READER_MODE_SET_SUCCESS",
    ModeSetError = "READER_MODE_SET_ERROR",

    ConfigSetError = "READER_CONFIG_SET_ERROR",

    BookmarkSaveRequest = "READER_BOOKMARK_SAVE_REQUEST",
    BookmarkSaveSuccess = "READER_BOOKMARK_SAVE_SUCCESS",
    BookmarkSaveError = "READER_BOOKMARK_SAVE_ERROR",
}
