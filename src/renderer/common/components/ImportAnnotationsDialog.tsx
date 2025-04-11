// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { annotationActions } from "readium-desktop/common/redux/actions";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesAlertModals from "readium-desktop/renderer/assets/styles/components/alert.modals.scss";
import { PublicationView } from "readium-desktop/common/views/publication";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as PlusIcon from "readium-desktop/renderer/assets/icons/Plus-bold.svg";
import { convertMultiLangStringToString } from "readium-desktop/common/language-string";

export const ImportAnnotationsDialog: React.FC<React.PropsWithChildren<{ winId: string | undefined, publicationView: PublicationView }>> = (props) => {

    const importAnnotationState = useSelector((state: IRendererCommonRootState) => state.importAnnotations);
    const locale = useSelector((state: IRendererCommonRootState) => state.i18n.locale);
    const { open, title, annotationsList, annotationsConflictListOlder, annotationsConflictListNewer, winId, about } = importAnnotationState;
    const { publicationView } = props;
    const { publicationTitle, authorsLangString, identifier } = publicationView;
    const dispatch = useDispatch();
    const [__] = useTranslator();

    React.useEffect(() => {

        return () => {

            if (open) {
                dispatch(annotationActions.importConfirmOrAbort.build("abort"));
            }
        };
    }, [open, dispatch]);

    const creatorNameList = [...annotationsList].reduce<string[]>((acc, {creator}) => {
        if (creator?.name && !acc.includes(creator?.name)) {
            return [...acc, creator.name];
        }
        return acc;
    }, []);

    const originTitle = about?.["dc:title"] || "";
    const originCreator = (Array.isArray(about?.["dc:creator"]) ? about["dc:creator"] : []).join(", ") || "";

    return (
        <AlertDialog.Root open={props.winId === winId && open} onOpenChange={(requestOpen) => {
            if (requestOpen) {
                dispatch(annotationActions.importAnnotationSet.build(identifier, props.winId));
            } else {
                // dispatch it only on esc

                if (open) {
                    dispatch(annotationActions.importConfirmOrAbort.build("abort"));

                }
            }
        }}>
            <AlertDialog.Trigger asChild>
                {props.children}
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
                <AlertDialog.Overlay className={stylesAlertModals.AlertDialogOverlay} />
                <AlertDialog.Content className={stylesAlertModals.AlertDialogContent}>
                    <AlertDialog.Title className={stylesAlertModals.AlertDialogTitle}>{__("dialog.annotations.title")}</AlertDialog.Title>
                    <AlertDialog.Description className={stylesAlertModals.AlertDialogDescription} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <span>{originTitle ? __("dialog.annotations.origin", { title: originTitle, author: originCreator ? __("dialog.annotations.descAuthor", { author: originCreator }) : "" }) : ""}</span>
                        <span>{title ? `${__("dialog.annotations.descTitle")}'${title}'` : ""}</span>
                        <span>{annotationsList.length ? __("dialog.annotations.descList", {
                            count: annotationsList.length,
                            creator: creatorNameList.length ? `${__("dialog.annotations.descCreator")} '${creatorNameList.join(", ")}'` : "", // TODO i18n
                            title: convertMultiLangStringToString(publicationTitle, locale),
                            author: authorsLangString[0] ? __("dialog.annotations.descAuthor", { author: convertMultiLangStringToString(authorsLangString[0], locale) }) : "",
                        }) : <></>}</span>
                        <span>{annotationsConflictListNewer.length ? __("dialog.annotations.descNewer", { count: annotationsConflictListNewer.length }) : <></>}</span>
                        <span>{annotationsConflictListOlder.length ? __("dialog.annotations.descOlder", { count: annotationsConflictListOlder.length }) : <></>}</span>
                    </AlertDialog.Description>
                    <div className={stylesAlertModals.AlertDialogButtonContainer}>
                        <AlertDialog.Cancel asChild onClick={() => dispatch(annotationActions.importConfirmOrAbort.build("abort"))}>
                            <button className={stylesButtons.button_secondary_blue}>{__("dialog.cancel")}</button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <button className={stylesButtons.button_primary_blue} onClick={() => dispatch(annotationActions.importConfirmOrAbort.build("importAll"))}>
                                <SVG ariaHidden svg={PlusIcon} />
                                {__("dialog.annotations.importAll")}
                            </button>
                        </AlertDialog.Action>
                        {
                            annotationsConflictListNewer.length || annotationsConflictListOlder.length
                                ? <AlertDialog.Action asChild>
                                    <button className={stylesButtons.button_primary_blue} onClick={() => dispatch(annotationActions.importConfirmOrAbort.build("importNoConflict"))}>
                                        <SVG ariaHidden svg={PlusIcon} />
                                        {__("dialog.annotations.importWithoutConflict")}
                                    </button>
                                </AlertDialog.Action>
                                : <></>
                        }
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );
};
