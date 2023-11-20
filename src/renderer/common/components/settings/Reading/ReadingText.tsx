import * as React from "react";
import * as Select from "@radix-ui/react-select";

import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";

import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";
import fontList, { FONT_ID_DEFAULT, FONT_ID_VOID } from "readium-desktop/utils/fontList";
import { Font } from "readium-desktop/common/models/font";

import SVG from "readium-desktop/renderer/common/components/SVG";
import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";
import * as TextAreaIcon from "readium-desktop/renderer/assets/icons/textarea-icon.svg";

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


const ReadingText = () => {
    const [__] = useTranslator();
    // const fontSize = React.useState((s: any) => s.reader.defaultConfig.fontSize);

    const readiumCSSFontID = readerConfigInitialState.font;
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

    return (
        <div className={stylesSettings.settings_reading_text}>
            <section className={stylesSettings.label_fontSize}>
                <div className={stylesGlobal.heading}>
                    <h4>{__("reader.settings.fontSize")}
                    {/* ({fontSize})*/}</h4> 
                </div>
                <div className={stylesSettings.size_range}>
                    <p>A-</p>
                        <input
                            type="range"
                            aria-labelledby="label_fontSize"
                            min={0}
                            step={1}
                            aria-valuemin={0}
                            //onChange=(() => //dispatch action setDefaultConfig)
                        />
                    <p>A+</p>
                </div>
            </section>

            <section>
                <div className={stylesGlobal.heading}>
                    <h4>{__("reader.settings.font")}</h4>
                </div>
                <Select.Root>
                    <Select.Trigger className={stylesSettings.select_trigger}>
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
                            </Select.Viewport>
                        </Select.Content>
                        </Select.Portal>
                </Select.Root>
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
        </div>
    )
}

export default ReadingText;
