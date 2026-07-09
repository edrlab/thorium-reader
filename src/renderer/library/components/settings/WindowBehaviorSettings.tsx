// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import * as stylesAnnotations from "readium-desktop/renderer/assets/styles/components/annotations.scss";
import { langStringIsRTL } from "@r2-shared-js/_utils/language-string";
import * as React from "react";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { settingsActions } from "readium-desktop/common/redux/actions";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import * as CheckIcon from "readium-desktop/renderer/assets/icons/singlecheck-icon.svg";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import os from "node:os";

const IS_WINDOWS = os.platform() === "win32";

const WindowBehaviorSettings: React.FC<{}> = () => {

    const [__] = useTranslator();
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const isRTL = langStringIsRTL(locale);
    const dispatch = useDispatch();
    const minimizeLibraryToTray = useSelector((state: ILibraryRootState) =>
        state.settings.minimizeLibraryToTray === true);
    const keepLibraryWindowInBackgroundOnReaderOpen = useSelector((state: ILibraryRootState) =>
        state.settings.keepLibraryWindowInBackgroundOnReaderOpen === true);
    const keepLibraryWindowInBackgroundOnReaderClose = useSelector((state: ILibraryRootState) =>
        state.settings.keepLibraryWindowInBackgroundOnReaderClose === true);
    const oneReaderWindowPerPublication = useSelector((state: ILibraryRootState) =>
        state.settings.oneReaderWindowPerPublication === true);

    const toggleMinimizeLibraryToTray = () => {
        dispatch(settingsActions.minimizeLibraryToTray.build(!minimizeLibraryToTray));
    };
    const toggleKeepLibraryWindowInBackgroundOnReaderOpen = () => {
        dispatch(settingsActions.keepLibraryWindowInBackgroundOnReaderOpen.build(!keepLibraryWindowInBackgroundOnReaderOpen));
    };
    const toggleKeepLibraryWindowInBackgroundOnReaderClose = () => {
        dispatch(settingsActions.keepLibraryWindowInBackgroundOnReaderClose.build(!keepLibraryWindowInBackgroundOnReaderClose));
    };
    const toggleOneReaderWindowPerPublication = () => {
        dispatch(settingsActions.oneReaderWindowPerPublication.build(!oneReaderWindowPerPublication));
    };

    return (
        <section className={stylesSettings.section} style={{ gap: "10px" }}>
            <h3 dir={isRTL ? "rtl" : "ltr"}>{__("settings.window.title")}</h3>
            {IS_WINDOWS ? <div dir={isRTL ? "rtl" : "ltr"} className={stylesAnnotations.annotations_checkbox}>
                <input type="checkbox" id="minimizeLibraryToTray" className={stylesGlobal.checkbox_custom_input} name="minimizeLibraryToTray" checked={minimizeLibraryToTray} onChange={toggleMinimizeLibraryToTray} />
                <label htmlFor="minimizeLibraryToTray" className={stylesGlobal.checkbox_custom_label}>
                    <div
                        tabIndex={0}
                        role="checkbox"
                        aria-checked={minimizeLibraryToTray}
                        aria-label={__("settings.window.minimizeLibraryToTray")}
                        onKeyDown={(e) => {
                            if (e.key === " ") {
                                e.preventDefault();
                            }
                        }}
                        onKeyUp={(e) => {
                            if (e.key === " ") {
                                e.preventDefault();
                                toggleMinimizeLibraryToTray();
                            }
                        }}
                        className={stylesGlobal.checkbox_custom}
                        style={{ border: minimizeLibraryToTray ? "2px solid transparent" : "2px solid var(--color-text-primary)", backgroundColor: minimizeLibraryToTray ? "var(--color-brand-primary)" : "transparent" }}>
                        {minimizeLibraryToTray ?
                            <SVG ariaHidden svg={CheckIcon} />
                            :
                            <></>
                        }
                    </div>
                    <div aria-hidden>
                        <h3 dir={isRTL ? "rtl" : "ltr"}>{__("settings.window.minimizeLibraryToTray")}</h3>
                        <p dir={isRTL ? "rtl" : "ltr"}>{__("settings.window.minimizeLibraryToTrayDescription")}</p>
                    </div>
                </label>
            </div> : <></>}
            <div dir={isRTL ? "rtl" : "ltr"} className={stylesAnnotations.annotations_checkbox}>
                <input type="checkbox" id="keepLibraryWindowInBackgroundOnReaderOpen" className={stylesGlobal.checkbox_custom_input} name="keepLibraryWindowInBackgroundOnReaderOpen" checked={keepLibraryWindowInBackgroundOnReaderOpen} onChange={toggleKeepLibraryWindowInBackgroundOnReaderOpen} />
                <label htmlFor="keepLibraryWindowInBackgroundOnReaderOpen" className={stylesGlobal.checkbox_custom_label}>
                    <div
                        tabIndex={0}
                        role="checkbox"
                        aria-checked={keepLibraryWindowInBackgroundOnReaderOpen}
                        aria-label={__("settings.window.keepLibraryWindowInBackgroundOnReaderOpen")}
                        onKeyDown={(e) => {
                            if (e.key === " ") {
                                e.preventDefault();
                            }
                        }}
                        onKeyUp={(e) => {
                            if (e.key === " ") {
                                e.preventDefault();
                                toggleKeepLibraryWindowInBackgroundOnReaderOpen();
                            }
                        }}
                        className={stylesGlobal.checkbox_custom}
                        style={{ border: keepLibraryWindowInBackgroundOnReaderOpen ? "2px solid transparent" : "2px solid var(--color-text-primary)", backgroundColor: keepLibraryWindowInBackgroundOnReaderOpen ? "var(--color-brand-primary)" : "transparent" }}>
                        {keepLibraryWindowInBackgroundOnReaderOpen ?
                            <SVG ariaHidden svg={CheckIcon} />
                            :
                            <></>
                        }
                    </div>
                    <div aria-hidden>
                        <h3 dir={isRTL ? "rtl" : "ltr"}>{__("settings.window.keepLibraryWindowInBackgroundOnReaderOpen")}</h3>
                        <p dir={isRTL ? "rtl" : "ltr"}>{__("settings.window.keepLibraryWindowInBackgroundOnReaderOpenDescription")}</p>
                    </div>
                </label>
            </div>
            <div dir={isRTL ? "rtl" : "ltr"} className={stylesAnnotations.annotations_checkbox}>
                <input type="checkbox" id="keepLibraryWindowInBackgroundOnReaderClose" className={stylesGlobal.checkbox_custom_input} name="keepLibraryWindowInBackgroundOnReaderClose" checked={keepLibraryWindowInBackgroundOnReaderClose} onChange={toggleKeepLibraryWindowInBackgroundOnReaderClose} />
                <label htmlFor="keepLibraryWindowInBackgroundOnReaderClose" className={stylesGlobal.checkbox_custom_label}>
                    <div
                        tabIndex={0}
                        role="checkbox"
                        aria-checked={keepLibraryWindowInBackgroundOnReaderClose}
                        aria-label={__("settings.window.keepLibraryWindowInBackgroundOnReaderClose")}
                        onKeyDown={(e) => {
                            if (e.key === " ") {
                                e.preventDefault();
                            }
                        }}
                        onKeyUp={(e) => {
                            if (e.key === " ") {
                                e.preventDefault();
                                toggleKeepLibraryWindowInBackgroundOnReaderClose();
                            }
                        }}
                        className={stylesGlobal.checkbox_custom}
                        style={{ border: keepLibraryWindowInBackgroundOnReaderClose ? "2px solid transparent" : "2px solid var(--color-text-primary)", backgroundColor: keepLibraryWindowInBackgroundOnReaderClose ? "var(--color-brand-primary)" : "transparent" }}>
                        {keepLibraryWindowInBackgroundOnReaderClose ?
                            <SVG ariaHidden svg={CheckIcon} />
                            :
                            <></>
                        }
                    </div>
                    <div aria-hidden>
                        <h3 dir={isRTL ? "rtl" : "ltr"}>{__("settings.window.keepLibraryWindowInBackgroundOnReaderClose")}</h3>
                        <p dir={isRTL ? "rtl" : "ltr"}>{__("settings.window.keepLibraryWindowInBackgroundOnReaderCloseDescription")}</p>
                    </div>
                </label>
            </div>
            <div dir={isRTL ? "rtl" : "ltr"} className={stylesAnnotations.annotations_checkbox}>
                <input type="checkbox" id="oneReaderWindowPerPublication" className={stylesGlobal.checkbox_custom_input} name="oneReaderWindowPerPublication" checked={oneReaderWindowPerPublication} onChange={toggleOneReaderWindowPerPublication} />
                <label htmlFor="oneReaderWindowPerPublication" className={stylesGlobal.checkbox_custom_label}>
                    <div
                        tabIndex={0}
                        role="checkbox"
                        aria-checked={oneReaderWindowPerPublication}
                        aria-label={__("settings.window.oneReaderWindowPerPublication")}
                        onKeyDown={(e) => {
                            if (e.key === " ") {
                                e.preventDefault();
                            }
                        }}
                        onKeyUp={(e) => {
                            if (e.key === " ") {
                                e.preventDefault();
                                toggleOneReaderWindowPerPublication();
                            }
                        }}
                        className={stylesGlobal.checkbox_custom}
                        style={{ border: oneReaderWindowPerPublication ? "2px solid transparent" : "2px solid var(--color-text-primary)", backgroundColor: oneReaderWindowPerPublication ? "var(--color-brand-primary)" : "transparent" }}>
                        {oneReaderWindowPerPublication ?
                            <SVG ariaHidden svg={CheckIcon} />
                            :
                            <></>
                        }
                    </div>
                    <div aria-hidden>
                        <h3 dir={isRTL ? "rtl" : "ltr"}>{__("settings.window.oneReaderWindowPerPublication")}</h3>
                        <p dir={isRTL ? "rtl" : "ltr"}>{__("settings.window.oneReaderWindowPerPublicationDescription")}</p>
                    </div>
                </label>
            </div>
        </section>
    );
};

export default WindowBehaviorSettings;
