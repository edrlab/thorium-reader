// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as React from "react";
import { cssFontFamilyName } from "@r2-navigator-js/electron/common/css-font-family";
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { FONT_LIST, FONT_LIST_WITH_JA } from "readium-desktop/utils/fontList";
import { usePublisherReaderConfig, useSavePublisherReaderConfig } from "readium-desktop/renderer/common/hooks/useReaderConfig";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { trimNormaliseWhitespaceAndCollapse } from "readium-desktop/common/string";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";

export const FontFamily = ({ overridePublisherDefault }: { overridePublisherDefault: boolean }) => {
    const [__] = useTranslator();

    const font = usePublisherReaderConfig("font");
    const set = useSavePublisherReaderConfig();

    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const fontList = locale === "ja" ? FONT_LIST_WITH_JA : FONT_LIST;
    const options = fontList.map((fontItem, id) => ({ id, value: fontItem.id, name: fontItem.label, fontFamily: fontItem.fontFamily }));
    // if (fontList.findIndex((v) => v.id === font) < 0) {
    //     options.push({
    //         id: fontList.length,
    //         value: font,
    //         name: font,
    //         fontFamily: `${font}, Consolas, monospace`,
    //     });
    // }

    const selected = options.find((v) => v.value === font) || {
        id: fontList.length,
        value: font,
        name: font,
        fontFamily: `${cssFontFamilyName(font)}, Consolas, monospace`,
    };

    const defaultkey = selected.id;
    const fontFamily = selected.fontFamily;
    const fontName = selected.name;

    const [inputval, setInputval] = React.useState(fontName);

    React.useEffect(() => {
        setInputval(fontName);
    }, [fontName]);

    const saveFont = (value: string) => {
        let val = value.trim();
        // a"b:c    ;d;<e>f'g&h
        val = trimNormaliseWhitespaceAndCollapse(
            val.
            replace(/"/g, "").
            replace(/:/g, "").
            replace(/'/g, "").
            replace(/;/g, "").
            replace(/</g, "").
            replace(/>/g, "").
            replace(/\\/g, "").
            replace(/\//g, "").
            replace(/&/g, ""),
        );
        if (!val) { // includes empty string (falsy)
            val = undefined;
        }
        if (val) {
            set({ font: val });
        }
    };


    return (
        <div>
            <ComboBox className={stylesSettings.range_size_container} label="Family" defaultItems={options} selectedKey={defaultkey} placeholder={inputval} isDisabled={!overridePublisherDefault}
                onSelectionChange={
                    (key: React.Key) => {
                        // console.log("@@@@@");
                        // console.log("@@@@@");
                        // console.log(key);
                        // console.log("@@@@@");
                        // console.log("@@@@@");

                        if (key === null) {
                            const notFound = !options.find((v) => v.name === inputval);
                            // console.log("fontList save notFound=", notFound);
                            if (notFound) saveFont(inputval);
                        } else {
                            const found = options.find((v) => v.id === key);
                            // console.log("fontList save ",found.value);
                            saveFont(found.value);
                        }
                    }}
                allowsCustomValue
                onInputChange={(v) => setInputval(v)}
                labelInfos={<div className={stylesSettings.session_text} style={{ margin: "0", backgroundColor: "var(--color-gray-100)" }}>
                {
                    options.find((v) => v.name === inputval) ?
                    <p>{__("reader.settings.infoCustomFont")}</p>
                    :
                    <p>{__("reader.settings.customFontSelected")}</p>
                }
            </div>}
            >
                {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
            </ComboBox>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "space-between", padding: "10px 20px 5px 0" }}>
                <label style={{ flexGrow: 1, margin: "0" }}>{__("reader.settings.preview")}:</label>
                {fontFamily ?
                <span
                    aria-hidden
                    style={{
                        fontSize: "1.4em",
                        lineHeight: "1.2em",
                        display: "block",
                        fontFamily,
                        width: "160px",
                    }}>{fontName}
                </span>
                : <></>
                }
            </div>
        </div>
    );
};
