// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

export const acceptedExtension = (ext: string) =>
    /\.epub[3]?$/.test(ext) ||
    /\.audiobook$/.test(ext) ||
    /\.lpf$/.test(ext) ||
    ext === ".lcpl";

export const acceptedExtensionArray = [
    ".lcpl", ".epub", ".epub3", ".audiobook", ".lpf",
];
