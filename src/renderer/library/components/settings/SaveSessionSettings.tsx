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
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";
import { sessionActions } from "readium-desktop/common/redux/actions";
import * as CheckIcon from "readium-desktop/renderer/assets/icons/singlecheck-icon.svg";

const SaveSessionSettings: React.FC<{}> = () => {
    const [__] = useTranslator();
    // const locale = useSelector((state: IRendererCommonRootState) => state.i18n.locale);
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const isRTL = langStringIsRTL(locale);
    const dispatch = useDispatch();
    const sessionSaveState = useSelector((state: ICommonRootState) => state.session.save);
    const onChange = () => {
        dispatch(sessionActions.save.build(!sessionSaveState));
    };
    return (
        <section className={stylesSettings.section} style={{ position: "relative" }}>
            <h4 dir={isRTL ? "rtl" : "ltr"}>{__("app.session.exit.askBox.message")}</h4>
            <div className={stylesSettings.session_text} style={{ margin: "0" }}>
                <SVG ariaHidden svg={InfoIcon} />
                <p dir={isRTL ? "rtl" : "ltr"}>{__("app.session.exit.askBox.help")}</p>
            </div>
            <div dir={isRTL ? "rtl" : "ltr"} className={stylesAnnotations.annotations_checkbox}>
                <input type="checkbox" id="saveSessionSettings" className={stylesGlobal.checkbox_custom_input} name="saveSessionSettings" checked={sessionSaveState} onChange={onChange} />
                <label htmlFor="saveSessionSettings" className={stylesGlobal.checkbox_custom_label}>
                    <div
                        tabIndex={0}
                        role="checkbox"
                        aria-checked={sessionSaveState}
                        aria-label={__("settings.session.title")}
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
                        style={{ border: sessionSaveState ? "2px solid transparent" : "2px solid var(--color-text-primary)", backgroundColor: sessionSaveState ? "var(--color-brand-primary)" : "transparent" }}>
                        {sessionSaveState ?
                            <SVG ariaHidden svg={CheckIcon} />
                            :
                            <></>
                        }
                    </div>
                    <div aria-hidden>
                        <h4 dir={isRTL ? "rtl" : "ltr"}>{__("settings.session.title")}</h4>
                    </div>
                </label>
            </div>
        </section>
    );
};

export default SaveSessionSettings;
