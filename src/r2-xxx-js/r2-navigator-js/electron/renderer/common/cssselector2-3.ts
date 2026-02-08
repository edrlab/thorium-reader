// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";

import { uniqueCssSelector as uniqueCssSelector2 } from "./cssselector2";
import { uniqueCssSelector as uniqueCssSelector3, Options } from "./cssselector3";


const debug = debug_("r2:navigator#electron/renderer/common/cssselector");

const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

export function uniqueCssSelector(input: Element, doc: Document, options?: Partial<Options>): string {
    const res3 = uniqueCssSelector3(input, doc, options);
    if (IS_DEV) {
        const res2 = uniqueCssSelector2(input, doc, options);
        if (res2 !== res3) {
            debug(":::: CSS SELECTOR DIFF: ", res2, res3);
        }
    }
    return res3;
}
