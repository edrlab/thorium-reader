// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as stylesAlertModals from "readium-desktop/renderer/assets/styles/components/alert.modals.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { TDispatch } from "readium-desktop/typings/redux";

import PublicationExportButton from "./PublicationExportButton";
import { apiAction } from "readium-desktop/renderer/library/apiAction";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    publicationView: PublicationView;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps> {
}

interface IState {
    menuOpen: boolean;
}

export class CatalogMenu extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            menuOpen: false,
        };

        // this.deletePublication = this.deletePublication.bind(this);
        this.displayPublicationInfo = this.displayPublicationInfo.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        const appOverlayElement = document.getElementById("app-overlay");
        return (
            <>
                <button role="menuitem"
                    onClick={this.displayPublicationInfo}
                >
                    {__("catalog.bookInfo")}
                </button>
                {/* <button role="menuitem"
                    onClick={this.deletePublication}
                >
                    {__("catalog.delete")}
                </button> */}
                <AlertDialog.Root>
                    <AlertDialog.Trigger asChild>
                        <button role="menuitem"
                        >
                            {__("catalog.delete")}
                        </button>
                    </AlertDialog.Trigger>
                    <AlertDialog.Portal container={appOverlayElement}>

                        {/** Overlay Component doesn't work in thorium ! very stange !! */}
                        {/* <AlertDialog.Overlay className={stylesAlertModals.AlertDialogOverlay}/> */}
                        <div className={stylesAlertModals.AlertDialogOverlay}></div>
                        <AlertDialog.Content className={stylesAlertModals.AlertDialogContent}>
                            <AlertDialog.Title className={stylesAlertModals.AlertDialogTitle}>{__("dialog.deletePublication")}</AlertDialog.Title>
                            <AlertDialog.Description className="AlertDialogDescription">
                                {this.props.publicationView.documentTitle}
                            </AlertDialog.Description>
                            <div style={{ display: "flex", gap: 25, justifyContent: "flex-end" }}>
                                <AlertDialog.Cancel asChild>
                                    <button className="Button mauve">{__("dialog.cancel")}</button>
                                </AlertDialog.Cancel>
                                <AlertDialog.Action asChild>
                                    <button className="Button red" onClick={this.remove} type="button">{__("dialog.yes")}</button>
                                </AlertDialog.Action>
                            </div>
                        </AlertDialog.Content>
                    </AlertDialog.Portal>
                </AlertDialog.Root>
                <PublicationExportButton
                    publicationView={this.props.publicationView}
                />
            </>
        );
    }

    private remove = () => {
        apiAction("publication/delete", this.props.publicationView.identifier).catch((error) => {
            console.error("Error to fetch publication/delete", error);
        });
    };

    // private deletePublication() {
    //     this.props.openDeleteDialog();
    // }

    private displayPublicationInfo() {
        this.props.displayPublicationInfo();
    }
}

const mapDispatchToProps = (dispatch: TDispatch, props: IBaseProps) => {
    return {
        displayPublicationInfo: () => {
            dispatch(dialogActions.openRequest.build(DialogTypeName.PublicationInfoLib,
                {
                    publicationIdentifier: props.publicationView.identifier,
                },
            ));
        },
        openDeleteDialog: () => {
            dispatch(dialogActions.openRequest.build(DialogTypeName.DeletePublicationConfirm,
                {
                    publicationView: props.publicationView,
                },
            ));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(CatalogMenu));
