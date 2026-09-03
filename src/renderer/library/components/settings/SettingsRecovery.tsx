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
import { langStringIsRTL } from "@r2-shared-js/_utils/language-string";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { useApi } from "readium-desktop/renderer/common/hooks/useApi";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";

const SettingsRecoveryConfirmDialog = (props: {
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
}) => {
    const [__] = useTranslator();

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
                                {__("dialog.cancel")}
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
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const isRTL = langStringIsRTL(locale);
    const [__] = useTranslator();
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
    const recoverablePublicationsCount = recoverablePublications.length;

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
                title={__("settings.storage.recovery.dialog.title")}
                description={__("settings.storage.recovery.dialog.description", { count: recoverablePublicationsCount })}
                confirmLabel={__("settings.storage.recovery.dialog.confirm")}
                onConfirm={recoverPublications}
            />

            <section className={stylesSettings.section} style={{ position: "relative", gap: "14px" }} dir={isRTL ? "rtl" : "ltr"}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <h4>{__("settings.storage.recovery.title")}</h4>
                    {!isRecoveryChecked && !isRecoveryLoading ? (
                        <p style={{ margin: 0 }}>
                            {__("settings.storage.recovery.description")}
                        </p>
                    ) : null}
                    {isRecoveryLoading ? (
                        <p style={{ margin: 0 }}>{__("settings.storage.recovery.checking")}</p>
                    ) : null}
                    {isRecoveryChecked && !isRecoveryLoading && recoverablePublicationsCount ? (
                        <div className={stylesSettings.session_text} style={{ margin: 0, alignItems: "flex-start" }}>
                            <SVG ariaHidden svg={InfoIcon} />
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <p style={{ margin: 0, fontWeight: 600 }}>
                                    {__("settings.storage.recovery.available")}
                                </p>
                                <p style={{ margin: 0 }}>
                                    {__("settings.storage.recovery.recoverableCount", { count: recoverablePublicationsCount })}
                                </p>
                            </div>
                        </div>
                    ) : null}
                    {isRecoveryChecked && !isRecoveryLoading && !recoverablePublicationsCount ? (
                        <p style={{ margin: 0 }}>{__("settings.storage.recovery.none")}</p>
                    ) : null}
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {isRecoveryChecked && recoverablePublicationsCount ? (
                        <button
                            className={stylesSettings.btn_primary}
                            disabled={isRecoveryLoading || isRecovering}
                            onClick={() => setConfirmRecoveryOpen(true)}
                        >
                            {isRecovering ?
                                __("settings.storage.recovery.actions.recovering") :
                                __("settings.storage.recovery.actions.recover")}
                        </button>
                    ) : null}
                    <button
                        className={stylesButtons.button_secondary_blue}
                        aria-disabled={isRecoveryLoading || isRecovering}
                        onClick={() => {
                                if (isRecoveryLoading || isRecovering) return;
                                checkRecoverablePublications();
                            }}
                    >
                        {isRecoveryChecked ?
                            __("settings.storage.recovery.actions.checkAgain") :
                            __("settings.storage.recovery.actions.check")}
                    </button>
                </div>
            </section>
        </>
    );
};

export default SettingsRecovery;
