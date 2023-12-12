import * as React from "react";
import * as Select from "@radix-ui/react-select";

import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";

import SVG from "readium-desktop/renderer/common/components/SVG";
import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";
import * as SwatchesIcon from "readium-desktop/renderer/assets/icons/swatches-icon.svg";
import { useSaveConfig } from "./useSaveConfig";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";


const ReadingTheme = () => {
    const [__] = useTranslator();
    const saveConfigDebounced = useSaveConfig();
    const nightTheme = useSelector((s: ICommonRootState) => s.reader.defaultConfig.night);
    const sepiaTheme = useSelector((s: ICommonRootState) => s.reader.defaultConfig.sepia);
    let defaultTheme;
    switch (true) {
        case nightTheme:
            defaultTheme = __("reader.settings.theme.name.Night");
            break;
        case sepiaTheme:
            defaultTheme = __("reader.settings.theme.name.Sepia");
            break;
        default:
            defaultTheme = __("reader.settings.theme.name.Neutral");
    }

    const themeOptions = [
        {
            title: `${__("reader.settings.theme.name.Neutral")}`,
            value: "neutral",
        },
        {
            title: `${__("reader.settings.theme.name.Sepia")}`,
            value: "sepia",
        },
        {
            title: `${__("reader.settings.theme.name.Night")}`,
            value: "night",
        },
    ];



    const changeTheme = (value: string) => {
        switch (value) {
            case "night":
                saveConfigDebounced({ night: true, sepia: false });
                break;
            case "sepia":
                saveConfigDebounced({ night: false, sepia: true });
                break;
            default:
                saveConfigDebounced({ night: false, sepia: false });
        }
    };

    return (
        <section className={stylesSettings.section}>
            <div>
                <h4>{__("reader.settings.theme.title")}</h4>
            </div>
            <Select.Root onValueChange={(value) => changeTheme(value)}>
                <Select.Trigger className={stylesSettings.select_trigger}>
                    <div>
                        <Select.Icon className={stylesSettings.select_icon}><SVG ariaHidden={true} svg={SwatchesIcon} /></Select.Icon>
                        <Select.Value placeholder={defaultTheme} />
                    </div>
                    <Select.Icon className={stylesSettings.select_icon}><SVG ariaHidden={true} svg={ChevronDown} /></Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                    <Select.Content className={stylesSettings.select_content} position="popper" sideOffset={10} sticky="always">
                        <Select.Viewport role="select">
                            {themeOptions.map((option) => (
                                <Select.Item
                                    value={option.value}
                                    id={option.value}
                                    className={stylesSettings.select_item}
                                    key={option.value}
                                >
                                    <Select.ItemText>{option.title}</Select.ItemText>
                                    <Select.ItemIndicator className={stylesSettings.select_icon}>
                                        <SVG svg={DoneIcon} ariaHidden />
                                    </Select.ItemIndicator>
                                </Select.Item>
                            ))}
                        </Select.Viewport>
                    </Select.Content>
                </Select.Portal>
            </Select.Root>
        </section>
    );
};


export default ReadingTheme;