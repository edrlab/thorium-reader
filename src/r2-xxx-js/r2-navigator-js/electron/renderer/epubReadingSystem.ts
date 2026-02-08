// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { INameVersion } from "./webview/epubReadingSystem";

let _epubReadingSystemNameVersion: INameVersion = { name: "Readium2", version: "0.0.0" };

export function setEpubReadingSystemInfo(nv: INameVersion) {
    _epubReadingSystemNameVersion = nv;
}
export function getEpubReadingSystemInfo(): INameVersion {
    return _epubReadingSystemNameVersion;
}
