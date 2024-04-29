// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { IOpdsFeedView } from "readium-desktop/common/views/opds";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useApi } from "readium-desktop/renderer/common/hooks/useApi";
import { useDispatch } from "react-redux";
import { dialogActions } from "readium-desktop/common/redux/actions";
import * as stylesAlertModals from "readium-desktop/renderer/assets/styles/components/alert.modals.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as TrashIcon from "readium-desktop/renderer/assets/icons/trash-icon.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";

const DeleteOpdsFeedConfirm = (props: { feed: IOpdsFeedView, trigger: React.ReactNode } & AlertDialog.AlertDialogProps) => {
    const [__] = useTranslator();
    const [_, remove] = useApi(undefined, "opds/deleteFeed");
    const dispatch = useDispatch();
    const removeAction = React.useCallback(() => {
        dispatch(dialogActions.closeRequest.build());
        remove(props.feed.identifier);
    }, [remove, props.feed.identifier]);

    return (
        <AlertDialog.Root {...props}>
            <AlertDialog.Trigger asChild>
                {props.trigger}
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
                <div className={stylesAlertModals.AlertDialogOverlay}></div>
                <AlertDialog.Content className={stylesAlertModals.AlertDialogContent}>
                    <AlertDialog.Title className={stylesAlertModals.AlertDialogTitle}>{__("dialog.deleteFeed")}</AlertDialog.Title>
                    <AlertDialog.Description className={stylesAlertModals.AlertDialogDescription}>
                        {props.feed.title}
                    </AlertDialog.Description>
                    <div className={stylesAlertModals.AlertDialogButtonContainer}>
                        <AlertDialog.Cancel asChild>
                            <button className={stylesButtons.button_secondary_blue}>{__("dialog.cancel")}</button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <button className={stylesButtons.button_primary_blue} onClick={removeAction} type="button">
                                <SVG ariaHidden svg={TrashIcon} />
                                {__("dialog.yes")}</button>
                        </AlertDialog.Action>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );

};

export default DeleteOpdsFeedConfirm;
