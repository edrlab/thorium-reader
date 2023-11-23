import * as React from "react";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.css";
import fontList, { FONT_ID_DEFAULT, FONT_ID_VOID } from "readium-desktop/utils/fontList";
import optionsValues, { IReaderOptionsProps } from "../options-values";
import { Font } from "readium-desktop/common/models/font";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";


type ThandleSettingChange = IReaderOptionsProps["handleSettingChange"];

const TextContent = (props: any) => {
    const { readerConfig } = props;
    const [__] = useTranslator();

    let handleSettingChangeDebounced: ThandleSettingChange;

    // TODO: https://github.com/rBurgett/system-font-families
    const readiumCSSFontID = readerConfig.font;
    const fontListItem = fontList.find((f) => {
        return f.id === readiumCSSFontID && f.id !== FONT_ID_VOID;
    });
    const readiumCSSFontIDToSelect = fontListItem ?
        fontListItem.id : // readiumCSSFontID
        FONT_ID_VOID;
    const readiumCSSFontName = fontListItem ? fontListItem.label : readiumCSSFontID;
    const readiumCSSFontPreview = (readiumCSSFontName === FONT_ID_VOID || fontListItem?.id === FONT_ID_DEFAULT) ?
        " " : readiumCSSFontName;
    const fontFamily = fontListItem?.fontFamily ? fontListItem.fontFamily : `'${readiumCSSFontName}', serif`;

    // <output id={stylesReader.valeur_taille} className={stylesReader.out_of_screen}>14</output>
    return <>
        <div className={stylesReader.line_tab_content}>
            <div id="label_fontSize" className={stylesReader.subheading}>{__("reader.settings.fontSize")}</div>
            <div className={stylesReader.center_in_tab}>
                <span className={stylesReader.slider_marker} style={{ fontSize: "150%" }}>a</span>
                <input
                    type="range"
                    aria-labelledby="label_fontSize"
                    onChange={(e) => props.handleIndexChange(e, "fontSize")}
                    min={0}
                    max={optionsValues.fontSize.length - 1}
                    value={props.indexes.fontSize}
                    step={1}
                    aria-valuemin={0}
                    aria-valuemax={optionsValues.fontSize.length - 1}
                    aria-valuenow={props.indexes.fontSize}
                />
                <span className={stylesReader.slider_marker} style={{ fontSize: "250%" }}>a</span>

                <span className={stylesReader.reader_settings_value}>
                    {readerConfig.fontSize}
                </span>
            </div>
        </div>
        <div className={stylesReader.line_tab_content}>
            <div id="fontLabel" className={stylesReader.subheading}>{__("reader.settings.font")}</div>
            <div className={stylesReader.center_in_tab} style={{ flexDirection: "column" }}>
                <div style={{
                    display: "flex",
                    flexDirection: "row",
                    position: "relative",
                    textAlign: "center",
                    justifyContent: "center",
                    alignItems: "center",
                }}>
                    <select
                        title={__("reader.settings.font")}
                        style={{
                            width: fontListItem ? "fit-content" : "4em",
                        }}
                        onChange={(e) => {
                            props.handleSettingChange(e, "font");
                        }}
                        value={readiumCSSFontIDToSelect}
                    >
                        {fontList.map((font: Font, id: number) => {
                            return (
                                <option
                                    key={id}
                                    value={font.id}
                                >
                                    {font.label}
                                </option>
                            );
                        })}
                    </select>
                    {
                        !fontListItem &&
                        <input
                            style={{ width: "10em", marginLeft: "1em" }}
                            id="fontInput"
                            aria-labelledby="fontLabel"
                            type="text"
                            onChange={(e) => {
                                let val = e.target?.value ? e.target.value.trim() : null;
                                if (!val) { // includes empty string (falsy)
                                    val = undefined;
                                } else {
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
                                }
                                handleSettingChangeDebounced(
                                    undefined, // e
                                    "font",
                                    val);
                            }}
                            placeholder={readiumCSSFontPreview ?? __("reader.settings.font")}
                            alt={readiumCSSFontPreview ?? __("reader.settings.font")}
                        />
                    }
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
                    }}>{readiumCSSFontPreview}</span>
            </div>
        </div>
    </>;
};

export default TextContent;
