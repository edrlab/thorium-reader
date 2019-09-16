// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { RootState } from "readium-desktop/renderer/redux/states";

import DeleteOpdsFeedConfirm from "./DeleteOpdsFeedConfirm";
import DeletePublicationConfirm from "./DeletePublicationConfirm";
import FileImport from "./FileImport";
import OpdsFeedAddForm from "./OpdsFeedAddForm";

interface IProps extends ReturnType<typeof mapStateToProps> {
}

class DialogManager extends React.Component<IProps> {
    public render(): React.ReactElement<{}> {
        const dialog = this.props.dialog;

        if (!dialog || !dialog.open) {
            return (<></>);
        }

        return (
            <>
                <OpdsFeedAddForm></OpdsFeedAddForm>
                <FileImport></FileImport>
                <DeletePublicationConfirm></DeletePublicationConfirm>
                <DeleteOpdsFeedConfirm></DeleteOpdsFeedConfirm>
            </>
        );

    }

    /*
    private buildOpdsFeedAddFormDialog() {
        return (
            <Dialog
                open={true}
                close={this.props.closeDialog}
                id={styles.opds_form_dialog}
            >
                <OpdsFeedAddForm />
            </Dialog>
        );
    }

    private buildPublicationShowDialog() {
        return (
            <Dialog
                open={true}
                close={this.props.closeDialog}
            >
                <PublicationInfo
                    publicationIdentifier={this.props.dialog.data.publicationIdentifier}
                    publication={this.props.dialog.data.publication}
                    isOpds={this.props.dialog.data.isOpds}
                />
            </Dialog>
        );
    }

    private buildReaderPublicationShowDialog() {
        return (
            <Dialog
                open={true}
                close={this.props.closeDialog}
            >
                <PublicationInfo
                    publication={this.props.dialog.data.publication}
                    hideControls={true}
                />
            </Dialog>
        );
    }

    private buildFileImportDialog() {
        return (
            <Dialog
                open={true}
                close={this.props.closeDialog}
                id={styles.add_dialog}
            >
                <FileImport
                    files={this.props.dialog.data.files}
                />
            </Dialog>
        );
    }

    private buildDeletePublicationConfirmDialog() {
        return (
            <Dialog
                open={true}
                close={this.props.closeDialog}
                id={styles.choice_dialog}
            >
                <DeletePublicationConfirm
                    publication={this.props.dialog.data.publication}
                />
            </Dialog>
        );
    }

    private buildDeleteOpdsFeedConfirmDialog() {
        return (
            <Dialog
                open={true}
                close={this.props.closeDialog}
                id={styles.choice_dialog}
            >
                <DeleteOpdsFeedConfirm
                    feed={this.props.dialog.data.feed}
                />
            </Dialog>
        );
    }

    private buildLcpAuthenticationDialog() {
        return (
            <Dialog
                open={true}
                close={this.props.closeDialog}
                id={styles.lcp_dialog}
            >
                <LcpAuthentication
                    publication={this.props.dialog.data.publication}
                    hint={this.props.dialog.data.hint}
                />
            </Dialog>
        );
    }

    private buildLsdRenewConfirmDialog() {
        return (
            <Dialog
                open={true}
                close={this.props.closeDialog}
                id={styles.choice_dialog}
            >
                <RenewLsdConfirm
                    publication={this.props.dialog.data.publication}
                />
            </Dialog>
        );
    }

    private buildLsdReturnConfirmDialog() {
        return (
            <Dialog
                open={true}
                close={this.props.closeDialog}
                id={styles.choice_dialog}
            >
                <ReturnLsdConfirm
                    publication={this.props.dialog.data.publication}
                />
            </Dialog>
        );
    }

    private buildSameFileImportConfirmDialog() {
        return (
            <Dialog
                open={true}
                close={this.props.closeDialog}
                id={styles.choice_dialog}
            >
                <SameFileImportConfirm
                    publication={this.props.dialog.data.publication}
                    downloadSample={this.props.dialog.data.downloadSample}
                />
            </Dialog>
        );
    }

    private buildAboutThoriumDialog() {
        return (
            <Dialog
                open={true}
                close={this.props.closeDialog}
            >
                <Information />
            </Dialog>
        );
    }
    */
}

/*
const mapDispatchToProps = (dispatch: TDispatch) => {
    return {
        closeDialog: () => {
            // TODO: this is a short-term hack.
            // Can we instead subscribe to Redux action type == ActionType.CloseRequest,
            // but narrow it down specically to the window instance (not application-wide)
            window.document.dispatchEvent(new Event("Thorium:DialogClose"));

            dispatch(
                dialogActions.close(),
            );
        },
    };
};
*/

const mapStateToProps = (state: RootState) => {
    return {
        dialog: state.dialog,
    };
};

export default connect(mapStateToProps)(DialogManager);
