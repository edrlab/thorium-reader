// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesAlertModals from "readium-desktop/renderer/assets/styles/components/alert.modals.scss";

import * as React from "react";
import { connect } from "react-redux";
import { acceptedExtensionArray } from "readium-desktop/common/extension";
import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import classNames from "classnames";
import { TDispatch } from "readium-desktop/typings/redux";
import { dialogActions } from "readium-desktop/common/redux/actions";
import * as AddIcon from "readium-desktop/renderer/assets/icons/add-alone.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

class FileImport extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        if (!this.props.open) {
            return (<></>);
        }

        const { files } = this.props;

        return <AlertDialog.Root defaultOpen={true} onOpenChange={(b) => !b ? this.props.closeDialog() : undefined}>
            <AlertDialog.Portal>
                <AlertDialog.Overlay className={stylesAlertModals.AlertDialogOverlay}/>
                <AlertDialog.Content className={stylesAlertModals.AlertDialogContent} style={{overflowY: "scroll"}}>
                    <AlertDialog.Title className={stylesAlertModals.AlertDialogTitle}>
                        {(files?.length > 0) ?
                            this.props.__("dialog.import")
                            :
                            this.props.__("catalog.addBookToLib")
                        }
                    </AlertDialog.Title>
                    <AlertDialog.Description className={stylesAlertModals.AlertDialogDescription}>
                        {
                            // useless ??
                            (!files || files.length === 0) ?
                                (
                                    // <div >
                                    <>
                                        {
                                            this.props.__("dialog.importError", {
                                                acceptedExtension: acceptedExtensionArray.join(" "),
                                            })
                                        }
                                    </>
                                    // </div>
                                ) : (
                                    // <div className={stylesAlertModals.AlertDialogContent}>
                                    <div>
                                            <ul>
                                                {files.map((file, i) => <li key={i}>{file.name}</li>)}
                                            </ul>
                                    </div>
                                        // <div>
                                        // </div>
                                    // </div>
                                )
                        }
                    </AlertDialog.Description>
                    <div className={stylesAlertModals.AlertDialogButtonContainer}>
                        <AlertDialog.Cancel asChild>
                            <button className={classNames(stylesAlertModals.AlertDialogButton, stylesAlertModals.abort)}>{this.props.__("dialog.cancel")}</button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <button className={classNames(stylesAlertModals.AlertDialogButton, stylesAlertModals.yes)} onClick={() => this.importFiles()}>
                                <SVG ariaHidden svg={AddIcon} />
                                {this.props.__("catalog.addBookToLib")}</button>
                        </AlertDialog.Action>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>;
    }

    private importFiles = () => {
        if (this.props.files) {
            const paths = this.props.files.map((file) => {
                return file.path;
            });
            apiAction("publication/importFromFs", paths).catch((error) => {
                console.error("Error to fetch publication/importFromFs", error);
            });
        }
    };
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    open: state.dialog.type === DialogTypeName.FileImport,
    files: (state.dialog.data as DialogType[DialogTypeName.FileImport]).files,
    locale: state.i18n.locale,
});

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        closeDialog: () => {
            dispatch(
                dialogActions.closeRequest.build(),
            );
        },
    };
};



export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(FileImport));
