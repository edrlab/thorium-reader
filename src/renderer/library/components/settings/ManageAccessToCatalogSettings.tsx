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
import { ApiappHowDoesItWorkInfoBox } from "../dialog/ApiappAddForm";
import { logAppSettingModified } from "./analytics";

const ManageAccessToCatalogSettings = () => {

    const [__] = useTranslator();
    // const locale = useSelector((state: IRendererCommonRootState) => state.i18n.locale);
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const isRTL = langStringIsRTL(locale);
    const dispatch = useDispatch();
    const enableAPIAPP = useSelector((state: ILibraryRootState) => state.settings.enableAPIAPP);

    const toggleEnableAPIAPP = () => {
        const nextEnableAPIAPP = !enableAPIAPP;
        dispatch(settingsActions.enableAPIAPP.build(nextEnableAPIAPP));
        logAppSettingModified("pnb", nextEnableAPIAPP);
    };

    return (
        <section className={stylesSettings.section} style={{ gap: "10px" }}>
            <h3 dir={isRTL ? "rtl" : "ltr"}>{__("settings.library.title")}</h3>
            <div dir={isRTL ? "rtl" : "ltr"} className={stylesAnnotations.annotations_checkbox}>
                <input type="checkbox" id="enableAPIAPP" className={stylesGlobal.checkbox_custom_input} name="enableAPIAPP" checked={enableAPIAPP} onChange={toggleEnableAPIAPP} />
                <label htmlFor="enableAPIAPP" className={stylesGlobal.checkbox_custom_label}>
                    <div
                        tabIndex={0}
                        role="checkbox"
                        aria-checked={enableAPIAPP}
                        aria-label={__("settings.library.enableAPIAPP")}
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
                                toggleEnableAPIAPP();
                            }
                        }}
                        className={stylesGlobal.checkbox_custom}
                        style={{ border: enableAPIAPP ? "2px solid transparent" : "2px solid var(--color-text-primary)", backgroundColor: enableAPIAPP ? "var(--color-brand-primary)" : "transparent" }}>
                        {enableAPIAPP ?
                            <SVG ariaHidden svg={CheckIcon} />
                            :
                            <></>
                        }
                    </div>
                    <div aria-hidden>
                        <h4 dir={isRTL ? "rtl" : "ltr"}>{__("settings.library.enableAPIAPP")}</h4>
                    </div>
                </label>
            </div>
            <ApiappHowDoesItWorkInfoBox />
        </section>
    );
};

export default ManageAccessToCatalogSettings;
