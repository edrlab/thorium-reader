// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==


import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";

import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import * as React from "react";
import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import {
    PublicationInfoContent,
} from "readium-desktop/renderer/common/components/dialog/publicationInfos/publicationInfoContent";
import { dispatchOpdsLink } from "readium-desktop/renderer/library/opds/handleLink";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";

import CatalogControls from "./catalogControls";
import CatalogLcpControls from "./catalogLcpControls";
import OpdsControls from "./opdsControls/OpdsControls";
import TagManager from "./TagManager";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";

import * as QuitIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { TPublication } from "readium-desktop/common/type/publication.type";
import Loader from "readium-desktop/renderer/common/components/Loader";
import { useLocation } from "react-router";
import { convertMultiLangStringToString } from "readium-desktop/common/language-string";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps {
}

const PublicationInfoLibContext = React.createContext<DialogType[DialogTypeName.PublicationInfoLib] | undefined>(undefined);
export const PublicationInfoLibWithRadix: React.FC<React.PropsWithChildren<{publicationView: Pick<PublicationView, "identifier">}>> = (props) => {
    const defaultOpen = false;

    const dispatch = useDispatch();
    const [open, setOpen] = React.useState(defaultOpen);
    const openFromState = useSelector((state: ILibraryRootState) => state.dialog.open);
    React.useMemo(() => {
        if (!openFromState) {
            setOpen(false);
        }
    }, [openFromState]);
    const data = useSelector((state: ILibraryRootState) =>
        state.dialog.type === DialogTypeName.PublicationInfoLib
            ? state.dialog.data as DialogType[DialogTypeName.PublicationInfoLib]
            : undefined);
    return (
        <Dialog.Root
            defaultOpen={defaultOpen}
            open={open}
            onOpenChange={
                (open) => {
                    if (open) {
                        dispatch(dialogActions.openRequest.build(DialogTypeName.PublicationInfoLib, {
                            publicationIdentifier: props.publicationView.identifier,
                        }));
                        setOpen(true);
                    } else {
                        dispatch(dialogActions.closeRequest.build());
                        setOpen(false);
                    }
                }}
        >
            <PublicationInfoLibContext.Provider value={data}>
                {props.children}
            </PublicationInfoLibContext.Provider>
        </Dialog.Root>
    );
};

export const PublicationInfoLibWithRadixTrigger = Dialog.Trigger;
PublicationInfoLibWithRadixTrigger.displayName = Dialog.Trigger.displayName;
export const PublicationInfoLibWithRadixContent = React.forwardRef<HTMLDivElement, IProps>(
    ({ ...props }, forwardRef) => {
        const [__] = useTranslator();
        const dispatch = useDispatch();
        return (
            <Dialog.Portal>
                {/* <Dialog.Overlay className="DialogOverlay" /> */}
                <div className={stylesModals.modal_dialog_overlay}></div>
                <Dialog.Content className={stylesModals.modal_dialog} {...props} ref={forwardRef} aria-describedby={undefined}>
                    <VisuallyHidden.Root>
                        <Dialog.Title>{__("catalog.bookInfo")}</Dialog.Title>
                    </VisuallyHidden.Root>
                    <div className={stylesModals.modal_dialog_header}>
                        {/* <Dialog.Title className="DialogTitle">{__("catalog.bookInfo")}</Dialog.Title> */}
                        <h1>{__("catalog.bookInfo")}</h1>
                        <Dialog.Close asChild>
                            <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                                <SVG ariaHidden={true} svg={QuitIcon} />
                            </button>
                        </Dialog.Close>
                    </div>
                    <div className={stylesModals.modal_dialog_body}>
                        <PublicationInfoLibContext.Consumer>
                            {
                                (data) =>
                                    <PublicationInfoWithRadixContent publicationViewMaybeOpds={data?.publication} closeDialog={() => dispatch(dialogActions.closeRequest.build())}
                                     />
                            }
                        </PublicationInfoLibContext.Consumer>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        );
    },
);
PublicationInfoLibWithRadixContent.displayName = "PublicationInfoLibWithRadixContent";

const PublicationInfoOpdsContext = React.createContext<DialogType[DialogTypeName.PublicationInfoOpds] | undefined>(undefined);
export const PublicationInfoOpdsWithRadix: React.FC<React.PropsWithChildren<{opdsPublicationView: IOpdsPublicationView}>> = (props) => {
    const defaultOpen = false;

    const dispatch = useDispatch();
    const [open, setOpen] = React.useState(defaultOpen);
    const openFromState = useSelector((state: ILibraryRootState) => state.dialog.open);
    const data = useSelector((state: ILibraryRootState) =>
        state.dialog.type === DialogTypeName.PublicationInfoOpds
            ? state.dialog.data as DialogType[DialogTypeName.PublicationInfoOpds]
            : undefined);
    React.useMemo(() => {
        if (!openFromState) {
            setOpen(false);
        }
    }, [openFromState]);
    return (
        <Dialog.Root
            defaultOpen={defaultOpen}
            open={open}
            onOpenChange={
                (open) => {
                    if (open) {
                        dispatch(dialogActions.openRequest.build(DialogTypeName.PublicationInfoOpds, {
                            publication: props.opdsPublicationView,
                        }));
                        setOpen(true);
                    } else {
                        dispatch(dialogActions.closeRequest.build());
                        setOpen(false);
                    }
                }}
        >
            <PublicationInfoOpdsContext.Provider value={data}>
                {props.children}
            </PublicationInfoOpdsContext.Provider>
        </Dialog.Root>
    );
};
export const PublicationInfoOpdsWithRadixTrigger = Dialog.Trigger;
PublicationInfoOpdsWithRadixTrigger.displayName = Dialog.Trigger.displayName;
export const PublicationInfoOpdsWithRadixContent = React.forwardRef<HTMLDivElement, IProps>(
    ({ ...props }, forwardRef) => {
        const [__] = useTranslator();
        const dispatch = useDispatch();
        return (
            <Dialog.Portal>
                {/* <Dialog.Overlay className="DialogOverlay" /> */}
                <div className={stylesModals.modal_dialog_overlay}></div>
                <Dialog.Content className={stylesModals.modal_dialog} {...props} ref={forwardRef} aria-describedby={undefined}>
                    <VisuallyHidden.Root>
                        <Dialog.Title>{__("catalog.bookInfo")}</Dialog.Title>
                    </VisuallyHidden.Root>
                    <div className={stylesModals.modal_dialog_header}>
                        {/* <Dialog.Title className="DialogTitle">{__("catalog.bookInfo")}</Dialog.Title> */}
                        <h2>{__("catalog.bookInfo")}</h2>
                        <Dialog.Close asChild>
                            <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                                <SVG ariaHidden={true} svg={QuitIcon} />
                            </button>
                        </Dialog.Close>
                    </div>
                    <div className={stylesModals.modal_dialog_body}>
                        <PublicationInfoOpdsContext.Consumer>
                            {
                                (pub) =>
                                    <PublicationInfoWithRadixContent publicationViewMaybeOpds={pub?.publication} closeDialog={() => dispatch(dialogActions.closeRequest.build())} isOpds={true}
                                     />
                            }
                        </PublicationInfoOpdsContext.Consumer>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        );
    },
);
PublicationInfoOpdsWithRadixContent.displayName = "PublicationInfoOpdsWithRadixContent";

const PublicationInfoWithRadixContent = (props: {publicationViewMaybeOpds: TPublication | undefined, closeDialog: () => void, isOpds?: boolean}) => {

    const locale = useSelector((state: IRendererCommonRootState) => state.i18n.locale);
    const dispatch = useDispatch();
    const link = dispatchOpdsLink(dispatch);
    const location = useLocation();

    if (!props.publicationViewMaybeOpds?.documentTitle) {
        return <Loader></Loader>;
    }

    let controlsComponent = () => (<></>);

    if (props.isOpds) {
        controlsComponent = () => (<OpdsControls opdsPublicationView={props.publicationViewMaybeOpds as IOpdsPublicationView} />);
    } else {
        if (props.publicationViewMaybeOpds?.lcp) {
            controlsComponent = () => (<CatalogLcpControls publicationView={props.publicationViewMaybeOpds as PublicationView} />);
        } else {
            controlsComponent = () => (<CatalogControls publicationView={props.publicationViewMaybeOpds as PublicationView} />);
        }
    }

    return (
        <PublicationInfoContent
            publicationViewMaybeOpds={props.publicationViewMaybeOpds}
            r2Publication={null}
            manifestUrlR2Protocol={null}
            handleLinkUrl={null}
            // toggleCoverZoomCb={() => setCoverZoom(!coverZoom)}
            ControlComponent={controlsComponent}
            TagManagerComponent={TagManager}
            // coverZoom={coverZoom}
            onClickLinkCb={
                (_link) => () => link(_link.link[0], location, convertMultiLangStringToString(_link.nameLangString, locale))
            }
            focusWhereAmI={false}
            pdfPlayerNumberOfPages={undefined}
            divinaNumberOfPages={undefined}
            divinaContinousEqualTrue={undefined}
            readerReadingLocation={undefined}
            closeDialogCb={props.closeDialog}
        >
        </PublicationInfoContent>
    );
};
