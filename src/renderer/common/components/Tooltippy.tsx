// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { mergeProps } from "react-aria";
import { OverlayArrow, Tooltip, TooltipProps } from "react-aria-components";
import { TKeyboardShortcut } from "readium-desktop/common/keyboard";
import { textualizeKeyboardShortcut } from "readium-desktop/renderer/common/keyboard";
import { PrettifyKeyboardShortcut } from "./Keyboard";

export interface MyProps {
    immediate?: boolean;
    label?: string;
    tooltipkeyboardShortcuts?: TKeyboardShortcut[];
    tooltipkeyboardShortcutsNames?: string[];
    tooltipkeyboardShortcutsDescriptions?: string[];
}

export const TOOLTIP_HOVER_DELAY = 400;
export const TOOLTIP_HOVER_DELAY_EXTRA = 2000;

export const ToolTippy: React.FC<React.PropsWithChildren<MyProps & TooltipProps>> = ({ immediate, label, tooltipkeyboardShortcuts, tooltipkeyboardShortcutsNames, tooltipkeyboardShortcutsDescriptions, ...otherProps }) => {

    const desc = (label ? label : "") + tooltipkeyboardShortcuts?.length ? tooltipkeyboardShortcuts.reduce((prev, cur, i) => {
        return prev + " // " + `${textualizeKeyboardShortcut(cur)} [${tooltipkeyboardShortcutsNames[i]}]`; // + ` <${tooltipkeyboardShortcutsDescriptions[i]}>`
    }, "")  : "";
    return <Tooltip
        aria-label={desc}
        {...mergeProps({
            placement: "top",
            offset: 0,
            className: classNames("tooltipKeyboardShortcut", immediate ? "immediate" : undefined),
        } satisfies TooltipProps,
        otherProps)} // overrides placement and offset, merges classNames
    >
        <OverlayArrow><svg width={10} height={10} viewBox="0 0 8 8"><path d="M0 0 L4 4 L8 0" /></svg></OverlayArrow>

        <div
            className={"tooltipKeyboardShortcut_primary"}
        >
            {label ?
                (<p
                    className={"tooltipKeyboardShortcut_label"}
                >
                    {label}
                </p>) :
                <></>}
        </div>
        <div
            className={"tooltipKeyboardShortcut_secondary"}
        >
            {tooltipkeyboardShortcuts?.length ? tooltipkeyboardShortcuts.map((tooltipkeyboardShortcut, i) => {
                return <div
                    key={`tooltipkeyboardShortcuts_${i}`}
                >
                    {
                        i === 0 ?
                        <div className={"pie-timer-wrapper"} aria-hidden>
                            <div className={"pie spinner"}></div>
                            <div className={"pie filler"}></div>
                            <div className={"mask"}></div>
                        </div> :
                        <></>
                    }
                    <p
                        className={"tooltipKeyboardShortcut_pretty"}>
                        <PrettifyKeyboardShortcut
                            hideFromScreenReaders={false}
                            def={tooltipkeyboardShortcut}
                        />
                    </p>
                    {<p
                        className={"tooltipKeyboardShortcut_name"}
                        title={tooltipkeyboardShortcutsDescriptions?.[i]}
                    >
                        {tooltipkeyboardShortcutsNames?.[i]}
                    </p>}
                </div>;
            }) : <></>}
        </div>

        </Tooltip>;
};
