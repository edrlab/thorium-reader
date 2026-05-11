// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesAlertModals from "readium-desktop/renderer/assets/styles/components/alert.modals.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";

import * as React from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import classNames from "classnames";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { useApi } from "readium-desktop/renderer/common/hooks/useApi";

const SettingsRecoveryConfirmDialog = (props: {
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
}) => {
    return (
        <AlertDialog.Root open={props.open} onOpenChange={props.onOpenChange}>
            <AlertDialog.Portal>
                <AlertDialog.Overlay className={stylesAlertModals.AlertDialogOverlay} />
                <AlertDialog.Content className={stylesAlertModals.AlertDialogContent}>
                    <AlertDialog.Title className={stylesAlertModals.AlertDialogTitle}>
                        {props.title}
                    </AlertDialog.Title>
                    <AlertDialog.Description className={stylesAlertModals.AlertDialogDescription}>
                        {props.description}
                    </AlertDialog.Description>
                    <div className={stylesAlertModals.AlertDialogButtonContainer}>
                        <AlertDialog.Cancel asChild>
                            <button className={classNames(stylesAlertModals.AlertDialogButton, stylesAlertModals.abort)}>
                                Cancel
                            </button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <button
                                className={classNames(stylesAlertModals.AlertDialogButton, stylesAlertModals.yes)}
                                onClick={props.onConfirm}
                            >
                                {props.confirmLabel}
                            </button>
                        </AlertDialog.Action>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );
};

const SettingsRecovery = (props: {
    defaultDirectory: string;
    userDirectory: string;
}) => {
    const [confirmRecoveryOpen, setConfirmRecoveryOpen] = React.useState(false);
    const [isRecoveryLoading, setIsRecoveryLoading] = React.useState(false);
    const [isRecoveryChecked, setIsRecoveryChecked] = React.useState(false);
    const [isRecovering, setIsRecovering] = React.useState(false);
    const [findAllRecoverableResult, findAllRecoverableAction] = useApi(undefined, "publication/findAllRecoverable");
    const [recoverResult, recoverAction] = useApi(undefined, "publication/recover");
    const findAllRecoverableTime = findAllRecoverableResult?.data?.time;
    const recoverTime = recoverResult?.data?.time;
    const recoverablePublications = React.useMemo(
        () => findAllRecoverableResult?.data?.error ?
            [] :
            (findAllRecoverableResult?.data?.result || []),
        [findAllRecoverableResult],
    );

    const checkRecoverablePublications = React.useCallback(() => {
        setIsRecoveryLoading(true);
        findAllRecoverableAction();
    }, [findAllRecoverableAction]);

    React.useEffect(() => {
        if (!findAllRecoverableTime) {
            return;
        }
        setIsRecoveryChecked(true);
        setIsRecoveryLoading(false);
    }, [findAllRecoverableTime]);

    React.useEffect(() => {
        if (!recoverTime) {
            return;
        }
        setIsRecovering(false);
        checkRecoverablePublications();
    }, [recoverTime, checkRecoverablePublications]);

    React.useEffect(() => {
        setIsRecoveryChecked(false);
    }, [props.defaultDirectory, props.userDirectory]);

    const recoverPublications = React.useCallback(() => {
        setConfirmRecoveryOpen(false);
        setIsRecovering(true);
        recoverAction(recoverablePublications.map(({ identifier }) => identifier));
    }, [recoverAction, recoverablePublications]);

    return (
        <>
            <SettingsRecoveryConfirmDialog
                open={confirmRecoveryOpen}
                onOpenChange={setConfirmRecoveryOpen}
                title="Recover publications"
                description={`Thorium found ${recoverablePublications.length} publication${recoverablePublications.length > 1 ? "s" : ""} on disk that ${recoverablePublications.length > 1 ? "are" : "is"} missing from the database. Do you want to import ${recoverablePublications.length > 1 ? "them" : "it"} back into Thorium?`}
                confirmLabel="Recover"
                onConfirm={recoverPublications}
            />

            <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                padding: "16px",
                border: "1px solid var(--color-button-border)",
                borderRadius: "8px",
                background: "var(--color-neutral-base)",
                boxShadow: "0 1px 0 var(--color-gray-100)",
            }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>Recovery</p>
                    {!isRecoveryChecked && !isRecoveryLoading ? (
                        <p style={{ margin: 0 }}>
                            Check publication storage to find publications that can be safely recovered.
                        </p>
                    ) : null}
                    {isRecoveryLoading ? (
                        <p style={{ margin: 0 }}>Checking publication storage...</p>
                    ) : null}
                    {isRecoveryChecked && !isRecoveryLoading && recoverablePublications.length ? (
                        <div className={stylesSettings.session_text} style={{ margin: 0, alignItems: "flex-start" }}>
                            <SVG ariaHidden svg={InfoIcon} />
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <p style={{ margin: 0, fontWeight: 600 }}>
                                    One or more publications were found on disk but are missing from the database. Recovery is possible.
                                </p>
                                <p style={{ margin: 0 }}>
                                    {recoverablePublications.length} publication{recoverablePublications.length > 1 ? "s" : ""} can be recovered with the original storage identifier.
                                </p>
                            </div>
                        </div>
                    ) : null}
                    {isRecoveryChecked && !isRecoveryLoading && !recoverablePublications.length ? (
                        <p style={{ margin: 0 }}>No recoverable publications were found.</p>
                    ) : null}
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {isRecoveryChecked && recoverablePublications.length ? (
                        <button
                            className={stylesSettings.btn_primary}
                            disabled={isRecoveryLoading || isRecovering}
                            onClick={() => setConfirmRecoveryOpen(true)}
                        >
                            {isRecovering ? "Recovering..." : "Recover publications"}
                        </button>
                    ) : null}
                    <button
                        className={isRecoveryChecked ? stylesButtons.button_transparency : stylesSettings.btn_primary}
                        disabled={isRecoveryLoading || isRecovering}
                        onClick={checkRecoverablePublications}
                    >
                        {isRecoveryChecked ? "Check again" : "Check for recoverable publications"}
                    </button>
                </div>
            </div>
        </>
    );
};

export default SettingsRecovery;
