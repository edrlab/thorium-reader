// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
// import { annotationActions } from "readium-desktop/common/redux/actions";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesAlertModals from "readium-desktop/renderer/assets/styles/components/alert.modals.scss";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import SVG from "readium-desktop/renderer/common/components/SVG";
// import * as PlusIcon from "readium-desktop/renderer/assets/icons/Plus-bold.svg";
// import { convertMultiLangStringToString } from "readium-desktop/common/language-string";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { customizationActions } from "readium-desktop/common/redux/actions";
import * as CheckIcon from "readium-desktop/renderer/assets/icons/singlecheck-icon.svg";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";

import DOMPurify from "dompurify";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";
import { THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL, THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_STREAMER } from "readium-desktop/common/streamerProtocol";
import Loader from "./Loader";

export const CustomizationProfileDialog: React.FC = () => {

    const customization = useSelector((state: ICommonRootState) => state.customization);
    const open = !!(customization.lock.state !== "IDLE" || customization.welcomeScreen.enable);
    const manifest = customization.manifest;

    const dispatch = useDispatch();
    const [__] = useTranslator();

    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);

    const profileInHistoryFound = customization.history.find(({id}) => id && id === customization.activate.id);
    const [checked, setChecked] = React.useState<boolean>(profileInHistoryFound && manifest?.version && profileInHistoryFound.version === manifest?.version);

    React.useEffect(() => {
        setChecked(profileInHistoryFound && manifest?.version && profileInHistoryFound.version === manifest?.version);
    }, [setChecked, manifest?.version, profileInHistoryFound]);

    const customizationId = customization.manifest?.identifier;
    const customizationBaseUrl = customizationId ? `${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL}://${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_STREAMER}/custom-profile-zip/${encodeURIComponent_RFC3986(Buffer.from(customizationId).toString("base64"))}/` : "";
    const welcomeScreenImgZipPath = manifest?.images?.find((ln) => ln.rel === "welcome-screen")?.href;
    const welcomeScreenImgHref = customizationBaseUrl && welcomeScreenImgZipPath ? customizationBaseUrl + encodeURIComponent_RFC3986(Buffer.from(welcomeScreenImgZipPath).toString("base64")) : "";
    const welcomeScreenHtmlZipPath = customization.manifest?.links?.find((ln) => ln.rel === "welcome-screen" && (!ln.type || ln.type === "text/html") && ln.language === locale)?.href || customization.manifest?.links?.find((ln) => ln.rel === "welcome-screen" && (!ln.type || ln.type === "text/html") && (ln.language === "en" || !ln.language))?.href;
    const welcomeScreenHtmlHref = customizationBaseUrl && welcomeScreenHtmlZipPath ? customizationBaseUrl + encodeURIComponent_RFC3986(Buffer.from(welcomeScreenHtmlZipPath).toString("base64")) : "";

    const [welcomeScreenHtmlSanitized, setWelcomeScreenHtmlSanitized] = React.useState("");

    // console.log("welcomeScreen HTML zipPath: ", welcomeScreenHtmlZipPath);
    // console.log("welcomeScreen HTML URL: ", welcomeScreenHtmlHref);
    React.useEffect(() => {
        if (customizationId && welcomeScreenHtmlHref && open) {
            fetch(welcomeScreenHtmlHref)
                .then((response) => {
                    if (response.ok) {
                        return response.text();
                    }
                    return Promise.reject(response.statusText);
                })
                .then((rawHtmlContent) => {
                    // console.log("RAW HTML", rawHtmlContent);

                    if (!rawHtmlContent) {
                        return;
                    }

                    const regex = new RegExp(/href=\"(.*?)\"/, "gm");
                    const parsed = DOMPurify.sanitize(rawHtmlContent, { FORBID_TAGS: [/*"style"*/], FORBID_ATTR: [/*"style"*/] /* TODO: handle external https links */ });
                    const hrefSanitized = parsed.replace(regex, (substring) => {

                        let url = /href=\"(.*?)\"/.exec(substring)[1];
                        if (!/^https?:\/\//.test(url)) {
                            url = "http://" + url;
                        }

                        return `href="" alt="${url}" onclick="return ((e) => {
                                    window.__shell_openExternal('${url}').catch(() => {});
                                    return false;
                                 })()"`;
                    });

                    setWelcomeScreenHtmlSanitized(hrefSanitized);
                })
                .catch((e) => {
                    console.error("Error fetching data:", e);
                });
        } else {
            setWelcomeScreenHtmlSanitized("");
        }
    }, [welcomeScreenHtmlHref, customizationId, open, setWelcomeScreenHtmlSanitized]);


    return (
        <AlertDialog.Root open={open} onOpenChange={(_requestOpen) => {
        }}>
            {/* <AlertDialog.Trigger asChild>
                {props.children}
            </AlertDialog.Trigger> */}
            <AlertDialog.Portal>
                <AlertDialog.Overlay className={stylesModals.modal_dialog_overlay} />
                <AlertDialog.Content className={stylesModals.modal_dialog}>
                    <AlertDialog.Title className={stylesModals.modal_dialog_header}>
                        {__("dialog.customization.splashscreen.title")}
                        <AlertDialog.Action asChild>
                            <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")} onClick={() => { dispatch(customizationActions.welcomeScreen.build(false)); }}>
                                <SVG ariaHidden={true} svg={QuitIcon} />
                            </button>
                        </AlertDialog.Action>
                        </AlertDialog.Title>
                    <AlertDialog.Description className={stylesModals.modal_dialog_body} style={{ display: "flex", gap: "20px", flexDirection: "row", justifyContent: "normal"}}>
                        {customization.welcomeScreen.enable && welcomeScreenHtmlSanitized ? <img style={{ maxWidth: "250px", maxHeight: "500px", objectFit: "contain" }} src={welcomeScreenImgHref} /> : <></>}
                        <div style={{position: "relative", width: "100%", height: "100%"}}>
                            {
                                customization.welcomeScreen.enable && welcomeScreenHtmlSanitized ?
                                    <div dangerouslySetInnerHTML={{ __html: welcomeScreenHtmlSanitized }} />
                                    : customization.welcomeScreen.enable ?
                                        <p>{__("dialog.customization.splashscreen.fallbackWelcomeScreen")}</p> : <></>
                            }
                            {
                                !(customization.lock.state === "IDLE" || welcomeScreenHtmlSanitized) ?
                                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", flexDirection: "column", justifyContent: "space-between"}}>
                                    <Loader></Loader>
                                    <span>{__("dialog.customization.splashscreen.state", {state: customization.lock.state, id: customization.lock.lockInfo?.id === "" && customization.lock.state === "ACTIVATING" ? "THorium Default Profile" : customization.lock.lockInfo?.id || "undefined"})}</span>
                                    {/* <span>LOCKINFO={JSON.stringify(customization.lock.lockInfo, null, 4)}</span> */}
                                </div> 
                                : <></>
                            }
                            {/* <div style={{display: "none"}}>
                                <span>STATE={customization.lock.state}</span>
                                <span>ID={customization.lock.lockInfo?.id === "" && customization.lock.state === "ACTIVATING" ? "THorium Default Profile" : customization.lock.lockInfo?.id || "undefined"}</span>
                                <span>LOCKINFO={JSON.stringify(customization.lock.lockInfo, null, 4)}</span>
                            </div> */}
                        </div>
                    </AlertDialog.Description>
                    <div className={stylesAlertModals.AlertDialogButtonContainer} style={{justifyContent: "space-between", padding: "10px 20px"}}>
                        <AlertDialog.Cancel asChild disabled={customization.lock.state !== "IDLE"} onClick={() => { dispatch(customizationActions.activating.build("")); }}>
                            <button className={stylesButtons.button_secondary_blue}>{__("dialog.cancel")}</button>
                        </AlertDialog.Cancel>
                        {customization.welcomeScreen.enable && profileInHistoryFound ? <div style={{ display: "flex", alignItems: "center", gap: "10px"}}>
                            <input type="checkbox" checked={checked} onChange={() => { setChecked(!checked); dispatch(customizationActions.addHistory.build(profileInHistoryFound.id, checked ? "" : profileInHistoryFound.version)); }} id="wizardCheckbox" name="wizardCheckbox" className={stylesGlobal.checkbox_custom_input} />
                            <label htmlFor="wizardCheckbox" className={stylesGlobal.checkbox_custom_label}>
                                <div
                                    tabIndex={0}
                                    role="checkbox"
                                    aria-checked={checked}
                                    aria-label={__("wizard.dontShow")}
                                    onKeyDown={(e) => {
                                        // if (e.code === "Space") {
                                        if (e.key === " ") {
                                            e.preventDefault(); // prevent scroll
                                        }
                                    }}
                                    onKeyUp={(e) => {
                                        // Includes screen reader tests:
                                        // if (e.code === "Space") { WORKS
                                        // if (e.key === "Space") { DOES NOT WORK
                                        // if (e.key === "Enter") { WORKS
                                        if (e.key === " ") { // WORKS
                                            e.preventDefault();
                                            setChecked(!checked);
                                            dispatch(customizationActions.addHistory.build(profileInHistoryFound.id, checked ? "" : profileInHistoryFound.version));
                                        }
                                    }}
                                    className={stylesGlobal.checkbox_custom}
                                    style={{ border: checked ? "2px solid transparent" : "2px solid var(--color-primary)", backgroundColor: checked ? "var(--color-blue)" : "transparent" }}>
                                    {checked ?
                                        <SVG ariaHidden svg={CheckIcon} />
                                        :
                                        <></>
                                    }
                                </div>
                                <span aria-hidden>
                                    {__("wizard.dontShow")}
                                </span>
                            </label>
                        </div> : <></> }
                        <AlertDialog.Action asChild>
                            <button disabled={!customization.welcomeScreen.enable} style={{display: customization.welcomeScreen.enable ? "block" : "none" }} className={stylesButtons.button_primary_blue} onClick={() => { dispatch(customizationActions.welcomeScreen.build(false)); }}>
                                {__("dialog.yes")}
                            </button>
                        </AlertDialog.Action>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );
};
