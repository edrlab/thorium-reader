// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { FocusScope, mergeProps, Overlay } from "react-aria";
import { Button, Dialog, DialogProps, DialogTrigger, DialogTriggerProps, Focusable, Modal, ModalOverlay, OverlayArrow, OverlayTriggerStateContext, Pressable, Tooltip, TooltipTrigger } from "react-aria-components";
import { useOverlayTriggerState } from "react-stately";
import { TKeyboardShortcut } from "readium-desktop/common/keyboard";
import { PrettifyKeyboardShortcut } from "readium-desktop/renderer/common/components/Keyboard";
import { OVERLAY_Z_INDEX } from "./overlayHelpers";

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

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean } & {
   tooltipkeyboardShortcut?: TKeyboardShortcut;
   tooltipkeyboardShortcutName?: string;
   tooltipkeyboardShortcutDescription?: string; };

function buttonChild({ asChild, children, tooltipkeyboardShortcut: _tooltipkeyboardShortcut, tooltipkeyboardShortcutName: _tooltipkeyboardShortcutName, tooltipkeyboardShortcutDescription: _tooltipkeyboardShortcutDescription, ...props }: ButtonProps) {
    if (asChild) {
        const child = React.Children.only(children) as React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>>;
        return React.cloneElement(child, mergeProps(child.props, props));
    }
    return <button type="button" {...props}>{children}</button>;
}

/** Use RAC's button semantics for native controls, including inside inert background dialogs. */
function DialogButton({ onPress, ...props }: ButtonProps & { onPress?: () => void }) {
    const child = buttonChild(props);
    if (child.type !== "button") {
        return <Pressable onPress={onPress}>{child}</Pressable>;
    }
    const childRef = (child as React.ReactElement & { ref?: React.Ref<HTMLButtonElement> }).ref;
    return <Button ref={childRef} isDisabled={child.props.disabled} onPress={onPress}
        render={(buttonProps) => React.cloneElement(child, mergeProps(child.props, buttonProps))}>
        {child.props.children}
    </Button>;
}

export function Trigger(props: ButtonProps) {
    const { modal, panelId } = React.useContext(Context);
    const state = React.useContext(OverlayTriggerStateContext);
    const propstooltipkeyboardShortcut = props.tooltipkeyboardShortcut;
    const propstooltipkeyboardShortcutName = props.tooltipkeyboardShortcutName;
    const propstooltipkeyboardShortcutDescription = props.tooltipkeyboardShortcutDescription;
    if (!modal) {
        // Docked panels use native button activation for mouse, Enter and Space.
        const c = buttonChild(mergeProps(props, {
            onClick: () => state?.toggle(),
            "aria-expanded": state?.isOpen,
            "aria-controls": state?.isOpen ? panelId : undefined,
        }));
        if (!propstooltipkeyboardShortcut) {
            return c;
        }
        return (
        <TooltipTrigger delay={0} closeDelay={0} trigger="hover">
        <Focusable>
        {c}
        </Focusable>
        <Tooltip placement="bottom" offset={0} className={classNames("tooltipKeyboardShortcut")}>
        <OverlayArrow><svg width={10} height={10} viewBox="0 0 8 8"><path d="M0 0 L4 4 L8 0" /></svg></OverlayArrow>
                    <p><PrettifyKeyboardShortcut hideFromScreenReaders={false}  def={propstooltipkeyboardShortcut} /></p>
        {
            (propstooltipkeyboardShortcutName ? (<p>{propstooltipkeyboardShortcutName}</p>) : (<></>))
        }{
            (propstooltipkeyboardShortcutDescription ? (<p>{propstooltipkeyboardShortcutDescription}</p>) : (<></>))
        }
        </Tooltip>
        </TooltipTrigger>
        );
    }
    const c = <DialogButton {...props} />;
    if (!propstooltipkeyboardShortcut) {
        return c;
    }
    return (
    <TooltipTrigger delay={0} closeDelay={0} trigger="hover">
    {c}
    <Tooltip placement="bottom" offset={0} className={classNames("tooltipKeyboardShortcut")}>
    <OverlayArrow><svg width={10} height={10} viewBox="0 0 8 8"><path d="M0 0 L4 4 L8 0" /></svg></OverlayArrow>
    <p><PrettifyKeyboardShortcut hideFromScreenReaders={false} def={propstooltipkeyboardShortcut} /></p>
    {
        (propstooltipkeyboardShortcutName ? (<p>{propstooltipkeyboardShortcutName}</p>) : (<></>))
    }{
        (propstooltipkeyboardShortcutDescription ? (<p>{propstooltipkeyboardShortcutDescription}</p>) : (<></>))
    }
    </Tooltip>
    </TooltipTrigger>
    );
}
Trigger.displayName = "DialogTrigger";

export function Close(props: ButtonProps) {
    const state = React.useContext(OverlayTriggerStateContext);
    return <DialogButton {...props} onPress={() => state?.close()} />;
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
