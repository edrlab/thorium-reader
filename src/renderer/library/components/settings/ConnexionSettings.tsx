// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import { langStringIsRTL } from "@r2-shared-js/_utils/language-string";
import * as React from "react";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { authActions } from "readium-desktop/common/redux/actions";
import * as BinIcon from "readium-desktop/renderer/assets/icons/trash-icon.svg";

export const Auth = () => {
    const [__] = useTranslator();
    // const locale = useSelector((state: IRendererCommonRootState) => state.i18n.locale);
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const isRTL = langStringIsRTL(locale);
    const dispatch = useDispatch();

    return (
        <button
            className={stylesSettings.btn_primary}
            onClick={() => dispatch(authActions.wipeData.build())}>
            <SVG ariaHidden svg={BinIcon} />
            <p dir={isRTL ? "rtl" : "ltr"}>{__("settings.auth.wipeData")}</p>
        </button>
    );
};

const ConnectionSettings: React.FC<{}> = () => {
    const [__] = useTranslator();
    // const locale = useSelector((state: IRendererCommonRootState) => state.i18n.locale);
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const isRTL = langStringIsRTL(locale);
    return (
        <section className={stylesSettings.section} style={{ position: "relative" }}>
            <h3 dir={isRTL ? "rtl" : "ltr"}>{__("settings.auth.title")}</h3>
            <div className={stylesSettings.session_text}>
                <SVG ariaHidden svg={InfoIcon} />
                <p dir={isRTL ? "rtl" : "ltr"}>{__("settings.auth.help")}</p>
            </div>
            <Auth />
        </section>
    );
};

export default ConnectionSettings;
