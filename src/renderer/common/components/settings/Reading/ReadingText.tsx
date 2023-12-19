import * as React from "react";

import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";

import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";
import fontList, { FONT_ID_DEFAULT, FONT_ID_VOID } from "readium-desktop/utils/fontList";

import SVG from "readium-desktop/renderer/common/components/SVG";
import * as TextAreaIcon from "readium-desktop/renderer/assets/icons/textarea-icon.svg";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useSaveConfig } from "./useSaveConfig";
import Creatable from "react-select/creatable";

export const FontSize = () => {
    const [__] = useTranslator();
    const fontSize = useSelector((s: ICommonRootState) => s.reader.defaultConfig.fontSize);
    const fontSizeNbr = parseInt(fontSize, 10); // 75%

    const saveConfigDebounced = useSaveConfig();

    return (
        <div className={stylesSettings.settings_reading_text}>
            <section className={stylesSettings.section}>
                <div>
                    <h4>{__("reader.settings.fontSize")} ({fontSize})</h4>
                </div>
                <div className={stylesSettings.size_range}>
                    <p className={stylesSettings.scale_button}>-</p>
                    <input
                        type="range"
                        aria-labelledby="label_fontSize"
                        min={75}
                        max={250}
                        step={12.5}
                        aria-valuemin={0}
                        defaultValue={fontSizeNbr}
                        onChange={(e) => saveConfigDebounced({ fontSize: (e.target?.value || `${readerConfigInitialState.fontSize}`) + "%" })}
                    />
                    <p className={stylesSettings.scale_button}>+</p>
                </div>
            </section>
        </div>
    );
};

export const FontFamily = () => {
    const [__] = useTranslator();
    const readiumCSSFontID = useSelector((s: ICommonRootState) => s.reader.defaultConfig.font);

    const options = fontList.map((fontItem) => ({ value: fontItem.id, label: fontItem.label }));
    const optionsItem = options.find((f) => f.value === readiumCSSFontID) || options[options.length-1];
    const fontListItem = fontList.find((f) => {
        return f.id === readiumCSSFontID && f.id !== FONT_ID_VOID;
    });

    // const readiumCSSFontIDToSelect = fontListItem ?
    //     fontListItem.id : // readiumCSSFontID
    //     FONT_ID_VOID;
    // const readiumCSSFontLabelToSelect = fontListItem ?
    //     fontListItem.label :
    //     "...";
    const readiumCSSFontName = fontListItem ? fontListItem.label : readiumCSSFontID;
    const readiumCSSFontPreview = (readiumCSSFontName === FONT_ID_VOID || fontListItem?.id === FONT_ID_DEFAULT) ?
        " " : readiumCSSFontName;
    const fontFamily = fontListItem?.fontFamily ? fontListItem.fontFamily : `'${readiumCSSFontName}', serif`;

    const saveConfigDebounced = useSaveConfig();

    const saveFont = (value: string) => {

        let val = value.trim();
        // a"b:c    ;d;<e>f'g&h
        val = val.
            replace(/\t/g, "").
            replace(/"/g, "").
            replace(/:/g, "").
            replace(/'/g, "").
            replace(/;/g, "").
            replace(/</g, "").
            replace(/>/g, "").
            replace(/\\/g, "").
            replace(/\//g, "").
            replace(/&/g, "").
            replace(/\n/g, " ").
            replace(/\s\s+/g, " ");
        if (!val) { // includes empty string (falsy)
            val = undefined;
        }
        saveConfigDebounced({ font: val });
    }

    return (
        <section className={stylesSettings.section}>
            <div>
                <h4>{__("reader.settings.font")}</h4>
            </div>
            <div className={stylesSettings.settings_font_container}>
                <SVG ariaHidden={true} svg={TextAreaIcon} />
                <Creatable
                    isClearable
                    className={stylesSettings.settings_font_selection}
                    styles={{
                        control: () => ({}),
                    }}
                    classNamePrefix={stylesSettings.settings_font_selection}
                    formatCreateLabel={(input) => <p>{input}</p>}
                    defaultValue={optionsItem}
                    defaultInputValue={readiumCSSFontName}
                    onInputChange={(value, action) => {
                        console.log(value, action);
                        if (action.action === "input-change") {
                            saveFont(value);
                        }
                    }}
                    onChange={(obj) => {
                        if (!obj?.value) return;
                        saveFont(obj.value);
                    }}
                    options={options}
                />
            </div>
            <span
                aria-hidden
                style={{
                    fontSize: "1.4em",
                    lineHeight: "1.2em",
                    display: "block",
                    marginTop: "0.84em",
                    marginBottom: "0.5em",
                    fontFamily,
                }}>{readiumCSSFontPreview}
            </span>
        </section>
    );
};
