// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { DialogType } from "readium-desktop/common/models/dialog";
import { dialogActions } from "readium-desktop/common/redux/actions";
import { apiAction } from "readium-desktop/renderer/apiAction";
import * as styles from "readium-desktop/renderer/assets/styles/dialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";

import Dialog from "./Dialog";

interface IProps extends TranslatorProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
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
        if (!this.props.open) {
            return (<></>);
        }

        const { __, closeDialog } = this.props;
        return (
            <Dialog open={true} close={closeDialog} id={styles.choice_dialog}>
                <div>
                    <p>
                        {__("dialog.alreadyAdd")}
                        <span>{this.props.publication.title}</span>
                    </p>
                    <p>{__("dialog.sure")}</p>
                    <div>
                        <button onClick={this.addToCatalog}>{__("dialog.yes")}</button>
                        <button className={styles.primary} onClick={closeDialog}>{__("dialog.no")}</button>
                    </div>
                </div>
            </Dialog>
        );
    }

    private addToCatalog() {
        apiAction("publication/importOpdsEntry",
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

const mapStateToProps = (state: RootState) => ({
    ...{
        open: state.dialog.type === "same-file-import-confirm",
    }, ...state.dialog.data as DialogType["same-file-import-confirm"],
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(SameFileImportConfirm));
