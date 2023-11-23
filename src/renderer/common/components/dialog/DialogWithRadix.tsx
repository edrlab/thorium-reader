// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as Dialog from "@radix-ui/react-dialog";
import * as React from "react";
// import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
// import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
// import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
// import { PublicationView } from "readium-desktop/common/views/publication";
// import {
//     PublicationInfoContent,
// } from "readium-desktop/renderer/common/components/dialog/publicationInfos/publicationInfoContent";
// import { dispatchOpdsLink } from "readium-desktop/renderer/library/opds/handleLink";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";

// import CatalogControls from "readium-desktop/renderer/library/components/dialog/publicationInfos/catalogControls";
// import CatalogLcpControls from "readium-desktop/renderer/library/components/dialog/publicationInfos/catalogLcpControls";
// import OpdsControls from "readium-desktop/renderer/library/components/dialog/publicationInfos/opdsControls/OpdsControls";
// import TagManager from "readium-desktop/renderer/library/components/dialog/publicationInfos//TagManager";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";

import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
// import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.css";
// import { TPublication } from "readium-desktop/common/type/publication.type";
// import Loader from "readium-desktop/renderer/common/components/Loader";
// import { useLocation } from "react-router";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import * as chevronDownIcon from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import classNames from "classnames";

export const DialogWithRadix: React.FC<React.PropsWithChildren<{}>> = (props) => {
    const [open, setOpen] = React.useState(false);

    const openFromState = useSelector((state: ILibraryRootState) => state.dialog.open);
    React.useMemo(() => {
        if (!openFromState) {
            setOpen(false);
        }
    }, [openFromState]);

    return (
        <Dialog.Root
        open={open}
        onOpenChange={
            (open) => {
                if (open) {
                    setOpen(true);
                } else {
                    setOpen(false);
                }
            }}
        >
            {props.children}
        </Dialog.Root>
    );
};

export const DialogWithRadixTrigger = Dialog.Trigger;
DialogWithRadixTrigger.displayName = Dialog.Trigger.displayName;

const DialogContext = React.createContext(null);

export const DialogWithRadixContent: React.FC<React.PropsWithChildren<{}>> = (props) => {
    const appOverlayElement = React.useMemo(() => document.getElementById("app-overlay"), []);
    const [__] = useTranslator();
    const [collapse, setCollapse] = React.useState(false);

    const toggleCollapse = () => {
        setCollapse(!collapse);
    };

    return (
        <Dialog.Portal container={appOverlayElement}>
            <div className={stylesModals.modal_dialog_overlay}></div>
            <Dialog.Content className={classNames(stylesModals.modal_dialog, collapse ? stylesModals["modal_dialog-collapsed"] : undefined)}
                id="modalContainer">
                <DialogContext.Provider value={{ collapse: { toggleCollapse, collapse } }}>
                    {props.children}
                </DialogContext.Provider>
            </Dialog.Content>
        </Dialog.Portal>
    );
};
DialogWithRadixContent.displayName = "DialogWithRadixContent";

export const DialogTitle = Dialog.Title;
DialogTitle.displayName = "DialogTitle";


export const DialogHeader: React.FC<React.PropsWithChildren<{}>> = (props) => {
    return (
        <div className={stylesModals.modal_dialog_header}>
            {props.children}

        </div>
    );
};

export const DialogCollapseButton = () => {
    const {toggleCollapse} = React.useContext(DialogContext);
    return (
        <button style={{width: "20px", height: "20px"}} id="chevronButton" onClick={() => toggleCollapse()}>
            <SVG ariaHidden={true} svg={chevronDownIcon} />
        </button>
    );
};

export const DialogCloseButton = () => {
    return (
        <Dialog.Close asChild>
            <button className={stylesButtons.button_transparency_icon} aria-label="Close">
                <SVG ariaHidden={true} svg={QuitIcon} />
            </button>
        </Dialog.Close>
    );
};

export const DialogContent: React.FC<React.PropsWithChildren<{}>> = (props) => {
    const {collapse} = React.useContext(DialogContext);

    return (
        <div className={classNames(stylesModals.modal_dialog_body, collapse ? stylesModals["modal_dialog_body-collapsed"]: undefined)}>
        {props.children}
        </div>
    );
};

export const DialogFooter: React.FC<React.PropsWithChildren<{}>> = (props) => {
    const [__] = useTranslator();
    return (
            <div className={stylesModals.modal_dialog_footer}>
                    {props.children}
            </div>
    );
};


export const DialogClose = Dialog.Close;
