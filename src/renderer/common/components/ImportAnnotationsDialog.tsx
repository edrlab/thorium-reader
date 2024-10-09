// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";

import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { annotationActions } from "readium-desktop/common/redux/actions";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import * as Dialog from "@radix-ui/react-dialog";
import classNames from "classnames";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";

export const ImportAnnotationsDialog: React.FC<React.PropsWithChildren<{winId: string | undefined}>> = (props) => {

    const importAnnotationState = useSelector((state: IRendererCommonRootState) => state.importAnnotations);
    const { open, about: about, title, generated, generator, annotationsList, annotationsConflictList, winId } = importAnnotationState;
    const dispatch = useDispatch();
    const [__] = useTranslator();

    let closeState: annotationActions.importConfirmOrAbort.TAction["payload"]["state"] = "abort";

    React.useEffect(() => {

        return () => {

            if (open) {
                dispatch(annotationActions.importConfirmOrAbort.build("abort"));
            }
        };
    }, [open, dispatch]);

    return (
        <Dialog.Root open={props.winId === winId && open} onOpenChange={(isOpen) => {
            if (isOpen) {
                // nothing,  triggered by main process
            } else {
                // dispatch it only on esc
                dispatch(annotationActions.importConfirmOrAbort.build(closeState));
            }
        }}>
            <Dialog.Trigger asChild>
                {props.children}
            </Dialog.Trigger>
            <Dialog.Portal>
                <div className={classNames(stylesModals.modal_dialog_overlay)}></div>
                <Dialog.Content className={classNames(stylesModals.modal_dialog)}>
                    <Dialog.Title>Import Annotations</Dialog.Title>

                    <form className={stylesModals.modal_dialog_body} onSubmit={(e) => e.preventDefault()}>
                        <fieldset>
                            <legend>Annotations Set Information</legend>
                            <ul>
                                <li><strong>Title:</strong> {title}</li>
                                <li><strong>Generated:</strong> {generated}</li>
                                <li><strong>Generator:</strong></li>
                                {generator ?
                                    <ul>
                                        <li><strong>ID:</strong> {generator?.id}</li>
                                        <li><strong>Type:</strong> {generator?.type}</li>
                                        <li><strong>Name:</strong> {generator?.name}</li>
                                        <li><strong>Homepage:</strong> {generator?.homepage}</li>
                                    </ul>
                                    : <></>}
                            </ul>
                        </fieldset>

                        <fieldset>
                            <legend>About the Book</legend>
                            <ul>
                                {about ? <>
                                    <li><strong>dc:identifier:</strong>
                                        <ul>
                                            {about["dc:identifier"].map((v, i) => <li key={"dcid" + i}>{v}</li>)}
                                        </ul>
                                    </li>
                                    <li><strong>dc:format:</strong> {about["dc:format"]}</li>
                                    <li><strong>dc:title:</strong> {about["dc:title"]}</li>
                                    <li><strong>dc:publisher:</strong> {about["dc:publisher"]}</li>
                                    <li><strong>dc:creator:</strong> {about["dc:creator"]}</li>
                                    <li><strong>dc:date:</strong> {about["dc:date"]}</li>
                                </>

                                    : <></>}

                            </ul>
                        </fieldset>

                        <fieldset>
                            <legend>Annotations List</legend>
                            <ul id="annotationsList">
                                {
                                    annotationsList.map(({ uuid, locatorExtended, color, drawType, tags, modified, created, comment }, i) => {
                                        return (
                                            <li key={"an" + i}>
                                                <strong>UUID:</strong> {uuid}
                                                <ul>
                                                    <li><strong>Locator:</strong> {locatorExtended?.locator?.href}</li>
                                                    <li><strong>Highlight:</strong> {locatorExtended?.locator?.text?.highlight}</li>
                                                    <li><strong>Comment:</strong> {comment}</li>
                                                    <li><strong>Color:</strong> RGB({color.red}, {color.green}, {color.blue})</li>
                                                    <li><strong>Draw Type:</strong> {drawType}</li>
                                                    <li><strong>Tags:</strong> {tags?.join(", ")}</li>
                                                    <li><strong>Modified:</strong> {modified}</li>
                                                    <li><strong>Created:</strong> {created}</li>
                                                </ul>
                                            </li>
                                        );
                                    })
                                }
                            </ul>
                        </fieldset>
                        <fieldset>
                            <legend>Annotations With A Conflict</legend>
                            <ul id="annotationsListConflict">
                                {
                                    annotationsConflictList.map(({ uuid, locatorExtended, color, drawType, tags, modified, created, comment }, i) => {
                                        return (
                                            <li key={"ac" + i}>
                                                <strong>UUID:</strong> {uuid}
                                                <ul>
                                                    <li><strong>Locator:</strong> {locatorExtended?.locator?.href}</li>
                                                    <li><strong>Highlight:</strong> {locatorExtended?.locator?.text?.highlight}</li>
                                                    <li><strong>Comment:</strong> {comment}</li>
                                                    <li><strong>Color:</strong> RGB({color.red}, {color.green}, {color.blue})</li>
                                                    <li><strong>Draw Type:</strong> {drawType}</li>
                                                    <li><strong>Tags:</strong> {tags?.join(", ")}</li>
                                                    <li><strong>Modified:</strong> {modified}</li>
                                                    <li><strong>Created:</strong> {created}</li>
                                                </ul>
                                            </li>
                                        );
                                    })
                                }
                            </ul>
                        </fieldset>

                        <div className={stylesModals.modal_dialog_footer}>
                            <Dialog.Close asChild>
                                <button className={stylesButtons.button_secondary_blue}>{__("dialog.cancel")}</button>
                            </Dialog.Close>
                            <Dialog.Close asChild>
                                <button className={stylesButtons.button_primary_blue} onClick={() => (closeState = "importAll")}>Import All</button>
                            </Dialog.Close>
                            <Dialog.Close asChild>
                                <button className={stylesButtons.button_primary_blue} onClick={() => (closeState = "importNoConflict")}>Import No Conflict</button>
                            </Dialog.Close>
                        </div>
                    </form>
                </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root >
    );

};
