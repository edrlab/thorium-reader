// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IPublicationApi } from "readium-desktop/common/api/interface/publicationApi.interface";

import { deletePublication } from "./delete";
import { exportPublication } from "./export";
import { findAll } from "./findAll";
import { findByTag } from "./findByTag";
import { getPublication } from "./getPublication";
import { importFromFs, importFromLink, importFromString } from "./import";
import { search, searchEqTitle } from "./search";
import { updateTags } from "./updateTags";
import { SagaGenerator } from "typed-redux-saga";

export const publicationApi: IPublicationApi = {
    findAll,
    get: getPublication,
    delete: deletePublication,
    findByTag,
    search,
    exportPublication,
    importFromFs,
    importFromLink,
    importFromString,
    searchEqTitle,
    updateTags,

    // see readingFinished action : just used to refresh AllPublicationPage.tsx when set as finished
    readingFinishedRefresh: function* (): SagaGenerator<void> { },
};
