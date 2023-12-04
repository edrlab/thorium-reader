import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as ScrollableIcon from "readium-desktop/renderer/assets/icons/Scrollable-icon.svg";
import * as PaginatedIcon from "readium-desktop/renderer/assets/icons/paginated-icon.svg";
import { useSaveConfig } from "./useSaveConfig";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { IOption, SettingsRadioBtnTemplate, TOptions } from "./SettingsRadioBtnTemplate";
import * as RadioGroup from '@radix-ui/react-radio-group';
import SVG from "../../SVG";


const ReadingDisplayLayout = () => {
    const [__] = useTranslator();
    const saveConfigDebounced = useSaveConfig();
    const layout = useSelector((s: ICommonRootState) => s.reader.defaultConfig.paged);

    const options: TOptions = [
        {
            id: "scroll_option",
            onChange: () => saveConfigDebounced({ paged: false }),
            svg: ScrollableIcon,
            description: `${__("reader.settings.scrolled")}`,
            checked: (!layout),
            disabled: false,
            name: "pagination",
            tabIndex: 0,
        },
        {
            id: "page_option",
            onChange: () => saveConfigDebounced({ paged: true }),
            svg: PaginatedIcon,
            description: `${__("reader.settings.paginated")}`,
            checked: (layout),
            disabled: false,
            name: "pagination",
            tabIndex: -1,
        },
    ];
    const value = options[0].checked ? options[0].id : options[1].id;


    const List = () => {
        return options.map((o) => <SettingsRadioBtnTemplate key={o.id} {...o} />);
    };
    const List2 = (option: IOption) => {
        return (
             <RadioGroup.Item value={option.id} id={option.id} className={stylesSettings.display_options_item}>
                <RadioGroup.Indicator style={{  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  position: 'relative'}}/>
                <SVG ariaHidden svg={option.svg} />
                {option.description}
            </RadioGroup.Item>
        )
    };


    return (
        <section className={stylesSettings.section}>
            <div>
                <h4>{__("reader.settings.disposition.title")}</h4>
            </div>
            <div className={stylesSettings.display_options}>
                {/* <List /> */}
                <RadioGroup.Root orientation="horizontal" style={{display: "flex"}}
                onValueChange={(v) => {saveConfigDebounced({ paged: v == options[1].id }); console.log(v)}}
                >
                    {options.map((o) => <List2 key={o.id} {...o} />)}
                </RadioGroup.Root>
            </div>
        </section>
    );
};
export default ReadingDisplayLayout;
