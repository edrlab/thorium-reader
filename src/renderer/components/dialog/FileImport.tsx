// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { IFileImport, DialogType } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { apiFetch } from "readium-desktop/renderer/apiFetch";
import * as styles from "readium-desktop/renderer/assets/styles/dialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";

import Dialog from "./Dialog";

interface IProps extends TranslatorProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
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
            apiFetch("publication/import", paths).catch((error) => {
                console.error(`Error to fetch publication/import`, error);
            });
            this.props.closeDialog();
        }
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
    open: state.dialog.type === "file-import",
    files: (state.dialog.data as DialogType["file-import"]).files,
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(FileImport));
/*withApi(
    FileImport,
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "import",
                callProp: "importFiles",
            },
        ],
        mapDispatchToProps,
    },
);*/
