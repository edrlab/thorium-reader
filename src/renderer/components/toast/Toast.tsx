// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { ToastType } from "readium-desktop/common/models/toast";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as styles from "readium-desktop/renderer/assets/styles/toast.css";
import SVG from "readium-desktop/renderer/components/utils/SVG";

import { TranslatorProps, withTranslator } from "../utils/hoc/translator";

import classNames = require("classnames");

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    close: (id: string) => void;
    className?: string;
    id?: string;
    icon?: any;
    message?: string;
    displaySystemNotification?: boolean;
    type?: ToastType;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps {
}

interface IState {
    willLeave: boolean;
    toRemove: boolean;
}

export class Toast extends React.Component<IProps, IState> {
    private ref: any;

    constructor(props: IProps) {
        super(props);

        this.state = {
            willLeave: false,
            toRemove: false,
        };

        this.handleTransitionEnd = this.handleTransitionEnd.bind(this);
        this.handleClose = this.handleClose.bind(this);
    }

    public componentDidMount() {
        setTimeout(this.handleClose, 5000);
        this.ref.addEventListener("transitionend", this.handleTransitionEnd, false);
        if (this.props.displaySystemNotification) {
            // tslint:disable-next-line: no-unused-expression
            new Notification("Thorium Reader", {
                body: this.props.message,
            });
        }
    }

    public componentWillRemove() {
        this.ref.removeEventListener("transitionend", this.handleTransitionEnd, false);
    }

    public render(): React.ReactElement<{}> {
        const { icon, type } = this.props;
        const { willLeave, toRemove } = this.state;

        let typeClassName: string;
        switch (type) {
            case ToastType.Error:
                typeClassName = styles.error;
                break;
            case ToastType.Success:
                typeClassName = styles.success;
                break;
            default:
                break;
        }
        return (
            <div
                ref={(ref) => this.ref = ref}
                className={classNames(
                    styles.toast,
                    willLeave && styles.leave,
                    toRemove && styles.toRemove,
                    typeClassName,
                )}
            >
                { icon && <SVG className={styles.icon} svg={icon} /> }
                <p>{ this.props.message }</p>
                <button
                    onClick={() => this.handleClose()}
                    className={styles.closeButton}
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
