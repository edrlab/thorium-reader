// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { i18nActions } from "readium-desktop/common/redux/actions/";
import { AvailableLanguages } from "readium-desktop/common/services/translator";
// import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";
// import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.css";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";

import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { TDispatch } from "readium-desktop/typings/redux";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";

// import SVG from "../../../common/components/SVG";
import * as Select from "@radix-ui/react-select";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as LanguageIcon from "readium-desktop/renderer/assets/icons/language.svg";
import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
// interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
// }

const SelectItem = React.forwardRef(({ children, ...props }: any, forwardedRef) => {
    return (
        <Select.Item {...props} id="itemInner" ref={forwardedRef}
        className={stylesSettings.select_item}>
            <Select.ItemText>{children}</Select.ItemText>
            <Select.ItemIndicator className={stylesSettings.select_icon}>
                <SVG svg={DoneIcon} ariaHidden/>
            </Select.ItemIndicator>
        </Select.Item>
    );
});

SelectItem.displayName = "SelectItem";

interface AvailableLanguages {
    en: string,
    fr: string,
    fi: string,
    de: string,
    es: string,
    nl: string,
    ja: string,
    ka: string,
    lt: string,
    "pt-BR": string,
    "pt-PT": string,
    "zh-CN": string, // "中文 - 中國"
    "zh-TW": string, // "中文 - 台湾"
    it: string,
    ru: string,
    ko: string,
    sv: string,
    ca: string,
    gl: string,
    eu: string,
    el: string,
    bg: string,
    hr: string,
}


const LanguageSettings = (props: any) => {
    const [ __ ] = useTranslator();
    const currentLanguage: keyof AvailableLanguages = props.locale;
    return (
            <section className={stylesSettings.settings_tab_container}>
                <div className={stylesGlobal.heading}>
                    <h4>{__("settings.language.languageChoice")}</h4>
                </div>
                <Select.Root onValueChange={(lang) => props.setLocale(lang)}>
                    <Select.Trigger  className={stylesSettings.select_trigger}>
                        <div>
                            <Select.Icon className={stylesSettings.select_icon}><SVG ariaHidden={true} svg={LanguageIcon} /></Select.Icon>
                            <Select.Value placeholder={AvailableLanguages[currentLanguage]} />
                        </div>
                        <Select.Icon className={stylesSettings.select_icon}><SVG ariaHidden={true} svg={ChevronDown} /></Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
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


const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => {
    return {
        locale: state.i18n.locale,
    };
};

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        setLocale: (locale: string) => dispatch(i18nActions.setLocale.build(locale)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(LanguageSettings));
