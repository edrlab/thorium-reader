import * as React from "react";

import Dialog from "readium-desktop/renderer/components/utils/Dialog";

import { libraryActions } from "readium-desktop/renderer/redux/actions";

import { connect } from "react-redux";

import PublicationInfo from "./PublicationInfo";

interface PublicationInfoDialogProps {
    open?: boolean;
    closeDialog?: any;
    publicationIdentifier?: any;
}

export class PublicationInfoDialog extends React.Component<PublicationInfoDialogProps, undefined> {
    public constructor(props: any) {
        super(props);

        this.closeDialog = this.closeDialog.bind(this);
    }

    public render(): React.ReactElement<{}> {
        if (!this.props.publicationIdentifier) {
            return (<></>);
        }
        return (
            <Dialog open={this.props.open} close={this.props.closeDialog}>
                <PublicationInfo
                    publicationIdentifier={ this.props.publicationIdentifier }
                />
            </Dialog>
        );
    }

    public closeDialog(e: any) {
        e.preventDefault();

        this.props.closeDialog();
    }
}

const mapStateToProps = (state: any, ownProps: PublicationInfoDialogProps) => {
    const publication = state.library.publicationInfo.publication
    let publicationIdentifier: any = null;
    let open = false;

    if (publication && publication.identifier) {
        publicationIdentifier = publication.identifier;
        open = true;
    }

    return { open, publicationIdentifier };
};

const mapDispatchToProps = (dispatch: any, __1: PublicationInfoDialogProps) => {
    return {
        closeDialog: () => {
            dispatch({
                type: libraryActions.ActionType.PublicationInfoCloseRequest,
            });
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(PublicationInfoDialog);
