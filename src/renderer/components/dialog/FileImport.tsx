// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { apiFetch } from "readium-desktop/renderer/apiFetch";
import * as styles from "readium-desktop/renderer/assets/styles/dialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";

interface IProps extends TranslatorProps, ReturnType<typeof mapDispatchToProps> {
    // IFileImport[]
    files: File[];
}

class FileImport extends React.Component<IProps, undefined> {
    constructor(props: IProps) {
        super(props);

        this.importFiles = this.importFiles.bind(this);
    }

    public render(): React.ReactElement<{}> {
        return (
            <>
                {this.buildBasicFileImportList()}
            </>
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

    private buildBasicFileImportList() {
        const { files } = this.props;

        if (!files || files.length === 0) {
            return (<div> {this.props.__("dialog.importError")}</div>);
        }

        return (
            <>
                <div>
                    <p>{this.props.__("dialog.import")}</p>
                    <ul>
                        {files.map((file: File, i: number) => {
                            return (
                                <li key={i}>{file.name}</li>
                            );
                        })}
                    </ul>
                </div>
                <div>
                    <button className={styles.primary} onClick={this.importFiles}>
                        {this.props.__("dialog.yes")}
                    </button>
                    <button onClick={this.props.closeDialog}>{this.props.__("dialog.no")}</button>
                </div>
            </>
        );
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

export default connect(undefined, mapDispatchToProps)(withTranslator(FileImport));
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
