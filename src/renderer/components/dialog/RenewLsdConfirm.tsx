// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { TranslatorProps } from "readium-desktop/renderer/components/utils/hoc/translator";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import { withApi } from "readium-desktop/renderer/components/utils/hoc/api";

import { PublicationView } from "readium-desktop/common/views/publication";

import * as styles from "readium-desktop/renderer/assets/styles/dialog.css";

interface DeletePublicationConfirmProps extends TranslatorProps {
    publication?: PublicationView;
    renewPublicationLicense?: any;
    closeDialog?: any;
}

export class RenewLsdConfirm extends React.Component<DeletePublicationConfirmProps, undefined> {
    public constructor(props: any) {
        super(props);

        this.renew = this.renew.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const {__} = this.props;
        if (!this.props.publication) {
            return <></>;
        }

        return (
            <div>
                <p>
                    {__("dialog.renew")}
                    <span>{this.props.publication.title}</span>
                </p>
                <div>
                    <button className={ styles.primary } onClick={this.renew}>{__("dialog.yes")}</button>
                    <button onClick={this.props.closeDialog}>{__("dialog.no")}</button>
                </div>
            </div>
        );
    }

    public renew(e: any) {
        e.preventDefault();
        this.props.renewPublicationLicense({
            publication: {
                identifier: this.props.publication.identifier,
            },
        });
        this.props.closeDialog();
    }
}

const mapDispatchToProps = (dispatch: any, _props: any) => {
    return {
        closeDialog: () => {
            dispatch(
                dialogActions.close(),
            );
        },
    };
};

export default withApi(
    RenewLsdConfirm,
    {
        operations: [
            {
                moduleId: "lcp",
                methodId: "renewPublicationLicense",
                callProp: "renewPublicationLicense",
            },
        ],
        mapDispatchToProps,
    },
);
