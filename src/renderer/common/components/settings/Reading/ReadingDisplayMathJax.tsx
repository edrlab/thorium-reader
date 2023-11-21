import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";

import { useSaveConfig } from "./useSaveConfig";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";


const ReadingDisplayMathJax = () => {
    const [__] = useTranslator();
    const saveConfigDebounced = useSaveConfig();
    let mathJax = useSelector((s: ICommonRootState) => s.reader.defaultConfig.enableMathJax);
    let motion = useSelector((s: ICommonRootState) => s.reader.defaultConfig.reduceMotion);
    let footnotes = useSelector((s: ICommonRootState) => s.reader.defaultConfig.noFootnotes);

    const toggleMathJax = () => {
        mathJax = !mathJax;
        saveConfigDebounced({ enableMathJax: mathJax });
        if (mathJax === true) {
            saveConfigDebounced({ paged: false, enableMathJax: true });
        }
    };

    const toggleReduceMotion = () => {
        motion = !motion;
        saveConfigDebounced({ reduceMotion: motion });
    };

    const toggleNoFootnotes = () => {
        footnotes = !footnotes;
        saveConfigDebounced({ noFootnotes: footnotes });
    };

    return (
        <section>
            <div className={stylesGlobal.heading}>
                <h4>MathJax</h4>
            </div>
            <div className={stylesSettings.maths_options}>
                <div>
                    <input id="mathjax" type="checkbox" name="mathjax" onChange={toggleMathJax} />
                    <label htmlFor="scroll_option">
                        MathJax
                    </label>
                </div>
                <div>
                    <input
                        id="reduceMotionCheckBox"
                        type="checkbox"
                        onChange={toggleReduceMotion}
                    />
                    <label htmlFor="reduceMotionCheckBox">{__("reader.settings.reduceMotion")}</label>
                </div>
                <div>
                    <input
                        id="noFootnotesCheckBox"
                        type="checkbox"
                        onChange={toggleNoFootnotes}
                    />
                    <label htmlFor="noFootnotesCheckBox">{__("reader.settings.noFootnotes")}</label>
                </div>
            </div>
        </section>
    );
};
export default ReadingDisplayMathJax;
