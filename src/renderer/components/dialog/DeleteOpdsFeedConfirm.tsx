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

import { OpdsFeedView } from "readium-desktop/common/views/opds";

import * as styles from "readium-desktop/renderer/assets/styles/dialog.css";

interface DeleteOpdsFeedConfirmProps extends TranslatorProps {
    feed?: OpdsFeedView;
    delete?: any;
    closeDialog?: any;
}

export class DeleteOpdsFeedConfirm extends React.Component<DeleteOpdsFeedConfirmProps, undefined> {

    public constructor(props: any) {
        super(props);

        this.remove = this.remove.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const {__} = this.props;
        if (!this.props.feed) {
            return <></>;
        }

        return (
            <div>
                <p>
                    {__("dialog.delete")}
                    <span>{this.props.feed.title}</span>
                </p>
                <div>
                    <button onClick={ this.remove }>{__("dialog.yes")}</button>
                    <button className={styles.primary} onClick={ this.props.closeDialog }>{__("dialog.no")}</button>
                </div>
            </div>
        );
    }

    public remove(e: any) {
        e.preventDefault();
        this.props.delete({ identifier: this.props.feed.identifier });
        this.props.closeDialog();
    }
}

const mapDispatchToProps = (dispatch: any) => {
    return {
        closeDialog: () => {
            dispatch(
                dialogActions.close(),
            );
        },
    };
};

export default withApi(
    DeleteOpdsFeedConfirm,
    {
        operations: [
            {
                moduleId: "opds",
                methodId: "deleteFeed",
                callProp: "delete",
            },
        ],
        mapDispatchToProps,
    },
);
