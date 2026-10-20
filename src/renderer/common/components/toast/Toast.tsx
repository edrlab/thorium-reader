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
import * as ChevronDownIcon from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { TranslatorProps, withTranslator } from "../hoc/translator";

interface IProps extends TranslatorProps {
    toast: QueuedToast<ToastState>;
    close: (id: string) => void;
}

export function Toast({ toast, close, __ }: IProps) {
    const [opened, setOpened] = React.useState(false);
    const [willLeave, setWillLeave] = React.useState(false);
    const [copyFeedback, setCopyFeedback] = React.useState({ message: "", sequence: 0 });
    const messageId = React.useId();
    const actionId = React.useId();
    const ref = React.useRef<HTMLDivElement>(undefined);
    const closing = React.useRef(false);
    const removed = React.useRef(false);
    const { data: message, type } = toast.content;

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
        try {
            clipboard.writeText(message, "clipboard");
            feedback = __("accessibility.notificationCopied");
        } catch (_error) {
            feedback = __("accessibility.notificationCopyFailed");
        }
        setCopyFeedback((value) => ({ message: feedback, sequence: value.sequence + 1 }));
    };

    return (
        <AriaToast
            ref={ref}
            toast={toast}
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
            <div className={stylesToasts.content}>
                <div role="status" aria-live="polite" aria-atomic="true" className={stylesToasts.copyStatus}>
                    {copyFeedback.message && <span key={copyFeedback.sequence}>{copyFeedback.message}</span>}
                </div>
                <ToastContent>
                    <Button
                        className={stylesToasts.messageButton}
                        aria-labelledby={`${messageId} ${actionId}`}
                        aria-expanded={opened}
                        aria-controls={messageId}
                        onPress={copyAndExpand}
                        onBlur={() => setOpened(false)}
                    >
                        <Text
                            slot="title"
                            id={messageId}
                            className={classNames(stylesToasts.message, opened && stylesToasts.toast_open)}
                        >
                            {message}
                        </Text>
                    </Button>
                </ToastContent>
            </div>
            <VisuallyHidden>
                <span id={actionId}>{__("accessibility.copyNotificationAndToggleDetails")}</span>
            </VisuallyHidden>
            <Button
                aria-label={__("accessibility.closeDialog")}
                className={stylesToasts.closeButton}
                onPress={() => {
                    if (closing.current) return;
                    closing.current = true;
                    setOpened(false);
                    setWillLeave(true);
                }}
            >
                <SVG ariaHidden svg={opened ? ChevronDownIcon : QuitIcon} />
            </Button>
        </AriaToast>
    );
}

export default withTranslator(Toast);
