// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesToasts from "readium-desktop/renderer/assets/styles/components/toasts.scss";

import * as React from "react";
import { connect } from "react-redux";
import { ToastType } from "readium-desktop/common/models/toast";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import { ToastState } from "readium-desktop/common/redux/states/toast";
import { v4 as uuidv4 } from "uuid";

import { TranslatorProps, withTranslator } from "../hoc/translator";
import Toast from "./Toast";

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
            const id = uuidv4();
            const toastList = this.state.toastList;
            toastList[id] = toast;
            this.setState({toastList});
        }
    }

    public render(): React.ReactElement<{}> {
        const { toastList } = this.state;
        return <div className={stylesToasts.toasts_wrapper}>
            { Object.keys(toastList).map((id: string) => {
                const toast = toastList[id];
                if (toast) {
                    switch (toast.type) {
                        case ToastType.Success:
                            return <Toast
                                message={toast.data}
                                key={id}
                                close={ () => this.close(id) }
                                type={toast.type}
                                displaySystemNotification={false}
                            />;
                        case ToastType.Default:
                            return <Toast
                                message={toast.data}
                                key={id}
                                close={ () => this.close(id) }
                                type={toast.type}
                                displaySystemNotification={false}
                            />;
                        case ToastType.Error:
                            return <Toast
                                message={toast.data}
                                key={id}
                                close={ () => this.close(id) }
                                type={toast.type}
                                displaySystemNotification={false}
                            />;
                        default:
                            return (<></>);
                    }
                }
                return undefined;
            })}
        </div>;
    }

    private close(id: string) {
        const { toastList } = this.state;
        toastList[id] = undefined;
        this.setState({ toastList });
    }
}

const mapStateToProps = (state: IRendererCommonRootState, _props: IBaseProps) => {
    return {
        toast: state.toast,
    };
};

export default connect(mapStateToProps)(withTranslator(ToastManager));
