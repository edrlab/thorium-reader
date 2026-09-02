// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { availableLanguages } from "readium-desktop/common/services/translator";
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { i18nActions } from "readium-desktop/common/redux/actions";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import * as LanguageIcon from "readium-desktop/renderer/assets/icons/language.svg";
import { logAppSettingModified } from "./analytics";

const LanguageSettings: React.FC<{}> = () => {
    const [__] = useTranslator();
    // const locale = useSelector((state: IRendererCommonRootState) => state.i18n.locale);
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    // const isRTL = langStringIsRTL(locale);

    const currentLanguageISO = locale as keyof typeof availableLanguages;
    const currentLanguageString = availableLanguages[currentLanguageISO];
    const dispatch = useDispatch();
    const [options] = React.useState(() => (Object.entries(availableLanguages) as Array<[keyof typeof availableLanguages, string]>)
        .sort()
        .map<{ id: number, name: string, iso: keyof typeof availableLanguages }>(
            ([k, v], i) => ({ id: i, name: v, iso: k }),
        ));
    const setLang = (localeSelected: React.Key) => {

        if (typeof localeSelected !== "number") return;
        const obj = options.find(({id}) => id === localeSelected);
        if (!obj || obj.iso === currentLanguageISO) return;
        dispatch(i18nActions.setLocale.build(obj.iso));
        logAppSettingModified("language", obj.iso);
    };
    const selectedKey = options.find(({name}) => name === currentLanguageString);
    return (
        <ComboBox label={__("settings.language.languageChoice")} defaultItems={options} defaultSelectedKey={selectedKey?.id} onSelectionChange={setLang} svg={LanguageIcon} style={{borderBottom: "2px solid var(--color-gray-50"}}>
            {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
        </ComboBox>
    );
};

export default LanguageSettings;
