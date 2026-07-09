// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as stylesAlertModals from "readium-desktop/renderer/assets/styles/components/alert.modals.scss";
import { langStringIsRTL } from "@r2-shared-js/_utils/language-string";
// import { DirectionProvider } from "@radix-ui/react-direction";
// import {I18nProvider} from 'react-aria';

import * as React from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import SVG from "readium-desktop/renderer/common/components/SVG";
import classNames from "classnames";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { catalogActions} from "readium-desktop/common/redux/actions";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import SettingsRecovery from "./SettingsRecovery";

const StorageConfirmDialog = (props: {
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

const StorageSettings: React.FC<{}> = () => {
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const isRTL = langStringIsRTL(locale);
    const dispatch = useDispatch();
    const [__] = useTranslator();
    const directoryState = useSelector((state: ILibraryRootState) => state.publication.directory);
    const defaultDirectory = directoryState?.defaultDirectory || "";
    const userDirectory = directoryState?.userDirectory || "";

    const [isEditing, setIsEditing] = React.useState(false);
    const [confirmAddOpen, setConfirmAddOpen] = React.useState(false);
    const [confirmEditOpen, setConfirmEditOpen] = React.useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);

    const removeUserDirectory = React.useCallback(() => {
        dispatch(catalogActions.setUserDirectory.build(""));
        setIsEditing(false);
    }, [dispatch]);

    const openFolderPicker = React.useCallback(() => {
        // trigger the file picker on the last userDirectory if available
        dispatch(catalogActions.setUserDirectory.build(userDirectory));
        setIsEditing(false);
    }, [dispatch, userDirectory]);

    if (!defaultDirectory) {
        return <></>;
    }

    return (
        <>
            <StorageConfirmDialog
                open={confirmAddOpen}
                onOpenChange={setConfirmAddOpen}
                title={__("settings.storage.dialogs.add.title")}
                description={__("settings.storage.dialogs.add.description")}
                confirmLabel={__("settings.storage.dialogs.add.confirm")}
                onConfirm={() => {
                    setConfirmAddOpen(false);
                    setIsEditing(true);
                    openFolderPicker();
                }}
            />
            <StorageConfirmDialog
                open={confirmEditOpen}
                onOpenChange={setConfirmEditOpen}
                title={__("settings.storage.dialogs.edit.title")}
                description={__("settings.storage.dialogs.edit.description")}
                confirmLabel={__("settings.storage.dialogs.edit.confirm")}
                onConfirm={() => {
                    setConfirmEditOpen(false);
                    setIsEditing(true);
                    openFolderPicker();
                }}
            />
            <StorageConfirmDialog
                open={confirmDeleteOpen}
                onOpenChange={setConfirmDeleteOpen}
                title={__("settings.storage.dialogs.remove.title")}
                description={__("settings.storage.dialogs.remove.description")}
                confirmLabel={__("settings.storage.dialogs.remove.confirm")}
                onConfirm={() => {
                    setConfirmDeleteOpen(false);
                    removeUserDirectory();
                }}
            />
                <details className={stylesSettings.session_text}>
                    <summary dir={isRTL ? "rtl" : "ltr"}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px"}}>
                            <SVG ariaHidden svg={InfoIcon} />
                            <p>{__("settings.storage.beta.summary")}</p>
                        </div>
                    </summary>
                    <div dir={isRTL ? "rtl" : "ltr"} style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                        <p>{__("settings.storage.beta.migration")}</p>
                        <p>{__("settings.storage.beta.integrity")}</p>
                        <p>{__("settings.storage.beta.warning")}</p>
                        <p>{__("settings.storage.beta.availability")}</p>
                    </div>
                </details>

                <section className={stylesSettings.section} style={{ position: "relative", gap: "14px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <h3>{__("settings.storage.locations.title")}</h3>
                            <div className={stylesSettings.storage_location} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <p style={{ margin: 0 }}><strong>{__("settings.storage.locations.defaultInternal")}</strong></p>
                                <p style={{ margin: 0 }}>{__("settings.storage.locations.defaultDescription")}</p>
                                <button
                                    className={stylesButtons.button_nav_tertiary}
                                    onClick={() => dispatch(catalogActions.openDefaultDirectory.build())}
                                >
                                    {defaultDirectory}
                                </button>
                            </div>
                    </div>
                    </section>

                    <section className={stylesSettings.section} style={{ position: "relative", gap: "14px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <h3>Configuration</h3>
                            {userDirectory ?

                                <div className={stylesSettings.storage_location} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <p style={{ margin: 0 }}><strong>{__("settings.storage.locations.externalStorage")}</strong></p>
                                    <button className={stylesButtons.button_nav_tertiary} title={userDirectory}
                                        onClick={() => dispatch(catalogActions.openUserDirectory.build())}
                                    >
                                        {userDirectory}
                                    </button>
                                </div> : <></>
                            }
                            {!userDirectory && !isEditing ? (
                                <div className={stylesSettings.session_text} style={{ margin: 0, alignItems: "flex-start" }}>
                                    <SVG ariaHidden svg={InfoIcon} />
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <p style={{ margin: 0 }}>
                                            {__("settings.storage.configuration.notConfiguredDescription")}
                                        </p>
                                    </div>
                                </div>
                            ) : null}
                            {userDirectory && !isEditing ? (
                                <p style={{ margin: 0 }}>
                                    {__("settings.storage.configuration.configuredDescription")}
                                </p>
                            ) : null}
                            {isEditing ? (
                                <p style={{ margin: 0 }}>
                                    {__("settings.storage.configuration.chooseFolderDescription")}
                                </p>
                            ) : null}
                        </div>

                        {!userDirectory && !isEditing ? (
                            <button
                                className={stylesButtons.button_secondary_blue}
                                onClick={() => setConfirmAddOpen(true)}
                            >
                                {__("settings.storage.actions.addDirectory")}
                            </button>
                        ) : null}

                        {userDirectory && !isEditing ? (
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                <button
                                    className={stylesButtons.button_secondary_blue}
                                    onClick={() => setConfirmEditOpen(true)}
                                >
                                    {__("settings.storage.actions.changeDirectory")}
                                </button>
                                <button
                                    className={stylesButtons.button_secondary_blue}
                                    onClick={() => setConfirmDeleteOpen(true)}
                                >
                                    {__("settings.storage.actions.removeStorageDirectory")}
                                </button>
                            </div>
                        ) : null}
                    </section>

                    <SettingsRecovery
                        defaultDirectory={defaultDirectory}
                        userDirectory={userDirectory}
                    />
        </>
    );
};

export default StorageSettings;
