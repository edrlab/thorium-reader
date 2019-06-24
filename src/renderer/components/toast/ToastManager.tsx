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

import { RootState } from "readium-desktop/renderer/redux/states";

import Toast from "./Toast";

import * as DownloadIcon from "readium-desktop/renderer/assets/icons/download.svg";

import { TranslatorProps, withTranslator } from "../utils/translator";

import * as styles from "readium-desktop/renderer/assets/styles/toast.css";

import * as uuid from "uuid";

interface Props extends TranslatorProps {
    toast?: ToastState;
}

interface State {
    toastList: any;
}

export class ToastManager extends React.Component<Props, State> {
    constructor(props: any) {
        super(props);

        this.state = {
            toastList: {},
        };

        this.close = this.close.bind(this);
    }

    public componentDidUpdate(oldProps: Props) {
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
                        case ToastType.FinishedDownload:
                            return this.buildFileImportToast(toast, id);
                        default:
                            return (<></>);
                    }
                }
            })}
        </div>;
    }

    private buildFileImportToast(toast: ToastState, id: string) {
        const { __ } = this.props;
        return (
            <Toast
                message={__(toast.data.message, toast.data.messageProps)}
                icon={ DownloadIcon }
                close={ () => this.close(id) }
            />
        );
    }

    private close(id: string) {
        const { toastList } = this.state;
        toastList[id] = undefined;
        this.setState({ toastList });
    }
}

const mapStateToProps = (state: RootState) => {
    return {
        toast: state.toast,
    };
};

export default connect(mapStateToProps)(withTranslator(ToastManager));
