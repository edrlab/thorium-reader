// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesAlertModals from "readium-desktop/renderer/assets/styles/components/alert.modals.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";

import * as React from "react";
import { PublicationView } from "readium-desktop/common/views/publication";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useApi } from "readium-desktop/renderer/common/hooks/useApi";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { dialogActions } from "readium-desktop/common/redux/actions";
import SVG from "../../../common/components/SVG";
import * as Trash from "readium-desktop/renderer/assets/icons/trash-icon.svg";
import { THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL, THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_PUB_NOTES } from "readium-desktop/common/streamerProtocol";
import { INoteState } from "readium-desktop/common/redux/states/renderer/note";

const DeletePublicationConfirm = (props: { publicationView: PublicationView, trigger: React.ReactNode } & AlertDialog.AlertDialogProps) => {
    const [__] = useTranslator();
    const [_, remove] = useApi(undefined, "publication/delete");
    const dispatch = useDispatch();
    const removeAction = React.useCallback(() => {
        dispatch(dialogActions.closeRequest.build());
        remove(props.publicationView.identifier);
    }, [dispatch, remove, props.publicationView.identifier]);
    const [hasNotes, setHasNotes] = React.useState(false);

    React.useEffect(() => {

        (async () => {

            const notes: INoteState[] = await(await fetch(`${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL}://${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_PUB_NOTES}/publication-notes/${props.publicationView.identifier}`)).json();

            if (Array.isArray(notes) && notes.length) {
                setHasNotes(true);
            }
        })();

    }, [props.publicationView.identifier]);

    return (
        <AlertDialog.Root {...props}>
            <AlertDialog.Trigger asChild>
                {props.trigger}
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
                <AlertDialog.Overlay className={stylesAlertModals.AlertDialogOverlay}/>
                <AlertDialog.Content className={stylesAlertModals.AlertDialogContent}>
                    <AlertDialog.Title className={stylesAlertModals.AlertDialogTitle}>{__("dialog.deletePublication")}</AlertDialog.Title>
                    <AlertDialog.Description className={stylesAlertModals.AlertDialogDescription}>
                        {props.publicationView.documentTitle}
                    </AlertDialog.Description>
                    {hasNotes ? <div>
                        <p style={{fontSize: "14px", color: "red"}}>{__("dialog.deletePublicationWithNotes")}</p>
                    </div> : <></>}
                    <div className={stylesAlertModals.AlertDialogButtonContainer}>
                        <AlertDialog.Cancel asChild>
                            <button className={stylesButtons.button_secondary_blue}>{__("dialog.cancel")}</button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <button className={stylesButtons.button_primary_blue} onClick={removeAction} type="button">
                                <SVG ariaHidden svg={Trash} />
                                {__("dialog.yes")}
                            </button>
                        </AlertDialog.Action>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );

};

export default DeletePublicationConfirm;
