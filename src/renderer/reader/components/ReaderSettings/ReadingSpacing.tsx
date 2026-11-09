// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";

import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";
import { useSavePublisherReaderConfigDebounced, useSaveReaderConfigDebounced } from "readium-desktop/renderer/common/hooks/useReaderConfig";
import optionsValues from "readium-desktop/renderer/reader/components/options-values";
import { RadioGroupItem } from "readium-desktop/renderer/reader/components/ReaderSettings/ReaderSettings";
import { RadioGroup } from "readium-desktop/renderer/common/components/RadioGroupComponent";
import { ReaderConfigPublisher, ReaderSpacingPreset } from "readium-desktop/common/models/reader";
import SVG from "readium-desktop/renderer/common/components/SVG";
// import * as ResetIcon from "readium-desktop/renderer/assets/icons/clock-reverse-icon.svg";
import * as ReturnIcon from "readium-desktop/renderer/assets/icons/return-icon.svg";
import * as MinusIcon from "readium-desktop/renderer/assets/icons/Minus-Bold.svg";
import * as PlusIcon from "readium-desktop/renderer/assets/icons/Plus-bold.svg";
import * as DefaultCogWheelIcon from "readium-desktop/renderer/assets/icons/default-cogwheel-icon.svg";
import * as AccessibilityIcon from "readium-desktop/renderer/assets/icons/accessibility-circle-icon.svg";
import * as BalancedIcon from "readium-desktop/renderer/assets/icons/text-balanced-icon.svg";
import * as TightIcon from "readium-desktop/renderer/assets/icons/align-justify-icon.svg";
import * as LooseIcon from "readium-desktop/renderer/assets/icons/text-loose-icon.svg";
import * as CustomIcon from "readium-desktop/renderer/assets/icons/advanced-icon.svg";

interface ITable {
    title: string,
    defaultValue: string,
    parameter: keyof TSpacingValues;
    altParameter: string,
    rem: boolean,
}

type TSpacingPreset = "default" | "accessible" | "tight" | "balanced" | "loose" | "custom";
type TSpacingValues = Pick<ReaderConfigPublisher, "pageMargins" | "wordSpacing" | "letterSpacing" | "paraSpacing" | "lineHeight">;

const spacingPresets: Record<Exclude<TSpacingPreset, "custom">, TSpacingValues> = {
    default: {
        pageMargins: readerConfigInitialState.pageMargins,
        wordSpacing: readerConfigInitialState.wordSpacing,
        letterSpacing: readerConfigInitialState.letterSpacing,
        paraSpacing: readerConfigInitialState.paraSpacing,
        lineHeight: readerConfigInitialState.lineHeight,
    },
    accessible: {
        pageMargins: "1.25",
        wordSpacing: "0.25",
        letterSpacing: "0.125",
        paraSpacing: "1.25",
        lineHeight: "1.65",
    },
    tight: {
        pageMargins: "0.5",
        wordSpacing: "0",
        letterSpacing: "0",
        paraSpacing: "0",
        lineHeight: "1",
    },
    balanced: {
        pageMargins: "1",
        wordSpacing: "0.125",
        letterSpacing: "0.0675",
        paraSpacing: "0.5",
        lineHeight: "1.35",
    },
    loose: {
        pageMargins: "1.5",
        wordSpacing: "0.5",
        letterSpacing: "0.25",
        paraSpacing: "1.5",
        lineHeight: "1.75",
    },
};

const getSpacingPresetValue = (values: TSpacingValues): TSpacingPreset => {
    for (const [presetName, presetValues] of Object.entries(spacingPresets) as [Exclude<TSpacingPreset, "custom">, TSpacingValues][]) {
        if (
            presetValues.pageMargins === values.pageMargins
            && presetValues.wordSpacing === values.wordSpacing
            && presetValues.letterSpacing === values.letterSpacing
            && presetValues.paraSpacing === values.paraSpacing
            && presetValues.lineHeight === values.lineHeight
        ) {
            return presetName;
        }
    }

    return "custom";
};

const ReaderSpacingPresets = ({ overridePublisherDefault }: { overridePublisherDefault: boolean }) => {
    const [__] = useTranslator();
    const set = useSavePublisherReaderConfigDebounced();
    const config = useSelector((state: IReaderRootState) => state.reader.config);
    const { pageMargins, wordSpacing, letterSpacing, paraSpacing, lineHeight, customSpacingPreset } = config;

    const currentPreset = React.useMemo(
        () => getSpacingPresetValue({ pageMargins, wordSpacing, letterSpacing, paraSpacing, lineHeight }),
        [pageMargins, wordSpacing, letterSpacing, paraSpacing, lineHeight],
    );

    const onPresetChange = (value: string) => {
        if (value === "custom") {
            set(customSpacingPreset);
            return;
        }

        const presetValues = spacingPresets[value as Exclude<TSpacingPreset, "custom">];
        if (presetValues) {
            set(presetValues);
        }
    };

    return (
        <div className={stylesSettings.display_options} style={{ marginBottom: "20px", height: "unset" }}>
            <RadioGroup
                aria-label="Spacing presets"
                orientation="horizontal"
                style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                value={currentPreset}
                onValueChange={onPresetChange}
                isDisabled={!overridePublisherDefault}
            >
                <RadioGroupItem value="default" description={__("reader.settings.column.auto")} disabled={false} svg={DefaultCogWheelIcon} />
                <RadioGroupItem value="accessible" description="Accessible" disabled={false} svg={AccessibilityIcon} />
                <RadioGroupItem value="tight" description="Tight" disabled={false} svg={TightIcon} />
                <RadioGroupItem value="balanced" description="Balanced" disabled={false} svg={BalancedIcon} />
                <RadioGroupItem value="loose" description="Loose" disabled={false} svg={LooseIcon} />
                <RadioGroupItem value="custom" description="Custom" disabled={false} svg={CustomIcon} />
            </RadioGroup>
        </div>
    );
};

export default ReaderSpacingPresets;

export const ReaderSpacingAdvanced = ({ overridePublisherDefault }: { overridePublisherDefault: boolean }) => {

    const [__] = useTranslator();

    const setPublisherConfig = useSavePublisherReaderConfigDebounced();
    const setReaderConfig = useSaveReaderConfigDebounced();
    const config = useSelector((state: IReaderRootState) => state.reader.config);
    const { pageMargins, wordSpacing, letterSpacing, paraSpacing, lineHeight } = config;
    const spacingOptions: ITable[] = [
        {
            title: `${__("reader.settings.margin")}`,
            defaultValue: pageMargins,
            parameter: "pageMargins",
            altParameter: `${readerConfigInitialState.pageMargins}`,
            rem: false,
        },
        {
            title: `${__("reader.settings.wordSpacing")}`,
            defaultValue: wordSpacing,
            parameter: "wordSpacing",
            altParameter: `${readerConfigInitialState.wordSpacing}`,
            rem: false,
        },
        {
            title: `${__("reader.settings.letterSpacing")}`,
            defaultValue: letterSpacing,
            parameter: "letterSpacing",
            altParameter: `${readerConfigInitialState.letterSpacing}`,
            rem: false,
        },
        {
            title: `${__("reader.settings.paraSpacing")}`,
            defaultValue: paraSpacing,
            parameter: "paraSpacing",
            altParameter: `${readerConfigInitialState.paraSpacing}`,
            rem: false,
        },
        {
            title: `${__("reader.settings.lineSpacing")}`,
            defaultValue: lineHeight,
            parameter: "lineHeight",
            altParameter: `${readerConfigInitialState.lineHeight}`,
            rem: false,
        },
    ];

    const displayValue = (value: string) => {
        if (value === "0") {
            return __("reader.settings.column.auto");
        }

        return value;
    };

    const updateSpacingValue = (parameter: keyof TSpacingValues, nextValue: string) => {
        setPublisherConfig({ [parameter]: nextValue } as Pick<ReaderConfigPublisher, keyof TSpacingValues>);

        const nextCustomSpacingPreset: ReaderSpacingPreset = {
            pageMargins: parameter === "pageMargins" ? nextValue : pageMargins,
            wordSpacing: parameter === "wordSpacing" ? nextValue : wordSpacing,
            letterSpacing: parameter === "letterSpacing" ? nextValue : letterSpacing,
            paraSpacing: parameter === "paraSpacing" ? nextValue : paraSpacing,
            lineHeight: parameter === "lineHeight" ? nextValue : lineHeight,
        };

        setReaderConfig({ customSpacingPreset: nextCustomSpacingPreset });
    };

    const stepSpacingValue = (parameter: keyof TSpacingValues, direction: "out" | "in") => {
        const values = optionsValues[parameter] || [];
        const currentValue = config[parameter];
        const currentIndex = Math.max(0, values.indexOf(currentValue));
        const nextIndex = direction === "out" ? currentIndex - 1 : currentIndex + 1;

        if (nextIndex >= 0 && nextIndex < values.length) {
            updateSpacingValue(parameter, values[nextIndex]);
        }
    };

    return (
        <div>
            {spacingOptions.map((option: ITable) => {
                const currentValue = config[option.parameter];
                const isDefaultValue = currentValue === option.altParameter;
                const optionValues = optionsValues[option.parameter] || [];
                const currentIndex = Math.max(0, optionValues.indexOf(currentValue));
                const canDecrease = currentIndex > 0;
                const canIncrease = currentIndex < optionValues.length - 1;

                return (
                    <div key={option.title} style={{ marginTop: "20px" }}>
                        <div className={stylesSettings.range_size_container}>
                            <label>{option.title}</label>
                            <div className={stylesSettings.size_range}>
                                <span>{displayValue(currentValue).split("rem")[0]}</span>
                                <button
                                    onClick={() => updateSpacingValue(option.parameter, option.altParameter)}
                                    className={stylesSettings.reset_button}
                                    title={__("accessibility.resetSetting", { setting: option.title })}
                                    disabled={isDefaultValue || !overridePublisherDefault}
                                >
                                    <SVG ariaHidden svg={ReturnIcon} />
                                </button>
                                <div className={stylesSettings.size_range_buttons}>
                                    <button
                                        onClick={() => stepSpacingValue(option.parameter, "out")}
                                        className={stylesSettings.scale_button_left}
                                        aria-label={__("accessibility.decreaseSetting", { setting: option.title })}
                                        disabled={!canDecrease || !overridePublisherDefault}
                                    >
                                        <SVG ariaHidden svg={MinusIcon} />
                                    </button>
                                    <button
                                        onClick={() => stepSpacingValue(option.parameter, "in")}
                                        className={stylesSettings.scale_button_right}
                                        aria-label={__("accessibility.increaseSetting", { setting: option.title })}
                                        disabled={!canIncrease || !overridePublisherDefault}
                                    >
                                        <SVG ariaHidden svg={PlusIcon} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

};
