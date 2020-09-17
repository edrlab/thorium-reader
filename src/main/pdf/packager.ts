// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as pdfjs from "pdfjs-dist";

// Logger
const debug = debug_("readium-desktop:main/pdf/packager");

//
// API
//
export async function pdfPackager(pdfPath: string): Promise<string> {

    const doc = await pdfjs.getDocument(pdfPath).promise;
    const metadata = await doc.getMetadata();
    const stats = await doc.getStats();

    debug("number of pages", doc.numPages);
    debug("stats", stats);
    debug("metadata info", metadata.info);
    debug("metadata", metadata.metadata.getAll());

    return undefined;
}
