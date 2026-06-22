// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";

import * as React from "react";

import SVG from "readium-desktop/renderer/common/components/SVG";
import * as CheckIcon from "readium-desktop/renderer/assets/icons/singlecheck-icon.svg";
import { IReaderSettingsProps } from "readium-desktop/renderer/reader/components/options-values";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useReaderConfigAll, useSaveReaderConfigDebounced } from "readium-desktop/renderer/common/hooks/useReaderConfig";

export const ReadingDisplayCheckboxSettings = ({
    disableRTLFlip,
    setDisableRTLFlip,
}:
    {
        disableRTLFlip: IReaderSettingsProps["disableRTLFlip"],
        setDisableRTLFlip: IReaderSettingsProps["setDisableRTLFlip"],
    },
) => {
    const [__] = useTranslator();

    const set = useSaveReaderConfigDebounced();
    const { enableMathJax, reduceMotion, noFootnotes, noTemporaryNavTargetOutline, noRuby } = useReaderConfigAll();

    const options = [
        {
            id: "mathjax",
            name: "mathjax",
            label: __("reader.settings.mathjax"),
            description: __("reader.settings.mathjaxDescription"),
            checked: enableMathJax,
            onChange: () => {
                if (enableMathJax === false) {
                    set({ paged: false, enableMathJax: true });
                    return;
                }
                set({ enableMathJax: false });
            },
        },
        {
            id: "reduceMotionCheckBox",
            name: "reduceMotionCheckBox",
            label: __("reader.settings.reduceMotion"),
            checked: reduceMotion,
            onChange: () => {
                set({ reduceMotion: !reduceMotion });
            },
        },
        {
            id: "noFootnotesCheckBox",
            name: "noFootnotesCheckBox",
            label: __("reader.settings.noFootnotes"),
            checked: noFootnotes,
            onChange: () => {
                set({ noFootnotes: !noFootnotes });
            },
        },
        {
            id: "noTemporaryNavTargetOutlineCheckBox",
            name: "noTemporaryNavTargetOutlineCheckBox",
            label: __("reader.settings.noTemporaryNavTargetOutline"),
            checked: noTemporaryNavTargetOutline,
            onChange: () => {
                set({ noTemporaryNavTargetOutline: !noTemporaryNavTargetOutline });
            },
        },
        {
            id: "noRubyCheckBox",
            name: "noRubyCheckBox",
            label: __("reader.settings.noRuby"),
            checked: noRuby,
            onChange: () => {
                set({ noRuby: !noRuby });
            },
        },
        {
            id: "noRTLFlipCheckBox",
            name: "noRTLFlipCheckBox",
            label: __("reader.settings.noRTLFlip"),
            checked: disableRTLFlip,
            onChange: () => {
                setDisableRTLFlip(!disableRTLFlip);
            },
        },
    ];

    return (
        <div>
            {options.map((option) => (
                <section key={option.id}>
                    <div className={stylesReader.display_checkbox_section}>
                        <input
                            id={option.id}
                            type="checkbox"
                            name={option.name}
                            onChange={option.onChange}
                            defaultChecked={option.checked}
                            className={stylesGlobal.checkbox_custom_input}
                        />
                        <label htmlFor={option.id} style={{ margin: "0 5px", height: "unset" }} className={stylesGlobal.checkbox_custom_label}>
                            <div
                                tabIndex={0}
                                role="checkbox"
                                aria-checked={option.checked}
                                aria-label={option.label}
                                onKeyDown={(e) => {
                                    // if (e.code === "Space") {
                                    if (e.key === " ") {
                                        e.preventDefault(); // prevent scroll
                                    }
                                }}
                                onKeyUp={(e) => {
                                    // if (e.code === "Space") {
                                    if (e.key === " ") {
                                        e.preventDefault();
                                        option.onChange();
                                    }
                                }}
                                className={stylesGlobal.checkbox_custom}
                                style={{ border: option.checked ? "2px solid transparent" : "2px solid var(--color-text-primary)", backgroundColor: option.checked ? "var(--color-brand-primary)" : "transparent" }}>
                                {option.checked ?
                                    <SVG ariaHidden svg={CheckIcon} />
                                    :
                                    <></>
                                }
                            </div>
                            <span aria-hidden>
                                {option.label}
                            </span>
                        </label>
                    </div>
                </section>

            ))}
        </div>
    );
};
