import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as ScrollableIcon from "readium-desktop/renderer/assets/icons/Scrollable-icon.svg";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import * as RadioGroup from '@radix-ui/react-radio-group';
import SVG from "../../SVG";
import { useSaveConfig } from "./useSaveConfig";

const Item = (props: {value: string}) => {
    const [__] = useTranslator();
    return <RadioGroup.Item value={props.value} id={props.value} className={stylesSettings.display_options_item}>
                        <RadioGroup.Indicator style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            position: 'relative'
                        }} />
                        <SVG ariaHidden svg={ScrollableIcon} />
                        {`${__("reader.settings.scrolled")}`}
                    </RadioGroup.Item>
}

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
                    <Item value="scroll_option"/>
                    <Item value="page_option"/>
                </RadioGroup.Root>
            </div>
        </section>
    );
};
export default ReadingDisplayLayout;
