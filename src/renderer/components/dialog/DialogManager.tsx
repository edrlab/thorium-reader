import * as React from "react";

import { connect } from "react-redux";

import { DialogType } from "readium-desktop/common/models/dialog";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import { DialogState } from "readium-desktop/common/redux/states/dialog";

import { RootState } from "readium-desktop/renderer/redux/states";

import Dialog from "./Dialog";

import FileImport from "./FileImport";

import OpdsFeedAddForm from "./OpdsFeedAddForm";

import PublicationInfo from "readium-desktop/renderer/components/publication/PublicationInfo";

import DeletePublicationConfirm from "./DeletePublicationConfirm";

import * as styles from "readium-desktop/renderer/assets/styles/app.css";

interface DialogManagerProps  {
    dialog?: DialogState;
    closeDialog?: any;
}

export class DialogManager extends React.Component<DialogManagerProps, undefined> {
    constructor(props: any) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const dialog = this.props.dialog;

        if (!dialog || !dialog.open) {
            return (<></>);
        }

        switch (dialog.type) {
            case DialogType.FileImport:
                return this.buildFileImportDialog();
            case DialogType.PublicationInfo:
                return this.buildPublicationShowDialog();
            case DialogType.OpdsFeedAddForm:
                return this.buildOpdsFeedAddFormDialog();
            case DialogType.DeletePublicationConfirm:
                return this.buildDeletePublicationConfirmDialog();
            default:
                return (<></>);
        }
    }

    private buildOpdsFeedAddFormDialog() {
        return (
            <Dialog
                open={ true }
                close={ this.props.closeDialog }
            >
                <OpdsFeedAddForm
                    url={ this.props.dialog.data.opds.url }
                />
          </Dialog>
        );
    }

    private buildPublicationShowDialog() {
        return (
            <Dialog
                open={ true }
                close={ this.props.closeDialog }
            >
                <PublicationInfo
                    publicationIdentifier={ this.props.dialog.data.publication.identifier }
                />
          </Dialog>
        );
    }

    private buildFileImportDialog() {
        return (
            <Dialog
                open={ true }
                close={ this.props.closeDialog }
                id={styles.add_dialog}
            >
                <FileImport
                    files={ this.props.dialog.data.files }
                />
          </Dialog>
        );
    }

    private buildDeletePublicationConfirmDialog() {
        return (
            <Dialog
                open={ true }
                close={ this.props.closeDialog }
                id={styles.delete_publication_dialog}
            >
                <DeletePublicationConfirm
                    publication={ this.props.dialog.data.publication }
                />
          </Dialog>
        );
    }
}

const mapDispatchToProps = (dispatch: any, ownProps: any) => {
    return {
        closeDialog: (data: any) => {
            dispatch(
                dialogActions.close(),
            );
        },
    };
};

const mapStateToProps = (state: RootState, __: any) => {
    return {
        dialog: state.dialog,
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(DialogManager);
