import * as React from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as TwoColsIcon from "readium-desktop/renderer/assets/icons/2cols-icon.svg";
import * as AlignJustifyIcon from "readium-desktop/renderer/assets/icons/align-justify-icon.svg";
import { useSaveConfig } from "./useSaveConfig";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { SettingsRadioBtnTemplate } from "./SettingsRadioBtnTemplate";


const ReadingDisplayCol = () => {
    const [__] = useTranslator();
    const saveConfigDebounced = useSaveConfig();
    const colCount = useSelector((s: ICommonRootState) => s.reader.defaultConfig.colCount);
    const paged = useSelector((s: ICommonRootState) => s.reader.defaultConfig.paged);
    const scrollable = !paged;

    const [state, setState] = React.useState(scrollable ? "auto" : colCount);
    React.useEffect(() => {
        scrollable ? setState("auto") : setState(colCount);
    }, [scrollable, colCount]);


    return (
        <section className={stylesSettings.section}>
            <div>
                <h4>{__("reader.settings.column.title")}</h4>
            </div>
            <div className={stylesSettings.display_options}>
                <RadioGroup.Root orientation="horizontal" style={{ display: "flex" }} value={state}
                        onValueChange={(v) => saveConfigDebounced({colCount: v})}
                    >
                        <SettingsRadioBtnTemplate value="auto" description={`${__("reader.settings.column.auto")}`} svg={AlignJustifyIcon} disabled={false} />
                        <SettingsRadioBtnTemplate value="1" description={`${__("reader.settings.column.one")}`} svg={AlignJustifyIcon} disabled={scrollable} />
                        <SettingsRadioBtnTemplate value="2" description={`${__("reader.settings.column.two")}`} svg={TwoColsIcon} disabled={scrollable} />
                </RadioGroup.Root>
            </div>
        </section>
    );
};
export default ReadingDisplayCol;
