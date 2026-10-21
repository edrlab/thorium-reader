// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesToasts from "readium-desktop/renderer/assets/styles/components/toasts.scss";

import * as React from "react";
import { ipcRenderer } from "electron";
import { connect } from "react-redux";
import { I18nProvider, UNSTABLE_ToastQueue as ToastQueue, UNSTABLE_ToastRegion as ToastRegion } from "react-aria-components";
import { ToastType } from "readium-desktop/common/models/toast";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { ToastState } from "readium-desktop/common/redux/states/toast";
import { uuidv4 } from "readium-desktop/utils/uuid";

import Toast from "./Toast";
import { addToastToQueue } from "./toastQueue";
import { TranslatorProps, withTranslator } from "../hoc/translator";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

class AccessibleToastQueue extends ToastQueue<ToastState> {
    public accessibilitySupportEnabled = false;

    public resumeAll() {
        if (!this.accessibilitySupportEnabled) super.resumeAll();
    }
}

export class ToastManager extends React.Component<IProps> {
    private regionRef = React.createRef<HTMLDivElement>();
    // Each window owns its queue. Persistent errors must not hide later notices.
    private queue = new AccessibleToastQueue({ maxVisibleToasts: Infinity });

    public componentDidMount() {
        ipcRenderer.on("accessibility-support-changed", this.accessibilitySupportChanged);
        ipcRenderer.send("accessibility-support-query");
    }

    private accessibilitySupportChanged = (_event: Electron.IpcRendererEvent, enabled: boolean) => {
        this.queue.accessibilitySupportEnabled = enabled;
        if (enabled) {
            this.queue.pauseAll();
        } else {
            const region = this.regionRef.current;
            if (!region?.contains(document.activeElement) && !region?.hasAttribute("data-hovered")) this.queue.resumeAll();
        }
    };

    public componentDidUpdate(oldProps: IProps) {
        const { toast } = this.props;
        if (this.props.pubId !== oldProps.pubId && this.props.pubId) {
            for (const current of this.queue.visibleToasts) {
                if (current.content.publicationIdentifier && current.content.publicationIdentifier !== this.props.pubId) {
                    this.queue.close(current.key);
                }
            }
        }
        if (toast !== oldProps.toast) {
            const id = uuidv4();
            const toastList = Object.fromEntries(this.queue.visibleToasts.map((current) => [current.key, current.content]));
            if (addToastToQueue(toastList, id, toast, this.props.pubId) !== toastList) {
                // Every notice is persistent by default, regardless of its color.
                // Only messages available elsewhere may opt in; errors never expire.
                const timeout = toast.type === ToastType.Error || this.queue.accessibilitySupportEnabled ? undefined : toast.timeout;
                this.queue.add(toast, { timeout });
            }
        }
    }

    public componentWillUnmount() {
        ipcRenderer.off("accessibility-support-changed", this.accessibilitySupportChanged);
        this.queue.pauseAll();
        this.queue.clear();
    }

    public render(): React.ReactElement<{}> {
        return (
            <I18nProvider locale={this.props.locale}>
                <ToastRegion
                    ref={this.regionRef}
                    queue={this.queue}
                    className={stylesToasts.toasts_wrapper}
                    render={(props) => <div
                        {...props}
                        onFocus={(event) => {
                            props.onFocus?.(event);
                            if (event.target === event.currentTarget) {
                                event.currentTarget.querySelector<HTMLElement>("[role=alertdialog]")?.focus();
                            }
                        }}
                    />}
                >
                    {({ toast }) => <Toast toast={toast} close={this.close} />}
                </ToastRegion>
            </I18nProvider>
        );
    }

    private close = (id: string) => this.queue.close(id);
}

const mapStateToProps = (state: IRendererCommonRootState & IReaderRootState, _props: IBaseProps) => {
    return {
        toast: state.toast,
        locale: state.i18n.locale, // refresh
        pubId: state?.reader?.info?.publicationIdentifier,
    };
};

export default connect(mapStateToProps)(withTranslator(ToastManager));
