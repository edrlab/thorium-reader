// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { PublicationView } from "readium-desktop/common/views/publication";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useApi } from "readium-desktop/renderer/common/hooks/useApi";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as stylesAlertModals from "readium-desktop/renderer/assets/styles/components/alert.modals.css";
import classNames from "classnames";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { dialogActions } from "readium-desktop/common/redux/actions";
import SVG from "../../../common/components/SVG";
import * as Trash from "readium-desktop/renderer/assets/icons/trash-icon.svg";


const DeletePublicationConfirm = (props: { publicationView: PublicationView, trigger: React.ReactNode } & AlertDialog.AlertDialogProps) => {
    const [__] = useTranslator();
    const [_, remove] = useApi(undefined, "publication/delete");
    const dispatch = useDispatch();
    const removeAction = React.useCallback(() => {
        dispatch(dialogActions.closeRequest.build());
        remove(props.publicationView.identifier);
    }, [remove, props.publicationView.identifier]);

    const appOverlayElement = React.useMemo(() => document.getElementById("app-overlay"), []);
    return (
        <AlertDialog.Root {...props}>
            <AlertDialog.Trigger asChild>
                {props.trigger}
            </AlertDialog.Trigger>
            <AlertDialog.Portal container={appOverlayElement}>

                {/** Overlay Component doesn't work */}
                {/* <AlertDialog.Overlay className={stylesAlertModals.AlertDialogOverlay}/> */}
                <div className={stylesAlertModals.AlertDialogOverlay}></div>
                <AlertDialog.Content className={stylesAlertModals.AlertDialogContent}>
                    <AlertDialog.Title className={stylesAlertModals.AlertDialogTitle}>{__("dialog.deletePublication")}</AlertDialog.Title>
                    <AlertDialog.Description className={stylesAlertModals.AlertDialogDescription}>
                        {props.publicationView.documentTitle}
                    </AlertDialog.Description>
                    <div className={stylesAlertModals.AlertDialogButtonContainer}>
                        <AlertDialog.Cancel asChild>
                            <button className={classNames(stylesAlertModals.AlertDialogButton, stylesAlertModals.abort)}>{__("dialog.cancel")}</button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <button className={classNames(stylesAlertModals.AlertDialogButton, stylesAlertModals.delete)} onClick={removeAction} type="button"><SVG ariaHidden svg={Trash} />{__("dialog.yes")}</button>
                        </AlertDialog.Action>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );

};

export default DeletePublicationConfirm;
