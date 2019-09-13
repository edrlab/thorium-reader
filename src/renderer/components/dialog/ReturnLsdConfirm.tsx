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

interface IProps extends TranslatorProps, ReturnType<typeof mapDispatchToProps> {
    publication: PublicationView;
}

class LsdReturnConfirm extends React.Component<IProps> {

    public constructor(props: IProps) {
        super(props);

        this.remove = this.remove.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
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

const mapDispatchToProps = (dispatch: any, _props: any) => {
    return {
        closeDialog: () => {
            dispatch(
                dialogActions.close(),
            );
        },
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(LsdReturnConfirm));
/*withApi(
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
);*/
