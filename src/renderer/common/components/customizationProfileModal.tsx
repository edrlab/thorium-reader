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
// import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesAlertModals from "readium-desktop/renderer/assets/styles/components/alert.modals.scss";
// import SVG from "readium-desktop/renderer/common/components/SVG";
// import * as PlusIcon from "readium-desktop/renderer/assets/icons/Plus-bold.svg";
// import { convertMultiLangStringToString } from "readium-desktop/common/language-string";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";

export const CustomizationProfileModal: React.FC = () => {

    const customizationLock = useSelector((state: ICommonRootState) => state.customization.lock);
    const open = customizationLock.state !== "IDLE";

    // const dispatch = useDispatch();
    const [__] = useTranslator();


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
                        <span>STATE={customizationLock.state}</span>
                        <span>ID={customizationLock.lockInfo?.id === "" && customizationLock.state === "ACTIVATING" ? "THorium Default Profile" : customizationLock.lockInfo?.id || "undefined"}</span>
                        <span>LOCKINFO={JSON.stringify(customizationLock.lockInfo, null, 4)}</span>
                    </AlertDialog.Description>
                    <div className={stylesAlertModals.AlertDialogButtonContainer}>
                        {/* <AlertDialog.Cancel asChild onClick={() => dispatch(annotationActions.importConfirmOrAbort.build("abort"))}>
                            <button className={stylesButtons.button_secondary_blue}>{__("dialog.cancel")}</button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <button className={stylesButtons.button_primary_blue} onClick={() => dispatch(annotationActions.importConfirmOrAbort.build("importAll"))}>
                                <SVG ariaHidden svg={PlusIcon} />
                                {__("dialog.annotations.importAll")}
                            </button>
                        </AlertDialog.Action>
                        */}
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );
};
