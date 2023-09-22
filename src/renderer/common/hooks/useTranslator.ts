// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Translator } from "readium-desktop/common/services/translator";
import { TranslatorContext } from "readium-desktop/renderer/common/translator.context";

export function useTranslator(): [typeof Translator.prototype.translate, Translator] {

    const translator = React.useContext(TranslatorContext);
    const { translate: __ } = translator;

    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    React.useEffect(() => {
        const handleLocaleChange = () => {
            forceUpdate();
        };
        return translator.subscribe(handleLocaleChange);
    }, [translator.subscribe]);

    return [__, translator];
}
