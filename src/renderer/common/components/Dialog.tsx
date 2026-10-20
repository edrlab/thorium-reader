// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import {
    Button, Dialog, DialogProps, DialogTrigger, DialogTriggerProps, Modal, ModalOverlay,
    OverlayTriggerStateContext, Pressable,
} from "react-aria-components";
import { FocusScope, mergeProps, Overlay } from "react-aria";
import { OVERLAY_Z_INDEX } from "./overlayHelpers";
import { useOverlayTriggerState } from "react-stately";

export interface RootProps extends DialogTriggerProps {
    modal?: boolean;
    alert?: boolean;
    triggerless?: boolean;
}

interface DialogContextValue {
    modal: boolean;
    alert: boolean;
    titleId: string;
    descriptionId: string;
    panelId?: string;
    overlayProps?: Omit<DialogTriggerProps, "children">;
}
const Context = React.createContext<DialogContextValue>({ modal: true, alert: false, titleId: "", descriptionId: "" });

/** Shared dialog composition for library and reader renderers, backed by RAC. */
export function Root({ modal = true, alert = false, triggerless = false, ...props }: RootProps) {
    const titleId = React.useId();
    const descriptionId = React.useId();
    const panelId = React.useId();
    const dockedState = useOverlayTriggerState(props);
    const { children, ...overlayProps } = props;
    return <Context.Provider value={{ modal, alert, titleId, descriptionId, panelId, overlayProps: triggerless ? overlayProps : undefined }}>
        {!modal ? <OverlayTriggerStateContext.Provider value={dockedState}>{children}</OverlayTriggerStateContext.Provider>
            : triggerless ? children : <DialogTrigger {...props} />}
    </Context.Provider>;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean };

function buttonChild({ asChild, children, ...props }: ButtonProps) {
    if (asChild) {
        const child = React.Children.only(children) as React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>>;
        return React.cloneElement(child, mergeProps(child.props, props));
    }
    return <button type="button" {...props}>{children}</button>;
}

export function Trigger(props: ButtonProps) {
    const { modal, panelId } = React.useContext(Context);
    const state = React.useContext(OverlayTriggerStateContext);
    if (!modal) {
        // Docked panels use native button activation for mouse, Enter and Space.
        return buttonChild(mergeProps(props, {
            onClick: () => state?.toggle(),
            "aria-expanded": state?.isOpen,
            "aria-controls": state?.isOpen ? panelId : undefined,
        }));
    }
    return <Pressable>{buttonChild(props)}</Pressable>;
}
Trigger.displayName = "DialogTrigger";

export function Close(props: ButtonProps) {
    const state = React.useContext(OverlayTriggerStateContext);
    return <Pressable onPress={() => state?.close()}>{buttonChild(props)}</Pressable>;
}

interface PortalProps extends React.PropsWithChildren {
    className?: string;
}

export function Portal({ children, className }: PortalProps) {
    const { modal, alert, overlayProps } = React.useContext(Context);
    const state = React.useContext(OverlayTriggerStateContext);
    // Restore focus on close, while allowing focus to move freely outside docked panels.
    if (!modal) {
        return state?.isOpen ? <Overlay disableFocusManagement><FocusScope restoreFocus>{children}</FocusScope></Overlay> : undefined;
    }
    return <ModalOverlay
        {...overlayProps}
        isDismissable={!alert}
        className={className ?? "thorium-dialog-overlay"}
        style={{ position: "fixed", inset: 0, zIndex: OVERLAY_Z_INDEX }}
    >
        <Modal style={{ display: "contents" }}>{children}</Modal>
    </ModalOverlay>;
}

export const Content = React.forwardRef<HTMLElement, DialogProps>((props, ref) => {
    const { alert, titleId, descriptionId } = React.useContext(Context);
    return <Dialog {...props} ref={ref} role={alert ? "alertdialog" : "dialog"}
        aria-labelledby={props["aria-labelledby"] ?? titleId}
        aria-describedby={props["aria-describedby"] ?? (alert ? descriptionId : undefined)} />;
});
Content.displayName = "DialogContent";

/** Docked content is a named region, without dialog semantics or modal focus management. */
export const DockedContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
    const { panelId, titleId } = React.useContext(Context);
    return <div {...props} ref={ref} id={panelId} role="region" aria-labelledby={props["aria-labelledby"] ?? titleId} />;
});
DockedContent.displayName = "DialogDockedContent";

type TextProps = React.HTMLAttributes<HTMLElement> & { asChild?: boolean };

export function Title({ asChild, children, ...props }: TextProps) {
    const { titleId } = React.useContext(Context);
    return asChild
        ? React.cloneElement(React.Children.only(children) as React.ReactElement, { ...props, id: titleId })
        : <h2 {...props} id={titleId}>{children}</h2>;
}

export function Description({ asChild, children, ...props }: TextProps) {
    const { descriptionId } = React.useContext(Context);
    return asChild
        ? React.cloneElement(React.Children.only(children) as React.ReactElement, { ...props, id: descriptionId })
        : <p {...props} id={descriptionId}>{children}</p>;
}

/** Put initial focus on the safe action in confirmation dialogs. */
export function Cancel(props: ButtonProps) {
    const state = React.useContext(OverlayTriggerStateContext);
    const child = buttonChild(props);
    return <Button autoFocus onPress={() => state?.close()}
        render={(buttonProps) => React.cloneElement(child, mergeProps(child.props, buttonProps))}>
        {child.props.children}
    </Button>;
}

export const Action = Close;
