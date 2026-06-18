// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import validatorIsURL, { type IsURLOptions } from "validator/lib/isURL";
import { _ISURL_REQUIRE_TLD_FALSE } from "readium-desktop/preprocessor-directives";

const requireTldFalseOptions: IsURLOptions = {
    require_tld: false,
};

export default function isURL(str: string, options?: IsURLOptions): boolean {

    if (!_ISURL_REQUIRE_TLD_FALSE) {
        return validatorIsURL(str, options);
    }

    return validatorIsURL(
        str,
        options ? {...options, require_tld: false} : requireTldFalseOptions,
    );
}
