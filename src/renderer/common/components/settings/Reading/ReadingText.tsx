import * as React from "react";

import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";

import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";
import fontList, { FONT_ID_DEFAULT, FONT_ID_VOID } from "readium-desktop/utils/fontList";

import SVG from "readium-desktop/renderer/common/components/SVG";
import * as TextAreaIcon from "readium-desktop/renderer/assets/icons/textarea-icon.svg";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useSaveConfig } from "./useSaveConfig";
import Creatable from "react-select/creatable";

// const SelectItem = React.forwardRef(({ children, ...props }: any, forwardedRef) => {
//     return (
//         <Select.Item {...props} id="itemInner" ref={forwardedRef}
//             className={stylesSettings.select_item}>
//             <Select.ItemText>{children}</Select.ItemText>
//             <Select.ItemIndicator className={stylesSettings.select_icon}>
//                 <SVG svg={DoneIcon} ariaHidden />
//             </Select.ItemIndicator>
//         </Select.Item>
//     );
// });


export const FontSize = () => {
    const [__] = useTranslator();
    const fontSize = useSelector((s: ICommonRootState) => s.reader.defaultConfig.fontSize);
    const fontSizeNbr = parseInt(fontSize, 10); // 75%

    const saveConfigDebounced = useSaveConfig();

    return (
        <div className={stylesSettings.settings_reading_text}>
            <section className={stylesSettings.label_fontSize}>
                <div className={stylesGlobal.heading}>
                    <h4>{__("reader.settings.fontSize")} ({fontSize})</h4>
                </div>
                <div className={stylesSettings.size_range}>
                    <p>A-</p>
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
                    <p>A+</p>
                </div>
            </section>
        </div>
    );
};



export const FontFamily = () => {
    const [__] = useTranslator();
    const readiumCSSFontID = useSelector((s: ICommonRootState) => s.reader.defaultConfig.font);
    const fontListItem = fontList.find((f) => {
        return f.id === readiumCSSFontID && f.id !== FONT_ID_VOID;
    });

    const readiumCSSFontIDToSelect = fontListItem ?
        fontListItem.id : // readiumCSSFontID
        FONT_ID_VOID;
    const readiumCSSFontLabelToSelect = fontListItem ?
        fontListItem.label :
        "...";
    const readiumCSSFontName = fontListItem ? fontListItem.label : readiumCSSFontID;
    const readiumCSSFontPreview = (readiumCSSFontName === FONT_ID_VOID || fontListItem?.id === FONT_ID_DEFAULT) ?
        " " : readiumCSSFontName;
    const fontFamily = fontListItem?.fontFamily ? fontListItem.fontFamily : `'${readiumCSSFontName}', serif`;

    const saveConfigDebounced = useSaveConfig();

    return (
        <section>
            <div className={stylesGlobal.heading}>
                <h4>{__("reader.settings.font")}</h4>
            </div>
            {/* <Select.Root onValueChange={(value) => saveConfigDebounced({font : value})}>
                    <Select.Trigger className={stylesSettings.select_trigger} >
                        <div>
                            <Select.Icon className={stylesSettings.select_icon}><SVG ariaHidden={true} svg={TextAreaIcon} /></Select.Icon>
                            <Select.Value placeholder={readiumCSSFontIDToSelect} />
                        </div>
                        <Select.Icon className={stylesSettings.select_icon}><SVG ariaHidden={true} svg={ChevronDown} /></Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                        <Select.Content className={stylesSettings.select_content} position="popper" sideOffset={10} sticky="always">
                            <Select.Viewport role="select">
                            {fontList.map((font: Font, id: number) =>
                                <SelectItem value={font.id} key={id}>{font.label}</SelectItem>,
                            )}
                            <input type="text" />
                            </Select.Viewport>
                        </Select.Content>
                        </Select.Portal>
                </Select.Root> */}
            <div className={stylesSettings.settings_font_container}>
                <SVG ariaHidden={true} svg={TextAreaIcon} />
                <Creatable
                    isClearable
                    className={stylesSettings.settings_font_selection}
                    defaultValue={({ value: readiumCSSFontIDToSelect, label: readiumCSSFontLabelToSelect })}
                    onChange={(obj) => {
                        if (!obj?.value) return;
                        let val = obj.value.trim();
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
                    }}
                    options={fontList.map((fontItem) => ({ value: fontItem.id, label: fontItem.label }))}
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
