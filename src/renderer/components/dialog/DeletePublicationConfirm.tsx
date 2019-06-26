// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { TranslatorProps } from "readium-desktop/renderer/components/utils/translator";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import { PublicationView } from "readium-desktop/common/views/publication";

import * as styles from "readium-desktop/renderer/assets/styles/dialog.css";

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
        const {__} = this.props;
        if (!this.props.publication) {
            return <></>;
        }

        return (
            <div>
                <p>
                    {__("dialog.delete")}
                    <span>{this.props.publication.title}</span>
                </p>
                <div>
                    <button onClick={this.remove}>{__("dialog.yes")}</button>
                    <button className={styles.primary} onClick={this.props.closeDialog}>{__("dialog.no")}</button>
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
