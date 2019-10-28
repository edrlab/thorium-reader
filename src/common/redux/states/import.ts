// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export interface ImportState {
    publication: ImportOpdsPublication;
    downloadSample: boolean;
}

// FIXME : SHOULD BE linked with IOpdsPublicationView (undefined)

export interface ImportOpdsPublication {
    url: string;
    base64OpdsPublication: string;
    title: string;
    tags: string[];
}
