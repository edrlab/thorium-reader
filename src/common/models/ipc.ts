// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Catalog } from "./catalog";
import { Download } from "./download";
import { Publication } from "./publication";

interface LibraryImportMessage {
    paths: string[]; // List of files to import
}

interface UIMessage {
    message: string;
}

export interface UrlMessage {
    url: string;
}

export interface CatalogMessage {
    catalog: Catalog;
}

export interface PublicationMessage {
    publication: Publication;
}

export interface DownloadMessage {
    download: Download;
}

export interface FilesMessage {
    paths?: string[];
    identifier?: string;
}
