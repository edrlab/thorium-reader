// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

/**
 * file: epub, mobi, jpeg
 */
export interface File {
    url: string; // Remote or local url
    ext: string; // Extension without the starting dot character
    contentType: string;
    size?: number; // In bytes
}
