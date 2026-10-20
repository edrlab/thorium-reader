// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";

/** Keep the application chrome language separate from individual publication languages. */
export const DocumentLanguage: React.FC = () => {
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    React.useLayoutEffect(() => {
        document.documentElement.lang = locale || "en";
    }, [locale]);
    return undefined;
};
