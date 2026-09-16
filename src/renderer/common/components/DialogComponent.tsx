// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";
import { Dialog as RACDialog, Modal as RACModal, type ModalOverlayProps } from "react-aria-components";

export interface DialogProps extends Omit<ModalOverlayProps, "children" | "isOpen" | "onOpenChange"> {
    children?: React.ReactNode;
    content?: React.ReactNode;
    contentRef?: React.Ref<HTMLDivElement>;
    contentClassName?: string;
    contentStyle?: React.CSSProperties;
    overlayClassName?: string;
    isOpen: boolean;
    onClose?: () => void;
    onOpenChange?: (isOpen: boolean) => void;
    title?: string;
    trigger?: React.ReactElement;
}

export function DialogRAC({
    children,
    content,
    contentRef,
    contentClassName = stylesModals.modal_dialog,
    contentStyle,
    isOpen,
    onClose,
    onOpenChange,
    overlayClassName,
    title,
    trigger,
    ...props
}: DialogProps) {
    const open = () => onOpenChange?.(true);
    const close = () => {
        onClose?.();
        onOpenChange?.(false);
    };

    return (
        <>
            {trigger && React.cloneElement(trigger, { onClick: open })}
            <RACModal
                {...props}
                isOpen={isOpen}
                isDismissable={props.isDismissable ?? true}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                        close();
                    } else {
                        onOpenChange?.(true);
                    }
                }}
                className={overlayClassName}
            >
                    <RACDialog ref={contentRef} aria-label={title} className={contentClassName} style={contentStyle}>
                    {content ?? children}
                </RACDialog>
            </RACModal>
        </>
    );
}
