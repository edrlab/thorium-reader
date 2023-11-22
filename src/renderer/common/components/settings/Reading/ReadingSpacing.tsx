import * as React from "react";

import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";

import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useSaveConfig } from "./useSaveConfig";

const ReadingSpacing = () => {
    const [__] = useTranslator();
    const pageMargins = useSelector((s: ICommonRootState) => s.reader.defaultConfig.pageMargins);
    const wordSpacing = useSelector((s: ICommonRootState) => s.reader.defaultConfig.wordSpacing);
    const letterSpacing = useSelector((s: ICommonRootState) => s.reader.defaultConfig.letterSpacing);
    const paraSpacing = useSelector((s: ICommonRootState) => s.reader.defaultConfig.paraSpacing);
    const lineHeight = useSelector((s: ICommonRootState) => s.reader.defaultConfig.lineHeight);
    const saveConfigDebounced = useSaveConfig();

    const spacingOptions = [
        {
            title: `${__("reader.settings.margin")}`,
            ariaLabel: "label_pageMargins",
            min: 0.5,
            max: 2,
            step: 0.25,
            ariaValuemin: 0,
            defaultValue: pageMargins,
            parameter: "pageMargins",
            altParameter: `${readerConfigInitialState.pageMargins}`,
            rem: false,
        },
        {
            title: `${__("reader.settings.wordSpacing")}`,
            ariaLabel: "label_wordSpacing",
            min: 0.05,
            max: 1,
            step: 0.05,
            ariaValuemin: 0,
            defaultValue: wordSpacing,
            parameter: "wordSpacing",
            altParameter: `${readerConfigInitialState.wordSpacing}`,
            rem: true,
        },
        {
            title: `${__("reader.settings.letterSpacing")}`,
            ariaLabel: "label_letterSpacing",
            min: 0.05,
            max: 0.5,
            step: 0.05,
            ariaValuemin: 0,
            defaultValue: letterSpacing,
            parameter: "letterSpacing",
            altParameter: `${readerConfigInitialState.letterSpacing}`,
            rem: true,
        },
        {
            title: `${__("reader.settings.paraSpacing")}`,
            ariaLabel: "label_paraSpacing",
            min: 0.5,
            max: 3,
            step: 0.5,
            ariaValuemin: 0,
            defaultValue: paraSpacing,
            parameter: "paraSpacing",
            altParameter: `${readerConfigInitialState.paraSpacing}`,
            rem: true,
        },
        {
            title: `${__("reader.settings.lineSpacing")}`,
            ariaLabel: "label_lineHeight",
            min: 0.5,
            max: 3,
            step: 0.5,
            ariaValuemin: 0,
            defaultValue: lineHeight,
            parameter: "lineHeight",
            altParameter: `${readerConfigInitialState.lineHeight}`,
            rem: true,
        },
    ];

    return (
        <div className={stylesSettings.settings_tab_container_reading_spacing}>
            {spacingOptions.map((option) => (
                <section className={stylesSettings.section} key={option.title}>
                    <div>
                        <h4>{option.title}</h4>
                    </div>
                    <div className={stylesSettings.size_range}>
                        <input
                            type="range"
                            aria-labelledby={option.ariaLabel}
                            min={option.min}
                            max={option.max}
                            step={option.step}
                            aria-valuemin={option.ariaValuemin}
                            defaultValue={option.defaultValue}
                            onChange={(e) => saveConfigDebounced({ [option.parameter]: (e.target?.value || [option.altParameter]) + (option.rem ? "rem" : "") })}
                        />
                        <p>{option.defaultValue}</p>
                    </div>
                </section>
            ))}
        </div>
    );

};

export default ReadingSpacing;

