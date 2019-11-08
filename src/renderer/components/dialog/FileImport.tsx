// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { DialogType } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { apiAction } from "readium-desktop/renderer/apiAction";
import * as styles from "readium-desktop/renderer/assets/styles/dialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";

import Dialog from "./Dialog";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
}

class FileImport extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);

        this.importFiles = this.importFiles.bind(this);
    }

    public render(): React.ReactElement<{}> {
        if (!this.props.open) {
            return (<></>);
        }

        const { files, closeDialog} = this.props;
        return (
            <Dialog open={true} close={closeDialog} id={styles.add_dialog}>
                {
                    (!files || files.length === 0) ?
                        (<div> {this.props.__("dialog.importError")}</div>) :
                        (
                            <>
                                <div>
                                    <p>{this.props.__("dialog.import")}</p>
                                    <ul>
                                        {files.map((file, i) => <li key={i}>{file.name}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <button className={styles.primary} onClick={this.importFiles}>
                                        {this.props.__("dialog.yes")}
                                    </button>
                                    <button onClick={closeDialog}>{this.props.__("dialog.no")}</button>
                                </div>
                            </>
                        )
                }
            </Dialog>
        );
    }

    private importFiles() {
        if (this.props.files) {
            const paths = this.props.files.map((file) => {
                return file.path;
            });
            apiAction("publication/import", paths).catch((error) => {
                console.error(`Error to fetch publication/import`, error);
            });
            this.props.closeDialog();
        }
    }
}

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        closeDialog: () => {
            dispatch(
                dialogActions.closeRequest.build(),
            );
        },
    };
};

const mapStateToProps = (state: RootState, _props: IBaseProps) => ({
    open: state.dialog.type === "file-import",
    files: (state.dialog.data as DialogType["file-import"]).files,
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(FileImport));
