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
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { usePublisherReaderConfig, useSavePublisherReaderConfigDebounced } from "readium-desktop/renderer/common/hooks/useReaderConfig";

export const FontSize = () => {
    const [__] = useTranslator();

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
        <section>
            <h3>{__("reader.settings.fontSize")} ({fontSize})</h3>
            <div className={stylesSettings.size_range}>
                <button 
                onClick={() => {
                    const newValue = "100%";
                    setCurrentSliderValue(newValue.replace(/%/g, ""));
                    set({ fontSize: newValue });
                }
                } className={stylesSettings.reset_button} title={__("reader.settings.defaultValue")}>
                    <SVG ariaHidden svg={ResetIcon} />
                </button>
                <button 
                onClick={() => click("out")} 
                className={stylesSettings.scale_button}
                aria-label={__("reader.settings.reduceFontSize")}
                ><SVG ariaHidden svg={MinusIcon} /></button>
                <input
                    type="range"
                    aria-labelledby="label_fontSize"
                    min={75}
                    max={400}
                    step={12.5}
                    aria-valuemin={0}
                    value={currentSliderValue}
                    onChange={(e) => {
                        const newValue = e.target?.value || "100";
                        setCurrentSliderValue(newValue);
                        set({ fontSize: newValue + "%" });
                    }
                    }
                    className={currentSliderValue === "100" ? stylesSettings.range_inactive : ""}
                />
                <button 
                onClick={() => click("in")} 
                className={stylesSettings.scale_button}
                aria-label={__("reader.settings.increaseFontSize")}
                ><SVG ariaHidden svg={PlusIcon} /></button>
            </div>
        </section>
    );
};
