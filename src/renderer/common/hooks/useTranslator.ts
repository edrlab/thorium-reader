// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { useSelector } from "./useSelector";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { I18nFunction } from "readium-desktop/common/services/translator";
import { TranslatorContext } from "../translator.context";

export function useTranslator(): [I18nFunction] {

    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    React.useEffect(() => {
        forceUpdate();
    }, [locale]);

    const translator = React.useContext(TranslatorContext);
    return [translator.__];
}
