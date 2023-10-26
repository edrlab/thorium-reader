// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
// import { connect } from "react-redux";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
// import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
// import Dialog from "readium-desktop/renderer/common/components/dialog/Dialog";
// import {
//     TranslatorProps, withTranslator,
// } from "readium-desktop/renderer/common/components/hoc/translator";
// import { apiAction } from "readium-desktop/renderer/library/apiAction";
// import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { IOpdsFeedView } from "readium-desktop/common/views/opds";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useApi } from "readium-desktop/renderer/common/hooks/useApi";
import { useDispatch } from "react-redux";
import { dialogActions } from "readium-desktop/common/redux/actions";
import * as stylesAlertModals from "readium-desktop/renderer/assets/styles/components/alert.modals.css";
import classNames from "classnames";

// // eslint-disable-next-line @typescript-eslint/no-empty-interface
// interface IBaseProps extends TranslatorProps {
// }
// // IProps may typically extend:
// // RouteComponentProps
// // ReturnType<typeof mapStateToProps>
// // ReturnType<typeof mapDispatchToProps>
// // eslint-disable-next-line @typescript-eslint/no-empty-interface
// interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
// }

// class DeleteOpdsFeedConfirm extends React.Component<IProps, undefined> {

//     constructor(props: IProps) {
//         super(props);
//     }

//     public render(): React.ReactElement<{}> {
//         if (!this.props.open || !this.props.feed) {
//             return (<></>);
//         }

//         const { __ } = this.props;
//         return (
//             <Dialog
//                 title={__("dialog.deleteFeed")}
//                 onSubmitButton={this.remove}
//                 submitButtonDisabled={false}
//                 submitButtonTitle={this.props.__("dialog.yes")}
//                 shouldOkRefEnabled={true}
//                 size={"small"}
//             >
//                 <p>
//                     <span>{this.props.feed.title}</span>
//                 </p>
//             </Dialog>
//         );
//     }

//     private remove = () => {
//         apiAction("opds/deleteFeed", this.props.feed.identifier).catch((error) => {
//             console.error("Error to fetch opds/deleteFeed", error);
//         });
//     };
// }

// const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
//     open: state.dialog.type === DialogTypeName.DeleteOpdsFeedConfirm,
//     feed: (state.dialog.data as DialogType[DialogTypeName.DeleteOpdsFeedConfirm]).feed,
// });

// export default connect(mapStateToProps)(withTranslator(DeleteOpdsFeedConfirm));

const DeleteOpdsFeedConfirm = (props: { feed: IOpdsFeedView, trigger: React.ReactNode } & AlertDialog.AlertDialogProps) => {
    const [__] = useTranslator();
    const [_, remove] = useApi(undefined, "opds/deleteFeed");
    const dispatch = useDispatch();
    const removeAction = React.useCallback(() => {
        dispatch(dialogActions.closeRequest.build());
        remove(props.feed.identifier);
    }, [remove, props.feed.identifier]);

    const appOverlayElement = React.useMemo(() => document.getElementById("app-overlay"), []);
    return (
        <AlertDialog.Root {...props}>
            <AlertDialog.Trigger asChild>
                {props.trigger}
            </AlertDialog.Trigger>
            <AlertDialog.Portal container={appOverlayElement}>

                {/** Overlay Component doesn't work */}
                {/* <AlertDialog.Overlay className={stylesAlertModals.AlertDialogOverlay}/> */}
                <div className={stylesAlertModals.AlertDialogOverlay}></div>
                <AlertDialog.Content className={stylesAlertModals.AlertDialogContent}>
                    <AlertDialog.Title className={stylesAlertModals.AlertDialogTitle}>{__("dialog.deleteFeed")}</AlertDialog.Title>
                    <AlertDialog.Description className={stylesAlertModals.AlertDialogDescription}>
                        {props.feed.title}
                    </AlertDialog.Description>
                    <div style={{ display: "flex", gap: 25, justifyContent: "flex-end" }}>
                        <AlertDialog.Cancel asChild>
                            <button className={classNames(stylesAlertModals.AlertDialogButton, stylesAlertModals.abort)}>{__("dialog.cancel")}</button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <button className={classNames(stylesAlertModals.AlertDialogButton, stylesAlertModals.delete)} onClick={removeAction} type="button">{__("dialog.yes")}</button>
                        </AlertDialog.Action>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );

};

export default DeleteOpdsFeedConfirm;
