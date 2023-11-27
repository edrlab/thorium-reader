import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as AlignAutoIcon from "readium-desktop/renderer/assets/icons/align-auto-icon.svg";
import * as AlignJustifyIcon from "readium-desktop/renderer/assets/icons/align-justify-icon.svg";
import * as AlignRightIcon from "readium-desktop/renderer/assets/icons/align-right-icon.svg";
import { useSaveConfig } from "./useSaveConfig";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { SettingsRadioBtnTemplate, TOptions } from "./SettingsRadioBtnTemplate";

const ReadingDisplayAlign = () => {
    const [__] = useTranslator();
    const saveConfigDebounced = useSaveConfig();
    const alignement = useSelector((s: ICommonRootState) => s.reader.defaultConfig.align);

    const options: TOptions = [
        {
            id: "align_auto",
            onChange: () => saveConfigDebounced({ align: "auto" }),
            svg: AlignAutoIcon,
            description: `${__("reader.settings.column.auto")}`,
            checked: (alignement === "auto"),
            disabled: false,
            name: "align",
        },
        {
            id: "align_justify",
            onChange: () => saveConfigDebounced({ align: "justify" }),
            svg: AlignJustifyIcon,
            description: `${__("reader.settings.justify")}`,
            checked: (alignement === "justify"),
            disabled: false,
            name: "align",


        },
        {
            id: "align_right",
            onChange: () => saveConfigDebounced({ align: "start" }),
            svg: AlignRightIcon,
            description: `${__("reader.svg.right")}`,
            checked: (alignement === "start"),
            disabled: false,
            name: "align",
        },
    ];

    const List = () => {
        return options.map((o) => <SettingsRadioBtnTemplate key={o.id} {...o} />);
    };

    return (
        <section className={stylesSettings.section}>
            <div>
                <h4>{__("reader.settings.justification")}</h4>
            </div>
            <div className={stylesSettings.display_options}>
                <List />
            </div>
        </section>
    );
};
export default ReadingDisplayAlign;
