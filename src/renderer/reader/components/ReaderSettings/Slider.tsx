// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as React from "react";

import SVG from "readium-desktop/renderer/common/components/SVG";
import * as ResetIcon from "readium-desktop/renderer/assets/icons/clock-reverse-icon.svg";
import * as MinusIcon from "readium-desktop/renderer/assets/icons/Minus-Bold.svg";
import * as PlusIcon from "readium-desktop/renderer/assets/icons/Plus-bold.svg";
import optionsValues, { AdjustableSettingsStrings } from "readium-desktop/renderer/reader/components/options-values";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { ReaderConfig } from "readium-desktop/common/models/reader";

interface ITable {
    title: string,
    defaultValue: string,
    parameter: keyof AdjustableSettingsStrings;
    altParameter: string,
    rem: boolean,
}

export const Slider = ({ value, option, set }: { value: string, option: ITable, set: (a: Pick<ReaderConfig, "pageMargins" | "wordSpacing" | "letterSpacing" | "paraSpacing" | "lineHeight">) => void }) => {
    const values = optionsValues[option.parameter] || [];
    const indexForValue = (candidate: string) => Math.max(0, values.indexOf(candidate));
    const [currentIndex, setCurrentIndex] = React.useState(() => indexForValue(value));
    const currentSliderValue = values[currentIndex] || "0";
    const labelId = React.useId();
    const [__] = useTranslator();

    React.useEffect(() => {
        setCurrentIndex(Math.max(0, (optionsValues[option.parameter] || []).indexOf(value)));
    }, [value, option.parameter]);

    const updateValue = (index: number) => {
        const newValue = (optionsValues[option.parameter] || [])[index] || "0";
        setCurrentIndex(index);
        set({ [option.parameter]: newValue } as Pick<ReaderConfig, "pageMargins" | "wordSpacing" | "letterSpacing" | "paraSpacing" | "lineHeight">);
    };

    const click = (direction: string) => {
        const newIndex = direction === "out" ? currentIndex - 1 : currentIndex + 1;
        if (newIndex >= 0 && newIndex < values.length) {
            updateValue(newIndex);
        }
    };

    return (
        <section className={stylesSettings.section} key={option.title}>
            <div className={stylesSettings.spacing_heading}>
                <h3 id={labelId}>{option.title}</h3>
                <p>
                    {currentSliderValue === "0" ? __("reader.settings.column.auto") : currentSliderValue}
                </p>
            </div>
            <div className={stylesSettings.size_range}>
                <button
                    onClick={() => updateValue(0)}
                    className={stylesSettings.reset_button}
                    title={__("accessibility.resetSetting", { setting: option.title })}
                >
                    <SVG ariaHidden svg={ResetIcon} />
                </button>
                <button onClick={() => click("out")} className={stylesSettings.scale_button_left} aria-label={__("accessibility.decreaseSetting", { setting: option.title })}>
                    <SVG ariaHidden svg={MinusIcon} />
                </button>
                <input
                    id={`${labelId}-range`}
                    type="range"
                    aria-labelledby={labelId}
                    min="0"
                    max={optionsValues[option.parameter].length - 1}
                    value={currentIndex}
                    aria-valuetext={currentSliderValue === "0" ? __("reader.settings.column.auto") : currentSliderValue}
                    onChange={(e) => updateValue(parseInt(e.target.value, 10))}
                    className={currentSliderValue === "0" ? stylesSettings.range_inactive : ""}
                />
                <button onClick={() => click("in")} className={stylesSettings.scale_button_right} aria-label={__("accessibility.increaseSetting", { setting: option.title })}>
                    <SVG ariaHidden svg={PlusIcon} />
                </button>
            </div>
        </section>
    );
};
