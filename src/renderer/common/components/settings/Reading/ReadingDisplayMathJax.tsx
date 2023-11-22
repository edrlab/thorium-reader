import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
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

    React.useEffect(() => {
        const mathJaxInput = document.getElementById("mathjax") as HTMLInputElement;
        const motionInput = document.getElementById("reduceMotionCheckBox") as HTMLInputElement;
        const footnotesInput = document.getElementById("noFootnotesCheckBox") as HTMLInputElement;
        if (mathJax) {
            mathJaxInput.checked = true;
        }
        if (motion) {
            motionInput.checked = true;
        }
        if (footnotes) {
            footnotesInput.checked = true;
        }
    }, []);


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
        <section className={stylesSettings.section}>
            <div>
                <h4>{__("reader.settings.options")}</h4>
            </div>
            <div className={stylesSettings.maths_options}>
                <div>
                    <input
                        id="mathjax"
                        type="checkbox"
                        name="mathjax"
                        onChange={toggleMathJax}
                    />
                    <label htmlFor="mathjax"> MathJax</label>
                </div>
                <div>
                    <input
                        id="reduceMotionCheckBox"
                        name="reduceMotionCheckBox"
                        type="checkbox"
                        onChange={toggleReduceMotion}
                    />
                    <label htmlFor="reduceMotionCheckBox">{__("reader.settings.reduceMotion")}</label>
                </div>
                <div>
                    <input
                        id="noFootnotesCheckBox"
                        type="checkbox"
                        name="noFootnotesCheckBox"
                        onChange={toggleNoFootnotes}
                    />
                    <label htmlFor="noFootnotesCheckBox">{__("reader.settings.noFootnotes")}</label>
                </div>
            </div>
        </section>
    );
};
export default ReadingDisplayMathJax;
