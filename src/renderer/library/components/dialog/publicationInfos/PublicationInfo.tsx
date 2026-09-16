// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==


import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";

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
import { DialogRAC } from "readium-desktop/renderer/common/components/DialogComponent";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps {
}

const PublicationInfoLibContext = React.createContext<{data: DialogType[DialogTypeName.PublicationInfoLib] | undefined, open: boolean, openDialog: () => void, closeDialog: () => void}>({ data: undefined, open: false, openDialog: () => undefined, closeDialog: () => undefined });
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
        <PublicationInfoLibContext.Provider value={{
            data,
            open,
            openDialog: () => {
                dispatch(dialogActions.openRequest.build(DialogTypeName.PublicationInfoLib, { publicationIdentifier: props.publicationView.identifier }));
                setOpen(true);
            },
            closeDialog: () => {
                dispatch(dialogActions.closeRequest.build());
                setOpen(false);
            },
        }}>
                {props.children}
        </PublicationInfoLibContext.Provider>
    );
};

export const PublicationInfoLibWithRadixTrigger: React.FC<React.PropsWithChildren<{asChild?: boolean}>> = ({ children }) => {
    const context = React.useContext(PublicationInfoLibContext);
    const trigger = React.Children.only(children) as React.ReactElement<{onClick?: React.MouseEventHandler}>;
    return React.cloneElement(trigger, { onClick: (event) => { trigger.props.onClick?.(event); context.openDialog(); } });
};
PublicationInfoLibWithRadixTrigger.displayName = "PublicationInfoLibWithRadixTrigger";
export const PublicationInfoLibWithRadixContent = React.forwardRef<HTMLDivElement, IProps>(
    (_props, forwardRef) => {
        const [__] = useTranslator();
        const dispatch = useDispatch();
        const { data, open, closeDialog } = React.useContext(PublicationInfoLibContext);
        return (
            <DialogRAC
                isOpen={open}
                title={__("catalog.bookInfo")}
                overlayClassName={stylesModals.modal_dialog_overlay}
                contentRef={forwardRef}
                onOpenChange={(isOpen) => { if (!isOpen) { closeDialog(); } }}
                content={
                    <>
                        <div className={stylesModals.modal_dialog_header}>
                            <h1>{__("catalog.bookInfo")}</h1>
                            <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")} onClick={closeDialog}>
                                <SVG ariaHidden={true} svg={QuitIcon} />
                            </button>
                        </div>
                        <div className={stylesModals.modal_dialog_body}>
                            <PublicationInfoWithRadixContent publicationViewMaybeOpds={data?.publication} closeDialog={() => dispatch(dialogActions.closeRequest.build())} />
                        </div>
                    </>
                }
            />
        );
    },
);
PublicationInfoLibWithRadixContent.displayName = "PublicationInfoLibWithRadixContent";

const PublicationInfoOpdsContext = React.createContext<{data: DialogType[DialogTypeName.PublicationInfoOpds] | undefined, open: boolean, openDialog: () => void, closeDialog: () => void}>({ data: undefined, open: false, openDialog: () => undefined, closeDialog: () => undefined });
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
        <PublicationInfoOpdsContext.Provider value={{
            data,
            open,
            openDialog: () => {
                dispatch(dialogActions.openRequest.build(DialogTypeName.PublicationInfoOpds, { publication: props.opdsPublicationView }));
                setOpen(true);
            },
            closeDialog: () => {
                dispatch(dialogActions.closeRequest.build());
                setOpen(false);
            },
        }}>
                {props.children}
        </PublicationInfoOpdsContext.Provider>
    );
};
export const PublicationInfoOpdsWithRadixTrigger: React.FC<React.PropsWithChildren<{asChild?: boolean}>> = ({ children }) => {
    const context = React.useContext(PublicationInfoOpdsContext);
    const trigger = React.Children.only(children) as React.ReactElement<{onClick?: React.MouseEventHandler}>;
    return React.cloneElement(trigger, { onClick: (event) => { trigger.props.onClick?.(event); context.openDialog(); } });
};
PublicationInfoOpdsWithRadixTrigger.displayName = "PublicationInfoOpdsWithRadixTrigger";
export const PublicationInfoOpdsWithRadixContent = React.forwardRef<HTMLDivElement, IProps>(
    (_props, forwardRef) => {
        const [__] = useTranslator();
        const dispatch = useDispatch();
        const { data, open, closeDialog } = React.useContext(PublicationInfoOpdsContext);
        return (
            <DialogRAC
                isOpen={open}
                title={__("catalog.bookInfo")}
                overlayClassName={stylesModals.modal_dialog_overlay}
                contentRef={forwardRef}
                onOpenChange={(isOpen) => { if (!isOpen) { closeDialog(); } }}
                content={
                    <>
                        <div className={stylesModals.modal_dialog_header}>
                            <h2>{__("catalog.bookInfo")}</h2>
                            <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")} onClick={closeDialog}>
                                <SVG ariaHidden={true} svg={QuitIcon} />
                            </button>
                        </div>
                        <div className={stylesModals.modal_dialog_body}>
                            <PublicationInfoWithRadixContent publicationViewMaybeOpds={data?.publication} closeDialog={() => dispatch(dialogActions.closeRequest.build())} isOpds={true} />
                        </div>
                    </>
                }
            />
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
                (_link) => () => {
                    const textObj = _link.nameLangString;
                    const pubLangs = props.publicationViewMaybeOpds.languages;
                    const pubLang = pubLangs ? pubLangs[0] : undefined; // TODO: OPF xml:lang on title meta is actually the lang, not the declared pub lang(s)!
                    const textObj_ = pubLang && typeof textObj === "string" ? { [pubLang]: textObj } : textObj;
                    return link(_link.link[0], location, convertMultiLangStringToString(textObj_, locale));
                }
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
