// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ABOUT_BOOK_TITLE_PREFIX } from "readium-desktop/common/constant";
import { PublicationView } from "readium-desktop/common/views/publication";
import { PublicationDocument } from "./db/document/publication";

export const aboutFiltered =
    (pubs: PublicationView[]) => pubs.filter(({ title }) => !title.startsWith(ABOUT_BOOK_TITLE_PREFIX));

export const aboutFilteredDocs =
    (pubs: PublicationDocument[]) => pubs.filter(({ title }) => !title.startsWith(ABOUT_BOOK_TITLE_PREFIX));
