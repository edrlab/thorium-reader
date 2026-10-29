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
import { PrettifyKeyboardShortcut } from "./Keyboard";

export interface MyProps {
    label?: string;
    tooltipkeyboardShortcuts?: TKeyboardShortcut[];
    tooltipkeyboardShortcutsNames?: string[];
    tooltipkeyboardShortcutsDescriptions?: string[];
}
export const ToolTippy: React.FC<React.PropsWithChildren<MyProps & TooltipProps>> = ({ label, tooltipkeyboardShortcuts, tooltipkeyboardShortcutsNames, tooltipkeyboardShortcutsDescriptions, ...otherProps }) => {

    return <Tooltip {...mergeProps({ placement: "top", offset: 0, className: classNames("tooltipKeyboardShortcut") } satisfies TooltipProps, otherProps)}>
        <OverlayArrow><svg width={10} height={10} viewBox="0 0 8 8"><path d="M0 0 L4 4 L8 0" /></svg></OverlayArrow>
        {label ? (<section>{ label }</section>) : <></>}
            {tooltipkeyboardShortcuts?.length ? tooltipkeyboardShortcuts.length === 1 ? <>
                <p><PrettifyKeyboardShortcut hideFromScreenReaders={false} def={tooltipkeyboardShortcuts[0]} /></p>
                {
                    (tooltipkeyboardShortcutsNames[0] ? (<p>{tooltipkeyboardShortcutsNames[0]}</p>) : (<></>))
                }{
                    (tooltipkeyboardShortcutsDescriptions[0] ? (<p>{tooltipkeyboardShortcutsDescriptions[0]}</p>) : (<></>))
                }</> : <>
                    {
                        tooltipkeyboardShortcuts.map((tooltipkeyboardShortcut, i) => {
                            return <div key={`tooltipkeyboardShortcuts_${i}`}>
                                <p><PrettifyKeyboardShortcut hideFromScreenReaders={false} def={tooltipkeyboardShortcut} /></p>
                                {
                                    (tooltipkeyboardShortcutsNames?.[i] ? (<p>{tooltipkeyboardShortcutsNames?.[i]}</p>) : (<></>))
                                }{
                                    (tooltipkeyboardShortcutsDescriptions?.[i] ? (<p>{tooltipkeyboardShortcutsDescriptions?.[i]}</p>) : (<></>))
                                }
                            </div>;
                        })
                    }</>
                : <></>}
        </Tooltip>;
};
