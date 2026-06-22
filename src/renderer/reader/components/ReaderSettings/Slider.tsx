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
    ariaLabel: string,
    ariaValuemin: number,
    defaultValue: string,
    parameter: keyof AdjustableSettingsStrings;
    altParameter: string,
    rem: boolean,
}

export const Slider = ({ value, option, set }: { value: string, option: ITable, set: (a: Pick<ReaderConfig, "pageMargins" | "wordSpacing" | "letterSpacing" | "paraSpacing" | "lineHeight">) => void }) => {
    const [currentSliderValue, setCurrentSliderValue] = React.useState(option.defaultValue);
    const [currentIndex, setCurrentIndex] = React.useState(() => (optionsValues[option.parameter] ||  [] ).findIndex((el) => el === option.defaultValue) || 0);
    const [__] = useTranslator();

    React.useEffect(() => {
        setCurrentSliderValue(value);
        const newIndex = (optionsValues[option.parameter] || [] ).findIndex((el) => el === value) || 0;
        setCurrentIndex(newIndex);
    }, [value, option.parameter]);

    const updateValue = (index: number) => {
        const newValue = (optionsValues[option.parameter] || [])[index] || "0";
        setCurrentSliderValue(newValue);
        setCurrentIndex(index);
        set({ [option.parameter]: newValue } as Pick<ReaderConfig, "pageMargins" | "wordSpacing" | "letterSpacing" | "paraSpacing" | "lineHeight">);
    };

    const click = (direction: string) => {
        setCurrentIndex((prevIndex) => {
            const newIndex = direction === "out" ? prevIndex - 1 : prevIndex + 1;
            if (newIndex >= 0 && newIndex < optionsValues[option.parameter].length) {
                updateValue(newIndex);
            }
            return prevIndex;
        });
    };

    return (
        <section className={stylesSettings.section} key={option.title}>
            <div className={stylesSettings.spacing_heading}>
                <h3>{option.title}</h3>
                <p>
                    {currentSliderValue === "0" ? "auto" : currentSliderValue}
                </p>
            </div>
            <div className={stylesSettings.size_range}>
                <button
                    onClick={() => updateValue(0)}
                    className={stylesSettings.reset_button}
                    title={__("reader.settings.defaultValue")}
                >
                    <SVG ariaHidden svg={ResetIcon} />
                </button>
                <button onClick={() => click("out")} className={stylesSettings.scale_button}>
                    <SVG ariaHidden svg={MinusIcon} />
                </button>
                <input
                    id={option.title}
                    type="range"
                    aria-labelledby={option.ariaLabel}
                    min="0"
                    max={optionsValues[option.parameter].length - 1}
                    value={currentIndex}
                    aria-valuemin={option.ariaValuemin}
                    onChange={(e) => updateValue(parseInt(e.target.value, 10))}
                    className={currentSliderValue === "0" ? stylesSettings.range_inactive : ""}
                />
                <button onClick={() => click("in")} className={stylesSettings.scale_button}>
                    <SVG ariaHidden svg={PlusIcon} />
                </button>
            </div>
        </section>
    );
};
