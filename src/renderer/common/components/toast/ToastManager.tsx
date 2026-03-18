// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesToasts from "readium-desktop/renderer/assets/styles/components/toasts.scss";

import * as React from "react";
import { connect } from "react-redux";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { ToastState } from "readium-desktop/common/redux/states/toast";
import { v4 as uuidv4 } from "uuid";

import Toast from "./Toast";
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
            this.setState((prevState) => ({
                toastList: {
                    ...prevState.toastList,
                    [id]: toast,
                },
            }));
        }
    }

    public render(): React.ReactElement<{}> {
        const { toastList } = this.state;
        const { pubId } = this.props;

        return (
            <div className={stylesToasts.toasts_wrapper}>
                {Object.keys(toastList).map((id) => {
                    const toast = toastList[id];
                    if (toast && (!toast.publicationIdentifier || toast.publicationIdentifier === pubId)) {
                        return (
                            <Toast
                                key={id}
                                id={id}
                                message={toast.data}
                                type={toast.type}
                                close={this.close}
                                displaySystemNotification={false}
                            />
                        );
                    }
                    return null;
                })}
            </div>
        );
    }

    private close(id: string) {
        this.setState((prevState) => {
            const { [id]: _, ...rest } = prevState.toastList;
            return { toastList: rest };
        });
    }
}

const mapStateToProps = (state: IRendererCommonRootState & IReaderRootState, _props: IBaseProps) => {
    return {
        toast: state.toast,
        locale: state.i18n.locale, // refresh
        pubId: state?.reader?.info?.publicationIdentifier,
    };
};

export default connect(mapStateToProps)(withTranslator(ToastManager));
