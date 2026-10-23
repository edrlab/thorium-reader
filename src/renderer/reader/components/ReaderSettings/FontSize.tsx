// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as React from "react";
import SVG from "readium-desktop/renderer/common/components/SVG";
// import * as ResetIcon from "readium-desktop/renderer/assets/icons/clock-reverse-icon.svg";
import * as ReturnIcon from "readium-desktop/renderer/assets/icons/return-icon.svg";
import * as MinusIcon from "readium-desktop/renderer/assets/icons/Minus-Bold.svg";
import * as PlusIcon from "readium-desktop/renderer/assets/icons/Plus-bold.svg";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { usePublisherReaderConfig, useSavePublisherReaderConfigDebounced } from "readium-desktop/renderer/common/hooks/useReaderConfig";

export const FontSize = ({ overridePublisherDefault }: { overridePublisherDefault: boolean }) => {
    const [__] = useTranslator();
    const labelId = React.useId();

    const fontSize = usePublisherReaderConfig("fontSize");
    const set = useSavePublisherReaderConfigDebounced();

    const [currentSliderValue, setCurrentSliderValue] = React.useState(fontSize.replace(/%/g, ""));

    React.useEffect(() => {
        setCurrentSliderValue(fontSize.replace(/%/g, ""));
    }, [fontSize]);

    const click = (direction: string) => {
        const step = 12.5;
        let newStepValue: number;

        if (direction === "out") {
            newStepValue = Number(currentSliderValue.replace(/%/g, "")) - step;
        } else {
            newStepValue = Number(currentSliderValue.replace(/%/g, "")) + step;
        }
        const clampedValue = Math.min(Math.max(newStepValue, 75), 400);
        const valueToString = clampedValue.toFixed(1);
        setCurrentSliderValue(valueToString);
        set({ fontSize: valueToString + "%" });
    };

    return (
            <div className={stylesSettings.range_size_container}>
                {/* <label htmlFor={labelId}>{__("reader.settings.fontSize")}</label> */}
                <label htmlFor={labelId}>Size</label>
                <div className={stylesSettings.size_range}>
                    {fontSize !== "100.0%" && overridePublisherDefault ?
                        <button
                            onClick={() => {
                                const newValue = "100.0%";
                                setCurrentSliderValue(newValue.replace(/%/g, ""));
                                set({ fontSize: newValue });
                            }
                            } className={stylesSettings.reset_button} title={__("accessibility.resetSetting", { setting: __("reader.settings.fontSize") })}>
                            <SVG ariaHidden svg={ReturnIcon} />
                        </button>
                        : <></>}
                    <span>{fontSize}</span>
                    <div className={stylesSettings.size_range_buttons}>
                    <button
                        onClick={() => click("out")}
                        className={stylesSettings.scale_button_left}
                        aria-label={__("reader.settings.reduceFontSize")}
                        disabled={!overridePublisherDefault}
                    ><SVG ariaHidden svg={MinusIcon} /></button>
                    <button
                        onClick={() => click("in")}
                        className={stylesSettings.scale_button_right}
                        aria-label={__("reader.settings.increaseFontSize")}
                        disabled={!overridePublisherDefault}
                    ><SVG ariaHidden svg={PlusIcon} /></button>
                </div>
                </div>
            </div>
    );
};

