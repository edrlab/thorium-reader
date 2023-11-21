import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";


import SVG from "readium-desktop/renderer/common/components/SVG";
import * as TwoColsIcon from "readium-desktop/renderer/assets/icons/2cols-icon.svg";
import * as AlignJustifyIcon from "readium-desktop/renderer/assets/icons/align-justify-icon.svg";
import { useSaveConfig } from "./useSaveConfig";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";


const ReadingDisplayCol = () => {
    const [__] = useTranslator();
    const saveConfigDebounced = useSaveConfig();
    const colCount = useSelector((s: ICommonRootState) => s.reader.defaultConfig.colCount);
    const paged = useSelector((s: ICommonRootState) => s.reader.defaultConfig.paged);

    React.useEffect(() => {
        const col_auto = document.getElementById("col_auto") as HTMLInputElement;
        const col_one = document.getElementById("col_one") as HTMLInputElement;
        const col_two = document.getElementById("col_two") as HTMLInputElement;
        if (paged === true) {
            switch (colCount) {
                case "1":
                    col_one.checked = true;
                    break;
                case "2":
                    col_two.checked = true;
                    break;
                default:
                    col_auto.checked = true;
            }
        } else {
            col_one.disabled && col_two.disabled === true;
        }
    }, [paged]);
    return (
        <section>
            <div className={stylesGlobal.heading}>
                <h4>{__("reader.settings.column.title")}</h4>
            </div>
            <div className={stylesSettings.display_options}>
                <input id="col_auto" type="radio" name="columns" onClick={() => saveConfigDebounced({ colCount: "auto" })} />
                <label className={stylesSettings.display_options_item} htmlFor="col_auto">
                    <SVG ariaHidden svg={AlignJustifyIcon} />
                    <p>{__("reader.settings.column.auto")}</p>
                </label>
                <input id="col_one" type="radio" name="columns" onClick={() => saveConfigDebounced({ colCount: "1" })} />
                <label className={stylesSettings.display_options_item} htmlFor="col_one">
                    <SVG ariaHidden svg={AlignJustifyIcon} />
                    <p>{__("reader.settings.column.one")}</p>
                </label>
                <input id="col_two" type="radio" name="columns" onClick={() => saveConfigDebounced({ colCount: "2" })} />
                <label className={stylesSettings.display_options_item} htmlFor="col_two">
                    <SVG ariaHidden svg={TwoColsIcon} />
                    <p>{__("reader.settings.column.two")}</p>
                </label>
            </div>
        </section>
    );
};
export default ReadingDisplayCol;
