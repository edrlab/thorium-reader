import * as React from "react";

import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";

import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useSaveConfig } from "./useSaveConfig";

const ReadingSpacing = () => {
    return (
        <div className={stylesSettings.settings_tab_container_reading_spacing}>
            <PageMargins />
            <WordSpacing />
            <LetterSpacing />
            <ParaSpacing />
            <LineSpacing />
        </div>
    )

}

export default ReadingSpacing;


const PageMargins = () => {
    const [__] = useTranslator();
    const pageMargins = useSelector((s: ICommonRootState) => s.reader.defaultConfig.pageMargins);
    const saveConfigDebounced = useSaveConfig();

    return (
        <section className={stylesSettings.section}>
            <div>
                <h4>{__("reader.settings.margin")}</h4>
            </div>
            <div className={stylesSettings.size_range}>
                <input
                    type="range"
                    aria-labelledby="label_pageMargins"
                    min={0.5}
                    max={2}
                    step={0.25}
                    aria-valuemin={0}
                    defaultValue={pageMargins}
                    onChange={(e) => saveConfigDebounced({ pageMargins: (e.target?.value || `${readerConfigInitialState.pageMargins}`) })}
                />
                <p>{pageMargins}</p>
            </div>
        </section>
    )
}

const WordSpacing = () => {
    const [__] = useTranslator();
    const wordSpacing = useSelector((s: ICommonRootState) => s.reader.defaultConfig.wordSpacing);
    const saveConfigDebounced = useSaveConfig();

    return (
        <section className={stylesSettings.section}>
            <div>
                <h4>{__("reader.settings.wordSpacing")}</h4>
            </div>
            <div className={stylesSettings.size_range}>
                <input
                    type="range"
                    aria-labelledby="label_wordSpacing"
                    min={0.05}
                    max={1}
                    step={0.05}
                    aria-valuemin={0}
                    defaultValue={wordSpacing}
                    onChange={(e) => saveConfigDebounced({ wordSpacing: (e.target?.value || `${readerConfigInitialState.wordSpacing}`) + "rem" })}
                />
                <p>{wordSpacing}</p>
            </div>
        </section>
    )
}

const LetterSpacing = () => {
    const [__] = useTranslator();
    const letterSpacing = useSelector((s: ICommonRootState) => s.reader.defaultConfig.letterSpacing);
    const saveConfigDebounced = useSaveConfig();

    return (
        <section className={stylesSettings.section}>
            <div>
                <h4>{__("reader.settings.letterSpacing")}</h4>
            </div>
            <div className={stylesSettings.size_range}>
                <input
                    type="range"
                    aria-labelledby="label_letterSpacing"
                    min={0.05}
                    max={0.5}
                    step={0.05}
                    aria-valuemin={0}
                    defaultValue={letterSpacing}
                    onChange={(e) => saveConfigDebounced({ letterSpacing: (e.target?.value || `${readerConfigInitialState.letterSpacing}`) + "rem" })}
                />
                <p>{letterSpacing}</p>
            </div>
        </section>
    )
}

const ParaSpacing = () => {
    const [__] = useTranslator();
    const paraSpacing = useSelector((s: ICommonRootState) => s.reader.defaultConfig.paraSpacing);
    const saveConfigDebounced = useSaveConfig();

    return (
        <section className={stylesSettings.section}>
            <div>
                <h4>{__("reader.settings.paraSpacing")}</h4>
            </div>
            <div className={stylesSettings.size_range}>
                <input
                    type="range"
                    aria-labelledby="label_paraSpacing"
                    min={0.5}
                    max={3}
                    step={0.5}
                    aria-valuemin={0}
                    defaultValue={paraSpacing}
                    onChange={(e) => saveConfigDebounced({ paraSpacing: (e.target?.value || `${readerConfigInitialState.paraSpacing}`) + "rem" })}
                />
                <p>{paraSpacing}</p>
            </div>
        </section>
    )
}

const LineSpacing = () => {
    const [__] = useTranslator();
    const lineHeight = useSelector((s: ICommonRootState) => s.reader.defaultConfig.lineHeight);
    const saveConfigDebounced = useSaveConfig();

    return (
        <section className={stylesSettings.section}>
            <div>
                <h4>{__("reader.settings.lineSpacing")}</h4>
            </div>
            <div className={stylesSettings.size_range}>
                <input
                    type="range"
                    aria-labelledby="label_lineHeight"
                    min={1}
                    max={2}
                    step={0.25}
                    aria-valuemin={0}
                    defaultValue={lineHeight}
                    onChange={(e) => saveConfigDebounced({ lineHeight: (e.target?.value || `${readerConfigInitialState.lineHeight}`) + "rem" })}
                />
                <p>{lineHeight}</p>
            </div>
        </section>
    )
}

