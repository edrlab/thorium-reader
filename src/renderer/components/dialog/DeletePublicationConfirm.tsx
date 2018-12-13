import * as React from "react";

import { TranslatorProps } from "readium-desktop/renderer/components/utils/translator";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import * as styles from "readium-desktop/renderer/assets/styles/app.css";

import { PublicationView } from "readium-desktop/common/views/publication";

interface DeletePublicationConfirmProps extends TranslatorProps {
    publication?: PublicationView;
    delete?: any;
    closeDialog?: any;
}

export class DeletePublicationConfirm extends React.Component<DeletePublicationConfirmProps, undefined> {

    public constructor(props: any) {
        super(props);

        this.remove = this.remove.bind(this);
    }

    public render(): React.ReactElement<{}> {
        if (!this.props.publication) {
            return <></>;
        }

        return (
            <div>
                <p>Êtes vous sûr de vouloir supprimer ce livre : {this.props.publication.title} ?</p>
                <div>
                    <button onClick={this.remove}>Oui</button>
                    <button onClick={this.props.closeDialog}>Non</button>
                </div>
            </div>
        );
    }

    public remove(e: any) {
        e.preventDefault();
        this.props.delete({ identifier: this.props.publication.identifier });
        this.props.closeDialog();
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

export default withApi(
    DeletePublicationConfirm,
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "delete",
                callProp: "delete",
            },
        ],
        mapDispatchToProps,
    },
);
