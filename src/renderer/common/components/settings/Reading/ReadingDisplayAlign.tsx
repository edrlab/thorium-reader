import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";


import SVG from "readium-desktop/renderer/common/components/SVG";
import * as AlignAutoIcon from "readium-desktop/renderer/assets/icons/align-auto-icon.svg";
import * as AlignJustifyIcon from "readium-desktop/renderer/assets/icons/align-justify-icon.svg";
import * as AlignRightIcon from "readium-desktop/renderer/assets/icons/align-right-icon.svg";


const ReadingDisplayAlign = () => {
    const [__] = useTranslator();
    return (
        <section>
            <div className={stylesGlobal.heading}>
                <h4>{__("reader.settings.justification")}</h4>
            </div>
            <div className={stylesSettings.display_options}>
                <div className={stylesSettings.display_options_item}>
                    <SVG ariaHidden svg={AlignAutoIcon} />
                    <p>{__("reader.settings.column.auto")}</p>
                </div>
                <div className={stylesSettings.display_options_item}>
                    <SVG ariaHidden svg={AlignJustifyIcon} />
                    <p>{__("reader.settings.justify")}</p>
                </div>
                <div className={stylesSettings.display_options_item}>
                    <SVG ariaHidden svg={AlignRightIcon} />
                    <p>{__("reader.svg.right")}</p>
                </div>
            </div>
        </section>
    )
}
export default ReadingDisplayAlign;