import * as React from "react";
import * as Select from "@radix-ui/react-select";

import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";

import SVG from "readium-desktop/renderer/common/components/SVG";
import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";
import * as SwatchesIcon from "readium-desktop/renderer/assets/icons/swatches-icon.svg";


const ReadingTheme = () => {
    const [ __ ] = useTranslator();

    return (
        <section>
            <div className={stylesGlobal.heading}>
                <h4>{__("reader.settings.theme.title")}</h4>
            </div>
            <Select.Root>
                <Select.Trigger className={stylesSettings.select_trigger}>
                    <div>
                    <Select.Icon className={stylesSettings.select_icon}><SVG ariaHidden={true} svg={SwatchesIcon} /></Select.Icon>
                        <Select.Value  />
                    </div>
                    <Select.Icon className={stylesSettings.select_icon}><SVG ariaHidden={true} svg={ChevronDown} /></Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                    <Select.Content className={stylesSettings.select_content} position="popper" sideOffset={10} sticky="always">
                        <Select.Viewport role="select">
                            <Select.Item 
                            value="neutral"
                            id="itemInner" 
                            className={stylesSettings.select_item}
                            >
                                <Select.ItemText>{__("reader.settings.theme.name.Neutral")}</Select.ItemText>
                                <Select.ItemIndicator className={stylesSettings.select_icon}>
                                    <SVG svg={DoneIcon} ariaHidden/>
                                </Select.ItemIndicator>
                            </Select.Item>
                            <Select.Item 
                            value="sepia"
                            id="itemInner2" 
                            className={stylesSettings.select_item}
                            >
                                <Select.ItemText>{__("reader.settings.theme.name.Sepia")}</Select.ItemText>
                                <Select.ItemIndicator className={stylesSettings.select_icon}>
                                    <SVG svg={DoneIcon} ariaHidden/>
                                </Select.ItemIndicator>
                            </Select.Item>
                            <Select.Item 
                            value="night"
                            id="itemInner3" 
                            className={stylesSettings.select_item}
                            >
                                <Select.ItemText>{__("reader.settings.theme.name.Night")}</Select.ItemText>
                                <Select.ItemIndicator className={stylesSettings.select_icon}>
                                    <SVG svg={DoneIcon} ariaHidden/>
                                </Select.ItemIndicator>
                            </Select.Item>
                        </Select.Viewport>
                    </Select.Content>
                    </Select.Portal>
            </Select.Root>
        </section>
    );
};


export default ReadingTheme;