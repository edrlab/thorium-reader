// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { dialogActions } from "readium-desktop/common/redux/actions";
import { OpdsPublicationView } from "readium-desktop/common/views/opds";
import { apiFetch } from "readium-desktop/renderer/apiFetch";
import * as styles from "readium-desktop/renderer/assets/styles/dialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { TDispatch } from "readium-desktop/typings/redux";

interface IProps extends TranslatorProps, ReturnType<typeof mapDispatchToProps> {
    publication: OpdsPublicationView;
    downloadSample?: boolean;
}

class SameFileImportConfirm extends React.Component<IProps> {
    public constructor(props: any) {
        super(props);

        this.state = {
            menuOpen: false,
        };

        this.addToCatalog = this.addToCatalog.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <div>
                <p>
                    {__("dialog.alreadyAdd")}
                    <span>{this.props.publication.title}</span>
                </p>
                <p>{__("dialog.sure")}</p>
                <div>
                    <button onClick={this.addToCatalog}>{__("dialog.yes")}</button>
                    <button className={styles.primary} onClick={this.props.closeDialog}>{__("dialog.no")}</button>
                </div>
            </div>
        );
    }

    private addToCatalog() {
        apiFetch("publication/importOpdsEntry",
            this.props.publication.url,
            this.props.publication.base64OpdsPublication,
            this.props.publication.title,
            this.props.downloadSample,
        ).catch((error) => {
            console.error(`Error to fetch publication/importOpdsEntry`, error);
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

export default connect(undefined, mapDispatchToProps)(withTranslator(SameFileImportConfirm));
/*withApi(
    SameFileImportConfirm,
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "importOpdsEntry",
                callProp: "importOpdsEntry",
            },
            {
                moduleId: "publication",
                methodId: "search",
                buildRequestData,
                onLoad: true,
            },
        ],
        mapDispatchToProps,
    },
);*/
