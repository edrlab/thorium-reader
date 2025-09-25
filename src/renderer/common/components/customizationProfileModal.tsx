// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
// import { annotationActions } from "readium-desktop/common/redux/actions";
// import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesAlertModals from "readium-desktop/renderer/assets/styles/components/alert.modals.scss";
// import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
// import SVG from "readium-desktop/renderer/common/components/SVG";
// import * as PlusIcon from "readium-desktop/renderer/assets/icons/Plus-bold.svg";
// import { convertMultiLangStringToString } from "readium-desktop/common/language-string";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { customizationActions } from "readium-desktop/common/redux/actions";
import { useDispatch } from "../hooks/useDispatch";
// import SVG from "./SVG";
// import * as CheckIcon from "readium-desktop/renderer/assets/icons/singlecheck-icon.svg";

export const CustomizationProfileModal: React.FC = () => {

    const customization = useSelector((state: ICommonRootState) => state.customization);
    const open = customization.lock.state !== "IDLE" || customization.welcomeScreen.enable;

    const dispatch = useDispatch();
    const [__] = useTranslator();

    // const profileInHistoryFound = customization.history.find(({id}) => id && id === customization.activate.id);
    // const [checked, setChecked] = React.useState<boolean>((profileInHistoryFound && profileInHistoryFound.welcomeScreenShowAgain) ? profileInHistoryFound.welcomeScreenShowAgain : true);


    return (
        <AlertDialog.Root open={open} onOpenChange={(_requestOpen) => {
        }}>
            {/* <AlertDialog.Trigger asChild>
                {props.children}
            </AlertDialog.Trigger> */}
            <AlertDialog.Portal>
                <AlertDialog.Overlay className={stylesAlertModals.AlertDialogOverlay} />
                <AlertDialog.Content className={stylesAlertModals.AlertDialogContent}>
                    <AlertDialog.Title className={stylesAlertModals.AlertDialogTitle}>{__("dialog.customization.splashscreen.title")}</AlertDialog.Title>
                    <AlertDialog.Description className={stylesAlertModals.AlertDialogDescription} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <span>STATE={customization.lock.state}</span>
                        <span>ID={customization.lock.lockInfo?.id === "" && customization.lock.state === "ACTIVATING" ? "THorium Default Profile" : customization.lock.lockInfo?.id || "undefined"}</span>
                        <span>LOCKINFO={JSON.stringify(customization.lock.lockInfo, null, 4)}</span>
                    </AlertDialog.Description>
                    <div className={stylesAlertModals.AlertDialogButtonContainer}>
                        <AlertDialog.Cancel asChild onClick={() => { dispatch(customizationActions.lock.build("IDLE")); dispatch(customizationActions.activating.build("")); }}>
                            <button className={stylesButtons.button_secondary_blue}>{__("dialog.cancel")}</button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <button className={stylesButtons.button_primary_blue} onClick={() => { dispatch(customizationActions.welcomeScreen.build(false)); }}>
                                Enter
                            </button>
                        </AlertDialog.Action>
                    </div>
                    {/* customization.welcomeScreen.enable && profileInHistoryFound ? <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "absolute", bottom: "30px", left: "30px" }}>
                        <input type="checkbox" checked={checked} onChange={() => { setChecked(!checked); dispatch(customizationActions.addHistory.build(profileInHistoryFound.id, profileInHistoryFound.version, checked ? true : false)); }} id="wizardCheckbox" name="wizardCheckbox" className={stylesGlobal.checkbox_custom_input} />
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
                                        dispatch(customizationActions.addHistory.build(profileInHistoryFound.id, profileInHistoryFound.version, checked ? true : false));
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
                    </div> : <></> */}
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );
};
