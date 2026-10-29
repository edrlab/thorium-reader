// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { langStringIsRTL } from "@r2-shared-js/_utils/language-string";
import classNames from "classnames";
import * as React from "react";
import { Focusable, OverlayArrow, Tooltip, TooltipTrigger } from "react-aria-components";
import { screenReaderActions } from "readium-desktop/common/redux/actions";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";
import * as CheckIcon from "readium-desktop/renderer/assets/icons/singlecheck-icon.svg";
import * as stylesAnnotations from "readium-desktop/renderer/assets/styles/components/annotations.scss";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import { PrettifyKeyboardShortcut } from "readium-desktop/renderer/common/components/Keyboard";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { textualizeKeyboardShortcut } from "readium-desktop/renderer/common/keyboard";
import { logAppSettingModified } from "./analytics";

const ScreenReaderSettings: React.FC<{}> = () => {
    const [__] = useTranslator();
    // const locale = useSelector((state: IRendererCommonRootState) => state.i18n.locale);
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const isRTL = langStringIsRTL(locale);
    const dispatch = useDispatch();
    const screenReaderActivate = useSelector((state: ICommonRootState) => state.screenReader.activate);
    const onChange = () => {
        const nextScreenReaderActivate = !screenReaderActivate;
        dispatch(screenReaderActions.save.build(nextScreenReaderActivate, nextScreenReaderActivate));
        logAppSettingModified("screenreader", nextScreenReaderActivate);
    };
    const keyboardShortcuts = useSelector((state: ILibraryRootState) => state.keyboard.shortcuts);
    const keyboardShortcutScreenReaderOptimize = textualizeKeyboardShortcut(keyboardShortcuts.ToggleScreenReaderOptimize);
    return (
        <section className={stylesSettings.section} style={{ position: "relative" }}>
            <h3 dir={isRTL ? "rtl" : "ltr"}>{__("settings.screenReaderActivate.message")}</h3>
            <div className={stylesSettings.session_text} style={{ margin: "0" }}>
                <SVG ariaHidden svg={InfoIcon} />
                <p dir={isRTL ? "rtl" : "ltr"}>{__("settings.screenReaderActivate.help")}</p>
            </div>
            <div dir={isRTL ? "rtl" : "ltr"} className={stylesAnnotations.annotations_checkbox}>
                <TooltipTrigger delay={500} closeDelay={0} trigger="hover">

                <input type="checkbox" id="screenReaderSettings" className={stylesGlobal.checkbox_custom_input} name="screenReaderSettings" checked={screenReaderActivate} onChange={onChange} />
                <Focusable excludeFromTabOrder>
                <label htmlFor="screenReaderSettings" className={stylesGlobal.checkbox_custom_label}>
                    <div
                        tabIndex={0}
                        role="checkbox"
                        aria-checked={screenReaderActivate}
                        aria-label={__("settings.screenReaderActivate.title") + ` [${keyboardShortcutScreenReaderOptimize}]` + ` (${__("settings.keyboard.list.ToggleScreenReaderOptimize.name")})` + ` <${__("settings.keyboard.list.ToggleScreenReaderOptimize.description")}>`}
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
                                onChange();
                            }
                        }}
                        className={stylesGlobal.checkbox_custom}
                        style={{ border: screenReaderActivate ? "2px solid transparent" : "2px solid var(--color-text-primary)", backgroundColor: screenReaderActivate ? "var(--color-brand-primary)" : "transparent" }}>
                        {screenReaderActivate ?
                            <SVG ariaHidden svg={CheckIcon} />
                            :
                            <></>
                        }
                    </div>
                    <span aria-hidden dir={isRTL ? "rtl" : "ltr"}>{__("settings.screenReaderActivate.title")}</span>
                    </label>
                </Focusable>
                <Tooltip placement="top" offset={0} className={classNames("tooltipKeyboardShortcut")}>
                <OverlayArrow><svg width={10} height={10} viewBox="0 0 8 8"><path d="M0 0 L4 4 L8 0" /></svg></OverlayArrow>
                <p><PrettifyKeyboardShortcut def={keyboardShortcuts.ToggleScreenReaderOptimize} /></p>
                <p>{__("settings.keyboard.list.ToggleScreenReaderOptimize.name")}</p>
                <p>{__("settings.keyboard.list.ToggleScreenReaderOptimize.description")}</p>
                </Tooltip>
                </TooltipTrigger>
            </div>
        </section>
    );
};

export default ScreenReaderSettings;
