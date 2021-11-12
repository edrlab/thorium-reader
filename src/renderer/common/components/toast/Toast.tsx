// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { ToastType } from "readium-desktop/common/models/toast";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as stylesToasts from "readium-desktop/renderer/assets/styles/components/toasts.css";
import SVG from "readium-desktop/renderer/common/components/SVG";

import { TranslatorProps, withTranslator } from "../hoc/translator";

const capitalizedAppName = _APP_NAME.charAt(0).toUpperCase() + _APP_NAME.substring(1);

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    close: (id: string) => void;
    className?: string;
    id?: string;
    // icon?: ISVGProps;
    message?: string;
    displaySystemNotification?: boolean;
    type?: ToastType;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

interface IState {
    willLeave: boolean;
    toRemove: boolean;
}

export class Toast extends React.Component<IProps, IState> {
    private ref: React.RefObject<HTMLDivElement>;

    constructor(props: IProps) {
        super(props);

        this.ref = React.createRef<HTMLDivElement>();

        this.state = {
            willLeave: false,
            toRemove: false,
        };

        this.handleTransitionEnd = this.handleTransitionEnd.bind(this);
        this.handleClose = this.handleClose.bind(this);
    }

    public componentDidMount() {
        setTimeout(this.handleClose, 5000);
        if (this.ref?.current) {
            this.ref?.current.addEventListener("transitionend", this.handleTransitionEnd, false);
        }

        if (this.props.displaySystemNotification) {
            // tslint:disable-next-line: no-unused-expression
            new Notification(capitalizedAppName, {
                body: this.props.message,
            });
        }
    }

    public componentWillRemove() {
        if (this.ref?.current) {
            this.ref?.current.removeEventListener("transitionend", this.handleTransitionEnd, false);
        }
    }

    public render(): React.ReactElement<{}> {
        const { type } = this.props;
        const { willLeave, toRemove } = this.state;

        let typeClassName: string;
        switch (type) {
            case ToastType.Error:
                typeClassName = stylesToasts.error;
                break;
            case ToastType.Success:
                typeClassName = stylesToasts.success;
                break;
            default:
                break;
        }

        if (this.props.displaySystemNotification) {
            return (<></>);
        }

        return (
            <div
                ref={this.ref}
                className={classNames(
                    stylesToasts.toast,
                    willLeave && stylesToasts.leave,
                    toRemove && stylesToasts.toRemove,
                    typeClassName,
                )}
                aria-live="assertive"
                aria-relevant="all"
                role="alert"
            >
                {
                // icon && <SVG className={styles.icon} svg={icon} />
                }
                <p>{ this.props.message }</p>
                <button
                    onClick={() => this.handleClose()}
                    className={stylesToasts.closeButton}
                >
                    <SVG svg={QuitIcon}/>
                </button>
            </div>
        );
    }

    private handleClose() {
        this.setState({ willLeave: true });
    }

    private handleTransitionEnd() {
        if (this.state.toRemove) {
            this.props.close(this.props.id);
        } else if (this.state.willLeave) {
            this.setState({toRemove: true});
        }
    }
}

export default withTranslator(Toast);
