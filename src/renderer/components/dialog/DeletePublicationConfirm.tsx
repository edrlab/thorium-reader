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
import { TDispatch } from "readium-desktop/typings/redux";

interface IProps extends TranslatorProps, ReturnType<typeof mapDispatchToProps> {
    publication: PublicationView;
}

class DeletePublicationConfirm extends React.Component<IProps> {

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
                    {__("dialog.deletePublication")}
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
        apiFetch("publication/delete", this.props.publication.identifier).catch((error) => {
            console.error(`Error to fetch publication/delete`, error);
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

export default connect(undefined, mapDispatchToProps)(withTranslator(DeletePublicationConfirm));
/*withApi(
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
);*/
