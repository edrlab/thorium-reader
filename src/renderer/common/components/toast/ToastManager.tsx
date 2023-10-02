// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import { ToastState } from "readium-desktop/common/redux/states/toast";
import * as stylesToasts from "readium-desktop/renderer/assets/styles/components/toasts.css";

import { TranslatorProps, withTranslator } from "../hoc/translator";
import * as Toasts from "@radix-ui/react-toast";
import classNames from "classnames";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";

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
    open: boolean;
}

export class ToastManager extends React.Component<IProps, IState> {
    private timerRef: any;

    constructor(props: IProps) {
        super(props);
        this.timerRef = 0;

        this.state = {
            toastList: {},
            open: false
        };

        this.close = this.close.bind(this);
    }

    public componentDidMount(): void {
        this.timerRef = setTimeout(() => this.setState({open: false}), 5000)
    }

    public componentWillUnmount() {
        clearTimeout(this.timerRef)
    }

    public componentDidUpdate(prevProps: Readonly<IProps>): void {
    if (prevProps.toast !== this.props.toast && this.props.toast) {
        this.setState({open: true})
    }
    }

    // public componentDidUpdate(oldProps: IProps) {
    //     const { toast } = this.props;
    //     if (toast !== oldProps.toast) {
    //         const id = uuidv4();
    //         const toastList = this.state.toastList;
    //         toastList[id] = toast;
    //         this.setState({toastList});
    //     }
    // }

    public render(): React.ReactElement<{}> {
        // const { toastList } = this.state;

        // let toastComponent = [];
        // for (const [id, toastInfo] of Object.entries(toastList)) {
        //     toastComponent.push(                                
        //     <Toast2
        //         message={toastInfo.data}
        //         key={id}
        //         close={() => this.close(id)}
        //         type={toastInfo.type}
        //         displaySystemNotification={false}
        //         open={false}
        //         />)
        // }

        if (!this.props.toast) {
            return <></>;
        }
        return (
            <Toasts.Provider>
                <Toasts.Root className={classNames(
                    stylesToasts.toast  
                    )}
                    open={this.state.open}
                    onOpenChange={(open) => this.setState({open})}
                    duration={10000}
                    >
                    <Toasts.Title>Something went wrong</Toasts.Title>
                    <Toasts.Description>
                    <p
                        aria-live="assertive"
                        aria-relevant="all"
                        role="alert"
                        tabIndex={0}
                        >The importation of the book has failed
                    </p>
                    <button>More info</button>
                    </Toasts.Description>
                    <Toasts.Close className={stylesToasts.closeButton} aria-label="close">
                        <SVG ariaHidden={true} svg={QuitIcon}/>
                    </Toasts.Close>
                </Toasts.Root>
                <Toasts.Viewport style={{
                            position: "fixed",
                            bottom: "0",
                            left: "0",
                            display: "flex",
                            flexDirection: "column",
                            padding: "25px",
                            gap: "10px",
                            width: "390px",
                            maxWidth: "100vw",
                            margin: "0",
                            listStyle: "none",
                            zIndex: "2147483647",
                            outline: "none"}} />
            </Toasts.Provider>
        );
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
