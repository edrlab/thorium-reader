import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as ScrollableIcon from "readium-desktop/renderer/assets/icons/scroll-icon.svg";
import * as PaginatedIcon from "readium-desktop/renderer/assets/icons/page-icon.svg";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { useSaveConfig } from "./useSaveConfig";
import { SettingsRadioBtnTemplate } from "./SettingsRadioBtnTemplate";

// const Item = (props: {value: string, description: string, svg: typeof import("*.svg")}) => {
//     const [__] = useTranslator();
//     return <RadioGroup.Item value={props.value} id={props.value} className={stylesSettings.display_options_item}>
//                         {/* <RadioGroup.Indicator style={{
//                             display: 'flex',
//                             alignItems: 'center',
//                             justifyContent: 'center',
//                             width: '100%',
//                             height: '100%',
//                             position: 'relative'
//                         }} /> */}
//                         <SVG ariaHidden svg={props.svg} />
//                         {props.description}
//                     </RadioGroup.Item>
// }

const ReadingDisplayLayout = () => {
    const [__] = useTranslator();
    const saveConfigDebounced = useSaveConfig();
    const layout = useSelector((s: ICommonRootState) => s.reader.defaultConfig.paged);
    return (
        <section className={stylesSettings.section}>
            <div>
                <h4>{__("reader.settings.disposition.title")}</h4>
            </div>
            <div className={stylesSettings.display_options}>
                {/* <List /> */}
                <RadioGroup.Root orientation="horizontal" style={{ display: "flex" }} value={layout ? "page_option" : "scroll_option"}
                    onValueChange={(v) => saveConfigDebounced({paged: v === "page_option"})}
                >
                    <SettingsRadioBtnTemplate value="scroll_option" description={`${__("reader.settings.scrolled")}`} svg={ScrollableIcon} disabled={false}/>
                    <SettingsRadioBtnTemplate value="page_option" description={`${__("reader.settings.paginated")}`} svg={PaginatedIcon} disabled={false}/>
                </RadioGroup.Root>
            </div>
        </section>
    );
};
export default ReadingDisplayLayout;
