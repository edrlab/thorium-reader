// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesToasts from "readium-desktop/renderer/assets/styles/components/toasts.scss";

import * as React from "react";
import { connect } from "react-redux";
import { I18nProvider, UNSTABLE_ToastQueue as ToastQueue, UNSTABLE_ToastRegion as ToastRegion } from "react-aria-components";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { ToastState } from "readium-desktop/common/redux/states/toast";

import Toast from "./Toast";
import { shouldAddToast } from "./toastQueue";
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

class ResumableToastQueue extends ToastQueue<ToastState> {
    public resumeAll() {
        // React Aria's timers do not cancel an existing timeout on resume.
        // Pausing first preserves the remaining time and makes repeated resumes safe.
        super.pauseAll();
        super.resumeAll();
    }
}

export class ToastManager extends React.Component<IProps> {
    // Each window owns its queue so notices stay independent.
    private queue = new ResumableToastQueue({ maxVisibleToasts: Infinity });

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
            if (shouldAddToast(this.queue.visibleToasts, toast, this.props.pubId)) {
                this.queue.add(toast, { timeout: 5000 });
            } else if (toast.open && toast.data?.trim()
                && !(toast.publicationIdentifier && this.props.pubId && toast.publicationIdentifier !== this.props.pubId)) {
                const duplicate = this.queue.visibleToasts.find(({ content }) =>
                    content.type === toast.type && content.data === toast.data
                    && content.publicationIdentifier === toast.publicationIdentifier);
                if (duplicate && duplicate.content.copyText !== toast.copyText) {
                    // The queue has no update API. Keep its key, focus, and timer, replacing only content.
                    // Do not mutate the Redux state object stored as the original content.
                    duplicate.content = { ...duplicate.content, copyText: toast.copyText };
                    this.forceUpdate();
                }
            }
        }
    }

    public componentWillUnmount() {
        this.queue.pauseAll();
        this.queue.clear();
    }

    public render(): React.ReactElement<{}> {
        return (
            <I18nProvider locale={this.props.locale}>
                <ToastRegion
                    queue={this.queue}
                    className={stylesToasts.toasts_wrapper}
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
