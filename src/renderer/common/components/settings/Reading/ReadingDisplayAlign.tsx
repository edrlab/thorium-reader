import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";


import SVG from "readium-desktop/renderer/common/components/SVG";
import * as AlignAutoIcon from "readium-desktop/renderer/assets/icons/align-auto-icon.svg";
import * as AlignJustifyIcon from "readium-desktop/renderer/assets/icons/align-justify-icon.svg";
import * as AlignRightIcon from "readium-desktop/renderer/assets/icons/align-right-icon.svg";
import { useSaveConfig } from "./useSaveConfig";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";


const ReadingDisplayAlign = () => {
    const [__] = useTranslator();
    const saveConfigDebounced = useSaveConfig();
    const alignement = useSelector((s: ICommonRootState) => s.reader.defaultConfig.align);

    React.useEffect(() => {
        const align_auto = document.getElementById("align_auto") as HTMLInputElement;
        const align_justify = document.getElementById("align_justify") as HTMLInputElement;
        const align_right = document.getElementById("align_right") as HTMLInputElement;

        switch (alignement) {
            case "justify":
                align_justify.checked = true;
                break;
            case "right":
                align_right.checked = true;
                break;
            default:
                align_auto.checked = true;
        }
    }, []);
    return (
        <section>
            <div className={stylesGlobal.heading}>
                <h4>{__("reader.settings.justification")}</h4>
            </div>
            <div className={stylesSettings.display_options}>
                <input id="align_auto" type="radio" name="alignment" onClick={() => saveConfigDebounced({ align: "auto" })} />
                <label className={stylesSettings.display_options_item} htmlFor="align_auto">
                    <SVG ariaHidden svg={AlignAutoIcon} />
                    <p>{__("reader.settings.column.auto")}</p>
                </label>
                <input id="align_justify" type="radio" name="alignment" onClick={() => saveConfigDebounced({ align: "justify" })} />
                <label className={stylesSettings.display_options_item} htmlFor="align_justify">
                    <SVG ariaHidden svg={AlignJustifyIcon} />
                    <p>{__("reader.settings.justify")}</p>
                </label>
                <input id="align_right" type="radio" name="alignment" onClick={() => saveConfigDebounced({ align: "start" })} />
                <label className={stylesSettings.display_options_item} htmlFor="align_right">
                    <SVG ariaHidden svg={AlignRightIcon} />
                    <p>{__("reader.svg.right")}</p>
                </label>
            </div>
        </section>
    );
};
export default ReadingDisplayAlign;
