// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { TranslatorProps } from "readium-desktop/renderer/components/utils/translator";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import * as styles from "readium-desktop/renderer/assets/styles/dialog.css";

interface FileImportProps extends TranslatorProps {
    files: any;
    importFiles?: any;
    closeDialog?: any;
}

export class FileImport extends React.Component<FileImportProps, undefined> {
    constructor(props: any) {
        super(props);
        this.importFiles = this.importFiles.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const {__} = this.props;
        return (
            <div>
                { this.buildBasicFileImportList() }

            </div>
        );
    }

    private importFiles() {
        if (this.props.files) {
            const paths = this.props.files.map((file: File) => {
                return file.path;
            });
            this.props.importFiles({ paths });
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
                    <p>{ this.props.__("dialog.import") }</p>
                    <ul>
                        { files.map((file: File, i: number) => {
                            return (
                                <li key={ i }>{ file.name }</li>
                            );
                        })}
                    </ul>
                </div>
                <div>
                    <button className={ styles.primary } onClick={ this.importFiles }>
                        { this.props.__("dialog.yes") }
                    </button>
                    <button onClick={ this.props.closeDialog }>{this.props.__("dialog.no") }</button>
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

export default withApi(
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
);
