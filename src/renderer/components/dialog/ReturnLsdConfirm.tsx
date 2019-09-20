// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { PublicationView } from "readium-desktop/common/views/publication";
import { TLcpApiReturnPublication } from "readium-desktop/main/api/lcp";
import * as styles from "readium-desktop/renderer/assets/styles/dialog.css";
import { withApi } from "readium-desktop/renderer/components/utils/hoc/api";
import { TranslatorProps } from "readium-desktop/renderer/components/utils/hoc/translator";

interface LsdReturnConfirmProps extends TranslatorProps {
    publication?: PublicationView;
    returnPublication?: TLcpApiReturnPublication;
    closeDialog?: any;
}

export class LsdReturnConfirm extends React.Component<LsdReturnConfirmProps, undefined> {

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
                    {__("dialog.return")}
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
        this.props.returnPublication({
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
    LsdReturnConfirm,
    {
        operations: [
            {
                moduleId: "lcp",
                methodId: "returnPublication",
                callProp: "returnPublication",
            },
        ],
        mapDispatchToProps,
    },
);
