// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { i18nActions } from "readium-desktop/common/redux/actions/";
import { AvailableLanguages } from "readium-desktop/common/services/translator";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as Select from "@radix-ui/react-select";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as LanguageIcon from "readium-desktop/renderer/assets/icons/language.svg";
import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";
import { useSelector } from "../../hooks/useSelector";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import { useDispatch } from "../../hooks/useDispatch";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";

const SelectItem = React.forwardRef(({ children, ...props }: any, forwardedRef) => {
    return (
        <Select.Item {...props} id="itemInner" ref={forwardedRef}
            className={stylesSettings.select_item}>
            <Select.ItemText>{children}</Select.ItemText>
            <Select.ItemIndicator className={stylesSettings.select_icon}>
                <SVG svg={DoneIcon} ariaHidden />
            </Select.ItemIndicator>
        </Select.Item>
    );
});

SelectItem.displayName = "SelectItem";

const LanguageSettings: React.FC<{}> = () => {
    const [ __ ] = useTranslator();
    const locale = useSelector((state: IRendererCommonRootState) => state.i18n.locale);
    const dispatch = useDispatch();
    const currentLanguage = locale as keyof typeof AvailableLanguages;
    const appOverlayElement = React.useMemo(() => document.getElementById("app-overlay"), []);
    return (
            <section className={stylesSettings.settings_tab_container} style={{position: "relative"}}>
                <div className={stylesGlobal.heading}>
                    <h4>{__("settings.language.languageChoice")}</h4>
                </div>
                <Select.Root onValueChange={(localeSelected) => dispatch(i18nActions.setLocale.build(localeSelected))}>
                    <Select.Trigger className={stylesSettings.select_trigger}>
                        <div>
                            <Select.Icon className={stylesSettings.select_icon}><SVG ariaHidden={true} svg={LanguageIcon} /></Select.Icon>
                            <Select.Value placeholder={AvailableLanguages[currentLanguage]} />
                        </div>
                        <Select.Icon className={stylesSettings.select_icon}><SVG ariaHidden={true} svg={ChevronDown} /></Select.Icon>
                    </Select.Trigger>
                    <Select.Portal container={appOverlayElement}>
                        <Select.Content className={stylesSettings.select_content} position="popper" sideOffset={10} sticky="always">
                            <Select.Viewport role="select">
                            { ObjectKeys(AvailableLanguages).map((lang, i) =>
                                <SelectItem value={lang} key={i}>{ AvailableLanguages[lang] }</SelectItem>,
                            )}
                            </Select.Viewport>
                        </Select.Content>
                    </Select.Portal>
                </Select.Root>
            </section>
    );
};

export default LanguageSettings;
