// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as Dialog from "@radix-ui/react-dialog";
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

import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.css";
import { TPublication } from "readium-desktop/common/type/publication.type";
import Loader from "readium-desktop/renderer/common/components/Loader";
import Cover from "readium-desktop/renderer/common/components/Cover";
import { useLocation } from "react-router";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";

const PublicationInfoLibContext = React.createContext<DialogType[DialogTypeName.PublicationInfoLib] | undefined>(undefined);

export const PublicationInfoLibWithRadix: React.FC<React.PropsWithChildren<{publicationView: Pick<PublicationView, "identifier">}>> = (props) => {
    const defaultOpen = false;

    const dispatch = useDispatch();
    const [open, setOpen] = React.useState(defaultOpen);
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
export const PublicationInfoLibWithRadixContent = React.forwardRef<HTMLDivElement>(
    ({ ...props }, forwardRef) => {
        const appOverlayElement = React.useMemo(() => document.getElementById("app-overlay"), []);
        const [__] = useTranslator();
        const dispatch = useDispatch();
        return (
            <Dialog.Portal container={appOverlayElement}>
                {/* <Dialog.Overlay className="DialogOverlay" /> */}
                <div className={stylesModals.modal_dialog_overlay}></div>
                <Dialog.Content className={stylesModals.modal_dialog} {...props} ref={forwardRef}>
                    <div className={stylesModals.modal_dialog_header}>
                        {/* <Dialog.Title className="DialogTitle">{__("catalog.bookInfo")}</Dialog.Title> */}
                        <h2>{__("catalog.bookInfo")}</h2>
                        <Dialog.Close asChild>
                            <button className={stylesButtons.button_transparency_icon} aria-label="Close">
                                <SVG ariaHidden={true} svg={QuitIcon} />
                            </button>
                        </Dialog.Close>
                    </div>
                    <div className={stylesModals.modal_dialog_body}>
                        <PublicationInfoLibContext.Consumer>
                            {
                                (data) =>
                                    <PublicationInfoWithRadixContent publicationViewMaybeOpds={data?.publication} closeDialog={() => dispatch(dialogActions.closeRequest.build())} />
                            }
                        </PublicationInfoLibContext.Consumer>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        );
    },
);
PublicationInfoLibWithRadixContent.displayName = "PublicationInfoLibWithRadixContent";

// export const PublicationInfoLibWithRadix = (props: { publicationView: Pick<PublicationView, "identifier">, trigger: React.ReactNode }) => {
//     const [__] = useTranslator();

//     const appOverlayElement = React.useMemo(() => document.getElementById("app-overlay"), []);
//     return (
//         <Dialog.Root defaultOpen={defaultOpen} open={open} onOpenChange={
//             (open) => {
//                 if (open) {
//                     dispatch(dialogActions.openRequest.build(DialogTypeName.PublicationInfoLib, {
//                         publicationIdentifier: props.publicationView.identifier,
//                     }));
//                 } else {
//                     dispatch(dialogActions.closeRequest.build());
//                 }
//             }
//         }>
//             <Dialog.Trigger asChild>
//                 {props.trigger}
//             </Dialog.Trigger>

//         </Dialog.Root>
//     );
// };

export const PublicationInfoOpdsWithRadix = (props: { opdsPublicationView: IOpdsPublicationView, trigger: React.ReactNode }) => {
    const [__] = useTranslator();
    const defaultOpen = false;

    const dispatch = useDispatch();

    const open = useSelector((state: ILibraryRootState) => state.dialog.open);

    const appOverlayElement = React.useMemo(() => document.getElementById("app-overlay"), []);
    return (
        <Dialog.Root defaultOpen={defaultOpen} open={open} onOpenChange={
            (open) => {
                if (open) {
                    dispatch(dialogActions.openRequest.build(DialogTypeName.PublicationInfoOpds, {
                        publication: props.opdsPublicationView,
                    }));
                } else {
                    dispatch(dialogActions.closeRequest.build());
                }
            }
        }>
            <Dialog.Trigger asChild>
                {props.trigger}
            </Dialog.Trigger>
            <Dialog.Portal container={appOverlayElement}>
                {/* <Dialog.Overlay className="DialogOverlay" /> */}
                <div className={stylesModals.modal_dialog_overlay}></div>
                <Dialog.Content className={stylesModals.modal_dialog}>
                    <div className={stylesModals.modal_dialog_header}>
                        {/* <Dialog.Title className="DialogTitle">{__("catalog.bookInfo")}</Dialog.Title> */}
                        <h2>{__("catalog.bookInfo")}</h2>
                        <Dialog.Close asChild>
                            <button className={stylesButtons.button_transparency_icon} aria-label="Close">
                                <SVG ariaHidden={true} svg={QuitIcon} />
                            </button>
                        </Dialog.Close>
                    </div>
                    <div className={stylesModals.modal_dialog_body}>
                        <PublicationInfoWithRadixContent publicationViewMaybeOpds={props.opdsPublicationView} closeDialog={() => dispatch(dialogActions.closeRequest.build())} />
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

const PublicationInfoWithRadixContent = (props: {publicationViewMaybeOpds: TPublication | undefined, closeDialog: () => void, isOpds?: boolean}) => {
    const [, translator] = useTranslator(); // FIXME
    const dispatch = useDispatch();
    const link = dispatchOpdsLink(dispatch);
    const location = useLocation();
    const [coverZoom, setCoverZoom] = React.useState(false);

    if (!props.publicationViewMaybeOpds?.documentTitle) {
        return <Loader></Loader>;
    }

    if (coverZoom) {
        return <Cover
            publicationViewMaybeOpds={props.publicationViewMaybeOpds}
            coverType="cover"
            onClick={
                () => setCoverZoom(true)
            }
            onKeyPress={
                (e: React.KeyboardEvent<HTMLImageElement>) =>
                    e.key === "Enter" && setCoverZoom(true)
            }
        />;
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
            toggleCoverZoomCb={() => setCoverZoom(!coverZoom)}
            ControlComponent={controlsComponent}
            TagManagerComponent={TagManager}
            coverZoom={coverZoom}
            translator={translator}
            onClikLinkCb={
                (_link) => () => link(
                        _link.link[0], location, _link.name)
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
