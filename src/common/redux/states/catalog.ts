// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Tag } from "readium-desktop/common/models/tag";

// import { Publication } from "readium-desktop/common/models/publication";

export interface CatalogState {

    // TODO unused?
    // publications: Publication[];

    tagList: Tag[];
}
