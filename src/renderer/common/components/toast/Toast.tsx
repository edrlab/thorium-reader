// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesToasts from "readium-desktop/renderer/assets/styles/components/toasts.scss";

import { clipboard } from "electron";
import classNames from "classnames";
import * as React from "react";
import { createPortal } from "react-dom";
import {
    Button,
    Text,
    VisuallyHidden,
    UNSTABLE_Toast as AriaToast,
    UNSTABLE_ToastContent as ToastContent,
    QueuedToast,
} from "react-aria-components";
import { ToastType } from "readium-desktop/common/models/toast";
import { ToastState } from "readium-desktop/common/redux/states/toast";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { TranslatorProps, withTranslator } from "../hoc/translator";

interface IProps extends TranslatorProps {
    toast: QueuedToast<ToastState>;
    close: (id: string) => void;
}

export function Toast({ toast, close, __ }: IProps) {
    const [opened, setOpened] = React.useState(false);
    const [willLeave, setWillLeave] = React.useState(false);
    const [copyFeedback, setCopyFeedback] = React.useState({ message: "", sequence: 0, failed: false });
    const [announcedFeedback, setAnnouncedFeedback] = React.useState({ message: "", sequence: 0 });
    const announcementId = React.useId();
    const containerLabelId = React.useId();
    const actionId = React.useId();
    const ref = React.useRef<HTMLDivElement>(undefined);
    const messageActionRef = React.useRef<HTMLButtonElement>(undefined);
    const closing = React.useRef(false);
    const removed = React.useRef(false);
    const { data: message, type } = toast.content;

    React.useEffect(() => {
        setAnnouncedFeedback({ message: "", sequence: copyFeedback.sequence });
        // Successful copies stay quiet. Failures still need accessible feedback.
        if (!copyFeedback.failed) return undefined;
        const timer = window.setTimeout(() => setAnnouncedFeedback(copyFeedback), 100);
        return () => window.clearTimeout(timer);
    }, [copyFeedback]);

    React.useEffect(() => {
        // React Aria starts each timer on mount. Notices added to a region that
        // is already being read must pause too, without another hover/focus event.
        const region = ref.current?.closest("[role=region]");
        if (region?.contains(document.activeElement) || region?.hasAttribute("data-hovered")) {
            toast.timer?.pause();
        }
    }, [toast.timer]);

    const finishClose = React.useCallback(() => {
        if (removed.current) return;
        removed.current = true;
        close(toast.key);
    }, [close, toast.key]);

    React.useEffect(() => {
        if (!willLeave) return undefined;
        // Keep the existing slide-out animation, including when transitions are disabled.
        const timer = window.setTimeout(finishClose, 500);
        return () => window.clearTimeout(timer);
    }, [willLeave, finishClose]);

    const copyAndExpand = () => {
        if (closing.current) return;
        setOpened((value) => !value);
        let feedback: string;
        let failed = false;
        try {
            clipboard.writeText(message, "clipboard");
            feedback = __("accessibility.notificationCopied");
        } catch (_error) {
            failed = true;
            feedback = __("accessibility.notificationCopyFailed");
        }
        setCopyFeedback((value) => ({ message: feedback, sequence: value.sequence + 1, failed }));
    };

    return (
        <>
            <AriaToast
                ref={ref}
                toast={toast}
                aria-labelledby={containerLabelId}
                render={(props) => <div
                    {...props}
                    tabIndex={-1}
                    onClick={(event) => {
                        props.onClick?.(event);
                        if (event.defaultPrevented || (event.target as Element).closest("button")) return;
                        messageActionRef.current?.focus();
                        messageActionRef.current?.click();
                    }}
                    onFocus={(event) => {
                        props.onFocus?.(event);
                        // React Aria targets this wrapper for landmark entry and
                        // focus restoration. The actual action is the native button.
                        if (event.target === event.currentTarget) messageActionRef.current?.focus();
                    }}
                />}
                className={classNames(
                    stylesToasts.toast,
                    willLeave && stylesToasts.leave,
                    type === ToastType.Error && stylesToasts.error,
                    type === ToastType.Success && stylesToasts.success,
                )}
                onTransitionEnd={(event) => {
                    if (willLeave && event.target === event.currentTarget && event.propertyName === "transform") {
                        finishClose();
                    }
                }}
            >
                <VisuallyHidden>
                    <span id={containerLabelId}>{__("accessibility.notification")}</span>
                    <ToastContent>
                        <Text slot="title" id={announcementId}>{message}</Text>
                    </ToastContent>
                </VisuallyHidden>
                <Button
                    ref={messageActionRef}
                    className={classNames(stylesToasts.content, stylesToasts.messageButton)}
                    aria-labelledby={announcementId}
                    aria-describedby={actionId}
                    onPress={copyAndExpand}
                    onBlur={() => setOpened(false)}
                >
                    <span className={stylesToasts.copyStatus}>
                        {copyFeedback.message && <span key={copyFeedback.sequence}>{copyFeedback.message}</span>}
                    </span>
                    <Text
                        aria-hidden="true"
                        className={classNames(stylesToasts.message, opened && stylesToasts.toast_open)}
                    >
                        {message}
                    </Text>
                </Button>
                <VisuallyHidden>
                    <span id={actionId}>{__("accessibility.copyNotificationInstruction")}</span>
                </VisuallyHidden>
                <Button
                    aria-label={__("accessibility.closeNotification")}
                    className={stylesToasts.closeButton}
                    onPress={() => {
                        if (closing.current) return;
                        closing.current = true;
                        setOpened(false);
                        setWillLeave(true);
                    }}
                >
                    <SVG ariaHidden svg={QuitIcon} />
                </Button>
            </AriaToast>
            {createPortal(
                <VisuallyHidden>
                    <div role="status" aria-live="polite" aria-atomic="true">
                        {announcedFeedback.message && <span key={announcedFeedback.sequence}>{announcedFeedback.message}</span>}
                    </div>
                </VisuallyHidden>,
                document.body,
            )}
        </>
    );
}

export default withTranslator(Toast);
