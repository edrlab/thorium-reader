// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { PublicationView } from "readium-desktop/common/views/publication";
import { apiFetch } from "readium-desktop/renderer/apiFetch";
import * as styles from "readium-desktop/renderer/assets/styles/dialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { TMouseEvent } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";

interface IProps extends TranslatorProps, ReturnType<typeof mapDispatchToProps> {
    publication?: PublicationView;
}

class RenewLsdConfirm extends React.Component<IProps> {
    public constructor(props: any) {
        super(props);

        this.renew = this.renew.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
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
                    <button className={styles.primary} onClick={this.renew}>{__("dialog.yes")}</button>
                    <button onClick={this.props.closeDialog}>{__("dialog.no")}</button>
                </div>
            </div>
        );
    }

    public renew(e: TMouseEvent) {
        e.preventDefault();
        apiFetch("lcp/renewPublicationLicense", {
            publication: {
                identifier: this.props.publication.identifier,
            },
        }).catch((error) => {
            console.error(`Error to fetch lcp/renewPublicationLicense`, error);
        });
        this.props.closeDialog();
    }
}

const mapDispatchToProps = (dispatch: TDispatch) => {
    return {
        closeDialog: () => {
            dispatch(
                dialogActions.close(),
            );
        },
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(RenewLsdConfirm));
/*withApi(
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
);*/
