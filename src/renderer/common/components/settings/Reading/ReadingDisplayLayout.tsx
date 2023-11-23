import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";


import SVG from "readium-desktop/renderer/common/components/SVG";
import * as ScrollableIcon from "readium-desktop/renderer/assets/icons/Scrollable-icon.svg";
import * as PaginatedIcon from "readium-desktop/renderer/assets/icons/paginated-icon.svg";
import { useSaveConfig } from "./useSaveConfig";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";


const ReadingDisplayLayout = () => {
    const [__] = useTranslator();
    const saveConfigDebounced = useSaveConfig();
    const layout = useSelector((s: ICommonRootState) => s.reader.defaultConfig.paged);

    React.useEffect(() => {
        const page_option = document.getElementById("page_option") as HTMLInputElement;
        const scroll_option = document.getElementById("scroll_option") as HTMLInputElement;
        if (layout) {
            page_option.checked = true;
        } else {
            scroll_option.checked = true;
        }
    }, []);


    return (
        <section className={stylesSettings.section}>
            <div>
                <h4>{__("reader.settings.disposition.title")}</h4>
            </div>
            <div className={stylesSettings.display_options}>
                <input id="scroll_option" type="radio" name="disposition" onClick={() => saveConfigDebounced({ paged: false })} />
                <label className={stylesSettings.display_options_item} htmlFor="scroll_option">
                    <SVG ariaHidden svg={ScrollableIcon} />
                    <p>{__("reader.settings.scrolled")}</p>
                </label>
                <input id="page_option" type="radio" name="disposition" onClick={() => saveConfigDebounced({ paged: true })} />
                <label className={stylesSettings.display_options_item} htmlFor="page_option">
                    <SVG ariaHidden svg={PaginatedIcon} />
                    <p>{__("reader.settings.paginated")}</p>
                </label>
            </div>
        </section>
    );
};
export default ReadingDisplayLayout;
