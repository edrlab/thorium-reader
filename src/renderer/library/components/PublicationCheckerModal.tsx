// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import classNames from "classnames";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
// import { publicationActions as publicationActionsCommon, wizardActions } from "readium-desktop/common/redux/actions";

import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { publicationActions } from "../redux/actions";
import { IPublicationCheckerState } from "readium-desktop/common/redux/states/publicationsChecker";
import { useApi } from "readium-desktop/renderer/common/hooks/useApi";

export const PublicationCheckerModal = () => {
    const [__] = useTranslator();
    const dispatch = useDispatch();
    const publicationCheckerState = useSelector((state: ILibraryRootState) => state.publicationIntegrityChecker);
    const [, deletePublication] = useApi(undefined, "publication/delete");
    const [, openPublicationFolder] = useApi(undefined, "publication/openFolder");
    
    const { open } = publicationCheckerState;

    const {
        publicationDirectoryPath,
        publicationIdentifierDataBase,
        publicationIdentifierDisk,
        dump,
    } = open ? publicationCheckerState : {} as IPublicationCheckerState;

    const publicationIdentifierNotFoundOnDiskButFoundOnDataBase: string[] = publicationIdentifierDataBase?.filter((id) => !publicationIdentifierDisk.includes(id)) || [];
    const publicationIdentifierNotFoundOnDataBaseButFoundOnDisk: string[] = publicationIdentifierDisk?.filter((id) => !publicationIdentifierDataBase.includes(id)) || [];

    return <Dialog.Root defaultOpen={open} onOpenChange={(openState: boolean) => {
        if (openState == false) {
            dispatch(publicationActions.closePublicationChecker.build());
        }
    }}
    >
        {/* <Dialog.Trigger asChild>
        <button title={__("header.settings")}>
            <h3>Visite Guidée</h3>
        </button>
        </Dialog.Trigger> */}
        <Dialog.Portal>
            <div className={stylesModals.modal_dialog_overlay}></div>
            <Dialog.Content className={classNames(stylesModals.modal_dialog)} aria-describedby={undefined}>

                <h1>Publication Integrity Checker</h1>

                <h3>Publication vault folder Path:</h3>
                <p><span>{publicationDirectoryPath}</span> <button onClick={() => openPublicationFolder()}>OPEN FOLDER</button></p>

                <hr /><br />

                <h3>Publication(s) Not Found On Disk But Found On DataBase:</h3>
                {
                    publicationIdentifierNotFoundOnDiskButFoundOnDataBase.length ?

                        <>
                            <table>
                                <tr>
                                    <th>PubID</th>
                                    <th>Actions</th>
                                </tr>
                                {
                                    publicationIdentifierNotFoundOnDiskButFoundOnDataBase.map((id) => {
                                        return <>
                                            <tr key={id}>
                                                <td>{id}</td>
                                                <td>
                                                    <button onClick={() => {
                                                        deletePublication(id);
                                                    }}>DELETE</button>
                                                    {/* TODO?: <button>EXPORT DATA PREFERENCE</button> */}
                                                </td>
                                            </tr>

                                        </>;
                                    })
                                }
                            </table>

                        </> : <></>
                }

                <h3>Publication(s) Not Found On DataBase But Found On Disk:</h3>
                {
                    publicationIdentifierNotFoundOnDataBaseButFoundOnDisk.length ?

                        <>
                            <table>
                                <tr>
                                    <th>PubID</th>
                                    <th>Actions</th>
                                </tr>
                                {
                                    publicationIdentifierNotFoundOnDataBaseButFoundOnDisk.map((id) => {
                                        return <>
                                            <tr key={id}>
                                                <td>{id}</td>
                                                <td>
                                                    <button onClick={() => {
                                                        deletePublication(id);
                                                    }}>DELETE</button>
                                                    <button onClick={() => {
                                                        openPublicationFolder(id);
                                                    }}>OPEN FOLDER</button>
                                                </td>
                                            </tr>

                                        </>;
                                    })
                                }
                            </table>

                        </> : <></>
                }

                <hr /><br />

                <details>
                    <summary>DUMP:</summary>
                    <pre>{dump}</pre>
                </details>

                <div className={stylesModals.modal_dialog_footer}>
                    <Dialog.Close asChild>
                        <button className={stylesButtons.button_secondary_blue}>{__("dialog.cancel")}</button>
                    </Dialog.Close>
                    {/* <Dialog.Close asChild>
                        <button type="submit" disabled={!title || !url} className={stylesButtons.button_primary_blue} onClick={() => addAction()}>
                            <SVG ariaHidden svg={AddIcon} />
                            {__("opds.addForm.addButton")}
                        </button>
                    </Dialog.Close> */}
                </div>
                
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>;
};
