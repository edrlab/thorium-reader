// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { acceptedExtensionArray } from "readium-desktop/common/extension";
import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.css";
import Dialog from "readium-desktop/renderer/common/components/dialog/Dialog";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
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

        const { files, closeDialog } = this.props;
        return (
            <Dialog
                open={true}
                close={closeDialog}
                id={stylesModals.add_dialog}
                title={this.props.__("catalog.addBookToLib")}
            >
                {
                    (!files || files.length === 0) ?
                    (
                        <div className={stylesModals.modal_dialog_body}>
                            {
                                this.props.__("dialog.importError", {
                                    acceptedExtension: acceptedExtensionArray.join(" | "),
                                })
                            }
                        </div>
                    ) : (
                        <>
                        <div className={stylesModals.modal_dialog_body}>
                            <div>
                                <p>{this.props.__("dialog.import")}</p>
                                <ul>
                                    {files.map((file, i) => <li key={i}>{file.name}</li>)}
                                </ul>
                            </div>
                            <div>
                            </div>
                        </div>
                        <div className={stylesModals.modal_dialog_footer}>
                            <button className={stylesButtons.button_primary} onClick={closeDialog}>
                                {this.props.__("dialog.no")}
                            </button>
                            <button className={stylesButtons.button_primary} onClick={this.importFiles}>
                                {this.props.__("dialog.yes")}
                            </button>
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
            apiAction("publication/importFromFs", paths).catch((error) => {
                console.error("Error to fetch publication/importFromFs", error);
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

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    open: state.dialog.type === DialogTypeName.FileImport,
    files: (state.dialog.data as DialogType[DialogTypeName.FileImport]).files,
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(FileImport));
