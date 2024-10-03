// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ReaderConfigPublisher } from "readium-desktop/common/models/reader";
import { shallowEqual } from "readium-desktop/utils/shallowEqual";

export function comparePublisherReaderConfig(a: Partial<ReaderConfigPublisher>, b: Partial<ReaderConfigPublisher>) {

    const objectA: ReaderConfigPublisher = {
                    font: a.font,
                    fontSize: a.fontSize,
                    pageMargins: a.pageMargins,
                    wordSpacing: a.wordSpacing,
                    letterSpacing: a.letterSpacing,
                    paraSpacing: a.paraSpacing,
                    lineHeight: a.lineHeight,
                };

    const objectB: ReaderConfigPublisher = {
                    font: b.font,
                    fontSize: b.fontSize,
                    pageMargins: b.pageMargins,
                    wordSpacing: b.wordSpacing,
                    letterSpacing: b.letterSpacing,
                    paraSpacing: b.paraSpacing,
                    lineHeight: b.lineHeight,
                };


    return shallowEqual(objectA, objectB);
}
