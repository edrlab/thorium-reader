// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { IReaderRootState } from "readium-desktop/renderer/common/redux/states/renderer/readerRootState";
import classNames from "classnames";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";
import * as stylesPopoverDialog from "readium-desktop/renderer/assets/styles/components/popoverDialog.scss";

interface IProps {
    open: boolean;
    toggleMenu: () => void;
}

export interface IPopoverDialogContext {
    dockingMode: "full" | "left" | "right";
    dockedMode: boolean;
    setDockingMode: (m: "full" | "left" | "right") => void;
}

export const PopoverDialogRoot: React.FC<IProps & IPopoverDialogContext & React.PropsWithChildren>  = (props) => {

    const { open, children, dockedMode } = props;
    const Root = dockedMode ? Popover.Root : Dialog.Root;
    return (
        <Root key={dockedMode ? "popover-root" : "dialog-root"}
            open={open}
            // onOpenChange={
            //     (open) => {
            //         console.log("Settings modal state open=", open);
            //         toggleMenu();
            //     }}
            >
                {
                    children
                }
        </Root>
    );
};

export const PopoverDialogAnchor: React.FC<IPopoverDialogContext & React.PropsWithChildren> = (props) => {
    const { children, dockedMode } = props;
    return dockedMode ? <Popover.Anchor asChild>{children}</Popover.Anchor> : children;
};

export const PopoverDialogPortal: React.FC<IPopoverDialogContext & React.PropsWithChildren>  = (props) => {

    const { dockedMode, dockingMode } = props;
    const Portal = dockedMode ? Popover.Portal : Dialog.Portal;
    const Content = dockedMode ? Popover.Content : Dialog.Content;

    const readerConfig = useSelector((state: IReaderRootState) => state.reader.config);
    const nightTheme = readerConfig.night;
    const sepiaTheme = readerConfig.sepia; // mutually exclusive

    const contentPopover = dockedMode ? {
        side: dockingMode === "left" ? "left" : dockingMode === "right" ? "right" : "bottom" as "left" | "right",
        sideOffset: -350,
        align: "end" as const,
        sticky: "always" as const,
    }: {};

    const { children } = props;
    return (
        <Portal key={dockedMode ? "popover-portal" : "dialog-portal"}>
            <Content key={dockedMode ? "popover-content" : "dialog-content"}
                {...contentPopover}
                style={{borderLeft : dockingMode === "right" ? "2px solid var(--color-medium-grey" : "", borderRight : dockingMode === "left" ? "2px solid var(--color-medium-grey" : ""}}
                className={classNames(dockedMode ? stylesPopoverDialog.popover_dialog_reader : stylesPopoverDialog.modal_dialog_reader, nightTheme ? stylesReader.nightMode : sepiaTheme ? stylesReader.sepiaMode : "")} >
                    {children}
            </Content>
        </Portal>
    );
};
