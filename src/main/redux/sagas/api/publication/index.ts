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
import { getAllTags } from "./getAllTags";
import { getPublication } from "./getPublication";
import { importFromFs, importFromLink, importFromString } from "./import";
import { search, searchEqTitle } from "./search";
import { updateTags } from "./updateTags";

export const publicationApi: IPublicationApi = {
    findAll,
    get: getPublication,
    delete: deletePublication,
    findByTag,
    updateTags,
    getAllTags,
    search,
    exportPublication,
    importFromFs,
    importFromLink,
    importFromString,
    searchEqTitle,
};
