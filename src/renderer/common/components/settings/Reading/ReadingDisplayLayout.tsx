import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as ScrollableIcon from "readium-desktop/renderer/assets/icons/Scrollable-icon.svg";
import * as PaginatedIcon from "readium-desktop/renderer/assets/icons/paginated-icon.svg";
import { useSaveConfig } from "./useSaveConfig";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { SettingsRadioBtnTemplate, TOptions } from "./SettingsRadioBtnTemplate";


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
        },
        {
            id: "page_option",
            onChange: () => saveConfigDebounced({ paged: true }),
            svg: PaginatedIcon,
            description: `${__("reader.settings.paginated")}`,
            checked: (layout),
            disabled: false,
            name: "pagination",
        },
    ];

    const List = () => {
        return options.map((o) => <SettingsRadioBtnTemplate key={o.id} {...o} />);
    };


    return (
        <section className={stylesSettings.section}>
            <div>
                <h4>{__("reader.settings.disposition.title")}</h4>
            </div>
            <div className={stylesSettings.display_options}>
                <List />
            </div>
        </section>
    );
};
export default ReadingDisplayLayout;
