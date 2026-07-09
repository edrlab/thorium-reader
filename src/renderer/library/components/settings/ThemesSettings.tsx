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
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { themeActions } from "readium-desktop/common/redux/actions";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { TTheme } from "readium-desktop/common/redux/states/theme";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";
import * as BrushIcon from "readium-desktop/renderer/assets/icons/paintbrush-icon.svg";

const Themes = () => {
    const [__] = useTranslator();
    // const locale = useSelector((state: IRendererCommonRootState) => state.i18n.locale);
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const isRTL = langStringIsRTL(locale);
    const dispatch = useDispatch();
    const theme = useSelector((s: ICommonRootState) => s.theme);
    const options: Array<{id: number, value: TTheme, name: string}> = [
        {id: 1, value: "dark", name: __("settings.theme.dark")},
        {id: 2, value: "light", name: __("settings.theme.light")},
        {id: 3, value: "system", name: __("settings.theme.auto")},
    ];

    const setTheme = (themeSelected: React.Key) => {

        if (typeof themeSelected !== "number") return;
        const { value: themeChosen } = options.find(({ id }) => id === themeSelected) || {};
        document.body.setAttribute("data-theme", themeChosen);
        dispatch(themeActions.setTheme.build(themeChosen));
    };
    const selectedKey = options.find(({ value }) => value === theme.name);

    return (
        <div>
            <ComboBox label={__("settings.theme.title")} items={options} selectedKey={selectedKey?.id} onSelectionChange={setTheme} svg={BrushIcon}>
                {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
            </ComboBox>
            {theme.name === "system" ? (
                <div className={stylesSettings.session_text}>
                    <SVG ariaHidden svg={InfoIcon} />
                    <p dir={isRTL ? "rtl" : "ltr"}>{__("settings.theme.description")}</p>
                </div>
            ) : (
                <></>
            )}
        </div>
    );
};

export default Themes;
