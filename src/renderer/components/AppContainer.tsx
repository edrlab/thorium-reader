// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import PageManager from "readium-desktop/renderer/components/PageManager";

import DialogManager from "readium-desktop/renderer/components/dialog/DialogManager";

import Dropzone from "react-dropzone";

import * as styles from "readium-desktop/renderer/assets/styles/app.css";

import { lazyInject } from "readium-desktop/renderer/di";

import { Store } from "redux";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import { DialogType } from "readium-desktop/common/models/dialog";

import { render } from "react-dom";
import { RootState } from "../redux/states";

import { connect } from "react-redux";

import { setLocale } from "readium-desktop/common/redux/actions/i18n";

interface Props {
        locale?: string;
        setLocale?: (locale: string) => void;
        onDrop: (acceptedFiles: File[]) => void;
}

export class AppContainer extends React.Component<any, Props> {
        constructor(props: any) {
                super(props);

                this.onDrop = this.onDrop.bind(this);
        }

        public render(): React.ReactElement<{}> {
                const { locale } = this.props;
                return (
                        <div className={styles.root}>
                                <Dropzone disableClick onDrop={ this.onDrop } style={{
                                        position: "absolute",
                                        top: 0,
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                }}>
                                        <PageManager key={`page-manager-${locale}`} />
                                        <DialogManager key={`dialog-manager-${locale}`} />
                                </Dropzone>
                        </div>
                );
        }

        // Called when files are droped on the dropzone
    public onDrop(acceptedFiles: File[], rejectedFiles: File[]) {
        this.props.onDrop(acceptedFiles);
    }
}

const mapStateToProps = (state: any) => {
        return {
                locale: state.i18n.locale,
        };
};

const mapDispatchToProps = (dispatch: any) => {
        return {
                setLocale: (locale: string) => dispatch(setLocale(locale)),
                onDrop: (acceptedFiles: File[]) => dispatch(
                        dialogActions.open(
                            DialogType.FileImport,
                            {
                                files: acceptedFiles.map((file) => {
                                    return {
                                        name: file.name,
                                        path: file.path,
                                    };
                                }),
                            },
                    )),
        };

};

export default connect(mapStateToProps, mapDispatchToProps)(AppContainer);
