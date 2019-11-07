// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { ToastType } from "readium-desktop/common/models/toast";
import { ToastState } from "readium-desktop/common/redux/states/toast";
import * as DownloadIcon from "readium-desktop/renderer/assets/icons/download.svg";
import * as styles from "readium-desktop/renderer/assets/styles/toast.css";
import { RootState } from "readium-desktop/renderer/redux/states";
import * as uuid from "uuid";

import { TranslatorProps, withTranslator } from "../utils/hoc/translator";
import Toast, { ToastType as CompToastType } from "./Toast";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

interface IState {
    toastList: {
        [id: string]: ToastState;
    };
}

export class ToastManager extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            toastList: {},
        };

        this.close = this.close.bind(this);
    }

    public componentDidUpdate(oldProps: IProps) {
        const { toast } = this.props;
        if (toast !== oldProps.toast) {
            const id = uuid.v4();
            const toastList = this.state.toastList;
            toastList[id] = toast;
            this.setState({toastList});
        }
    }

    public render(): React.ReactElement<{}> {
        const { toastList } = this.state;
        return <div className={styles.toastList}>
            { Object.keys(toastList).map((id: string) => {
                const toast = toastList[id];
                if (toast) {
                    switch (toast.type) {
                        case ToastType.DownloadComplete:
                            return this.buildFileImportToast(toast, id);
                        case ToastType.DownloadStarted:
                            return this.buildFileImportStartToast(toast, id);
                        case ToastType.DownloadFailed:
                            return this.buildFileImportFailToast(toast, id);
                        default:
                            return (<></>);
                    }
                }
                return undefined;
            })}
        </div>;
    }

    private buildFileImportToast(toast: ToastState, id: string) {
        return (
            <Toast
                message={toast.data}
                key={id}
                icon={ DownloadIcon }
                close={ () => this.close(id) }
                displaySystemNotification
            />
        );
    }

    private buildFileImportStartToast(toast: ToastState, id: string) {
        return (
            <Toast
                message={toast.data}
                key={id}
                icon={ DownloadIcon }
                close={ () => this.close(id) }
            />
        );
    }

    private buildFileImportFailToast(toast: ToastState, id: string) {
        return (
            <Toast
                message={toast.data}
                key={id}
                icon={ DownloadIcon }
                close={ () => this.close(id) }
                type={CompToastType.Error}
            />
        );
    }

    private close(id: string) {
        const { toastList } = this.state;
        toastList[id] = undefined;
        this.setState({ toastList });
    }
}

const mapStateToProps = (state: RootState, _props: IBaseProps) => {
    return {
        toast: state.toast,
    };
};

export default connect(mapStateToProps)(withTranslator(ToastManager));
