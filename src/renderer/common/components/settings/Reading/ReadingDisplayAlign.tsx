import * as React from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as AlignAutoIcon from "readium-desktop/renderer/assets/icons/align-auto-icon.svg";
import * as AlignJustifyIcon from "readium-desktop/renderer/assets/icons/align-justify-icon.svg";
import * as AlignRightIcon from "readium-desktop/renderer/assets/icons/align-right-icon.svg";
import { useSaveConfig } from "./useSaveConfig";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { SettingsRadioBtnTemplate } from "./SettingsRadioBtnTemplate";


const ReadingDisplayAlign = () => {
    const [__] = useTranslator();
    const saveConfigDebounced = useSaveConfig();
    const alignement = useSelector((s: ICommonRootState) => s.reader.defaultConfig.align);

    return (
        <section className={stylesSettings.section}>
            <div>
                <h4>{__("reader.settings.justification")}</h4>
            </div>
            <div className={stylesSettings.display_options}>
            <RadioGroup.Root orientation="horizontal" style={{ display: "flex" }} value={alignement}
                    onValueChange={(v) => saveConfigDebounced({align: v})}
                >
                    <SettingsRadioBtnTemplate value="auto" description={`${__("reader.settings.column.auto")}`} svg={AlignAutoIcon} disabled={false} />
                    <SettingsRadioBtnTemplate value="justify" description={`${__("reader.settings.justify")}`} svg={AlignJustifyIcon} disabled={false} />
                    <SettingsRadioBtnTemplate value="start" description={`${__("reader.svg.right")}`} svg={AlignRightIcon} disabled={false} />
            </RadioGroup.Root>
            </div>
        </section>
    );
};
export default ReadingDisplayAlign;
