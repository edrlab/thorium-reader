import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";


import SVG from "readium-desktop/renderer/common/components/SVG";
import * as ScrollableIcon from "readium-desktop/renderer/assets/icons/Scrollable-icon.svg";
import * as PaginatedIcon from "readium-desktop/renderer/assets/icons/paginated-icon.svg";


const ReadingDisplayLayout = () => {
    const [__] = useTranslator();
    return (
        <section>
            <div className={stylesGlobal.heading}>
                <h4>{__("reader.settings.disposition.title")}</h4>
            </div>
            <div className={stylesSettings.display_options}>
                <div className={stylesSettings.display_options_item}>
                    <SVG ariaHidden svg={ScrollableIcon} />
                    <p>{__("reader.settings.scrolled")}</p>
                </div>
                <div className={stylesSettings.display_options_item}>
                    <SVG ariaHidden svg={PaginatedIcon} />
                    <p>{__("reader.settings.paginated")}</p>
                </div>
            </div>
        </section>
    )
}
export default ReadingDisplayLayout;