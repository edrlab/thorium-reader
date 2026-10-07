// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as React from "react";

import type { IOpdsProgressionDocument } from "readium-desktop/common/models/opdsProgression";
import * as stylesAlertModals from "readium-desktop/renderer/assets/styles/components/alert.modals.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";

export interface IOpdsProgressionDialogProps {
    document?: IOpdsProgressionDocument;
    onAccept: () => void;
    onCancel: () => void;
}

export const OpdsProgressionDialog: React.FC<IOpdsProgressionDialogProps> = ({
    document,
    onAccept,
    onCancel,
}) => {
    const [__] = useTranslator();
    const percentage = document ? Math.round(document.progression * 1000) / 10 : 0;

    return (
        <AlertDialog.Root
            open={Boolean(document)}
            onOpenChange={(open) => {
                if (!open && document) {
                    onCancel();
                }
            }}
        >
            <AlertDialog.Portal>
                <AlertDialog.Overlay className={stylesAlertModals.AlertDialogOverlay} />
                <AlertDialog.Content className={stylesAlertModals.AlertDialogContent}>
                    <AlertDialog.Title className={stylesAlertModals.AlertDialogTitle}>
                        {__("publication.progression.remoteTitle")}
                    </AlertDialog.Title>
                    <AlertDialog.Description className={stylesAlertModals.AlertDialogDescription}>
                        {document
                            ? __("publication.progression.remoteDescription", {
                                device: document.device.name,
                                progression: percentage,
                            })
                            : ""}
                        {document?.title ? ` ${document.title}` : ""}
                    </AlertDialog.Description>
                    <div className={stylesAlertModals.AlertDialogButtonContainer}>
                        <AlertDialog.Cancel asChild onClick={onCancel}>
                            <button className={stylesButtons.button_secondary_blue}>
                                {__("dialog.cancel")}
                            </button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild onClick={onAccept}>
                            <button className={stylesButtons.button_primary_blue}>
                                {__("publication.progression.useRemote")}
                            </button>
                        </AlertDialog.Action>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );
};
