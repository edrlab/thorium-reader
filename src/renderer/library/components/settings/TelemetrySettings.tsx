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

const TelemetrySettings: React.FC<{}> = () => {

    const [__] = useTranslator();
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const isRTL = langStringIsRTL(locale);
    const dispatch = useDispatch();
    const disableGoogleAnalyticsTelemetry = useSelector((state: ILibraryRootState) =>
        state.settings.disableGoogleAnalyticsTelemetry === true);

    const toggleDisableGoogleAnalyticsTelemetry = () => {
        dispatch(settingsActions.disableGoogleAnalyticsTelemetry.build(!disableGoogleAnalyticsTelemetry));
    };

    return (
        <section className={stylesSettings.section} style={{ gap: "10px" }}>
            <h3 dir={isRTL ? "rtl" : "ltr"}>{__("settings.telemetry.title")}</h3>
            <div dir={isRTL ? "rtl" : "ltr"} className={stylesAnnotations.annotations_checkbox}>
                <input type="checkbox" id="disableGoogleAnalyticsTelemetry" className={stylesGlobal.checkbox_custom_input} name="disableGoogleAnalyticsTelemetry" checked={disableGoogleAnalyticsTelemetry} onChange={toggleDisableGoogleAnalyticsTelemetry} />
                <label htmlFor="disableGoogleAnalyticsTelemetry" className={stylesGlobal.checkbox_custom_label}>
                    <div
                        tabIndex={0}
                        role="checkbox"
                        aria-checked={disableGoogleAnalyticsTelemetry}
                        aria-label={__("settings.telemetry.disableGoogleAnalyticsTelemetry")}
                        onKeyDown={(e) => {
                            if (e.key === " ") {
                                e.preventDefault();
                            }
                        }}
                        onKeyUp={(e) => {
                            if (e.key === " ") {
                                e.preventDefault();
                                toggleDisableGoogleAnalyticsTelemetry();
                            }
                        }}
                        className={stylesGlobal.checkbox_custom}
                        style={{ border: disableGoogleAnalyticsTelemetry ? "2px solid transparent" : "2px solid var(--color-text-primary)", backgroundColor: disableGoogleAnalyticsTelemetry ? "var(--color-brand-primary)" : "transparent" }}>
                        {disableGoogleAnalyticsTelemetry ?
                            <SVG ariaHidden svg={CheckIcon} />
                            :
                            <></>
                        }
                    </div>
                    <div aria-hidden>
                        <h4 dir={isRTL ? "rtl" : "ltr"}>{__("settings.telemetry.disableGoogleAnalyticsTelemetry")}</h4>
                        <p dir={isRTL ? "rtl" : "ltr"}>{__("settings.telemetry.disableGoogleAnalyticsTelemetryDescription")}</p>
                    </div>
                </label>
            </div>
        </section>
    );
};

export default TelemetrySettings;
