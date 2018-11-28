import * as React from "react";

import Dialog from "readium-desktop/renderer/components/utils/Dialog";

import { libraryActions } from "readium-desktop/renderer/redux/actions";

import { connect } from "react-redux";

import PublicationInfo from "./PublicationInfo";

interface PublicationInfoDialogProps {
    open?: boolean;
    closeDialog?: any;
}

export class PublicationInfoDialog extends React.Component<PublicationInfoDialogProps, undefined> {
    public constructor(props: any) {
        super(props);

        this.closeDialog = this.closeDialog.bind(this);
    }

    public render(): React.ReactElement<{}> {
        return (
            <Dialog open={this.props.open} close={this.props.closeDialog}>
                <PublicationInfo />
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
    let open = (publication != null && publication.identifier != null);
    return { open };
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
