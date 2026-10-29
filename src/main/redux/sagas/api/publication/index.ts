// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { withErrorNotification } from "../withErrorNotification";
import { IPublicationApi } from "readium-desktop/common/api/interface/publicationApi.interface";

import { deletePublication } from "./delete";
import { exportPublication } from "./export";
import { findAll } from "./findAll";
import { findByTag } from "./findByTag";
import { getPublication } from "./getPublication";
import { importFromFs, importFromLink, importFromString } from "./import";
import { findAllRecoverable, recover } from "./recovery";
import { search, searchEqTitle } from "./search";
import { selectFiles } from "./selectFiles";
import { updateTags } from "./updateTags";
import { SagaGenerator } from "typed-redux-saga";

export const publicationApi: IPublicationApi = {
    findAll,
    get: getPublication,
    delete: withErrorNotification(deletePublication, "message.notifications.deleteFailed"),
    findByTag,
    search,
    exportPublication: withErrorNotification(exportPublication, "message.notifications.exportFailed"),
    importFromFs,
    selectFiles: withErrorNotification(selectFiles, "message.notifications.openFileFailed"),
    importFromLink,
    importFromString: withErrorNotification(importFromString, "message.notifications.openFileFailed", true,
        (_manifest, _open, baseFileUrl) => baseFileUrl),
    searchEqTitle,
    updateTags: withErrorNotification(updateTags, "message.notifications.tagsFailed"),

    // used as a fake refresh signal for components subscribing around publication/findAll
    findAllRefresh: function* (): SagaGenerator<void> { },
    findAllRecoverable,
    recover: withErrorNotification(recover, "message.storage.recovery.failure"),
};
