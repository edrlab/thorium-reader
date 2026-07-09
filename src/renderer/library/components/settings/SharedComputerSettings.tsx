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
import { settingsLcpAutoDeleteExpiredPublicationsIsEnabled } from "readium-desktop/common/redux/states/settings";

const SharedComputerSettings = () => {

    const [__] = useTranslator();
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const isRTL = langStringIsRTL(locale);
    const dispatch = useDispatch();
    const lcpAutoDeleteExpiredPublications = useSelector((state: ILibraryRootState) =>
        settingsLcpAutoDeleteExpiredPublicationsIsEnabled(state.settings));
    const lcpAutoDeleteExpiredPublicationsForced = useSelector((state: ILibraryRootState) =>
        state.settings.lcpAutoDeleteExpiredPublicationsForced === true);

    const toggleLcpAutoDeleteExpiredPublications = () => {
        if (lcpAutoDeleteExpiredPublicationsForced) {
            return;
        }
        dispatch(settingsActions.lcpAutoDeleteExpiredPublications.build(!lcpAutoDeleteExpiredPublications));
    };

    return (
        <section className={stylesSettings.section} style={{ gap: "10px" }}>
            <h3 dir={isRTL ? "rtl" : "ltr"}>{__("settings.sharedComputer.title")}</h3>
            <div dir={isRTL ? "rtl" : "ltr"} className={stylesAnnotations.annotations_checkbox}>
                <input type="checkbox" id="lcpAutoDeleteExpiredPublications" className={stylesGlobal.checkbox_custom_input} name="lcpAutoDeleteExpiredPublications" checked={lcpAutoDeleteExpiredPublications} disabled={lcpAutoDeleteExpiredPublicationsForced} onChange={toggleLcpAutoDeleteExpiredPublications} />
                <label htmlFor="lcpAutoDeleteExpiredPublications" className={stylesGlobal.checkbox_custom_label}>
                    <div
                        tabIndex={lcpAutoDeleteExpiredPublicationsForced ? -1 : 0}
                        role="checkbox"
                        aria-checked={lcpAutoDeleteExpiredPublications}
                        aria-disabled={lcpAutoDeleteExpiredPublicationsForced}
                        aria-label={__("settings.sharedComputer.lcpAutoDeleteExpiredPublications")}
                        onKeyDown={(e) => {
                            if (e.key === " ") {
                                e.preventDefault();
                            }
                        }}
                        onKeyUp={(e) => {
                            if (e.key === " ") {
                                e.preventDefault();
                                toggleLcpAutoDeleteExpiredPublications();
                            }
                        }}
                        className={stylesGlobal.checkbox_custom}
                        style={{
                            border: lcpAutoDeleteExpiredPublications ? "2px solid transparent" : "2px solid var(--color-text-primary)",
                            backgroundColor: lcpAutoDeleteExpiredPublications ? "var(--color-brand-primary)" : "transparent",
                            cursor: lcpAutoDeleteExpiredPublicationsForced ? "not-allowed" : undefined,
                            opacity: lcpAutoDeleteExpiredPublicationsForced ? 0.65 : undefined,
                        }}>
                        {lcpAutoDeleteExpiredPublications ?
                            <SVG ariaHidden svg={CheckIcon} />
                            :
                            <></>
                        }
                    </div>
                    <div aria-hidden>
                        <h3 dir={isRTL ? "rtl" : "ltr"}>{__("settings.sharedComputer.lcpAutoDeleteExpiredPublications")}</h3>
                        <p dir={isRTL ? "rtl" : "ltr"}>{__("settings.sharedComputer.lcpAutoDeleteExpiredPublicationsDescription")}</p>
                    </div>
                </label>
            </div>
        </section>
    );
};

export default SharedComputerSettings;
