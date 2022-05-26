// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as ReactDOM from "react-dom";

import AccessibleMenu from "./AccessibleMenu";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    id: string;
    open: boolean;
    dir: string;
    menuStyle: React.CSSProperties; // {[key: string]: string};
    toggle: () => void;
    focusMenuButton?: () => void;
    setContentRef?: (ref: HTMLDivElement) => void;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

export default class MenuContent extends React.Component<React.PropsWithChildren<IProps>, undefined> {
    private appElement: HTMLElement;
    private appOverlayElement: HTMLElement;
    private rootElement: HTMLElement;

    constructor(props: IProps) {
        super(props);

        this.appElement = document.getElementById("app");
        this.appOverlayElement = document.getElementById("app-overlay");
        this.rootElement = document.createElement("div");
    }

    public componentDidMount() {
        this.appElement.setAttribute("aria-hidden", "true");
        this.appOverlayElement.appendChild(this.rootElement);
    }

    public componentWillUnmount() {
        this.appElement.setAttribute("aria-hidden", "false");
        this.appOverlayElement.removeChild(this.rootElement);
    }

    public render() {
        const { open, toggle, setContentRef } = this.props;
        return ReactDOM.createPortal(
            (
                <AccessibleMenu focusMenuButton={this.props.focusMenuButton} visible={open} toggleMenu={toggle}>
                    <div
                        style={this.props.menuStyle}
                        id={this.props.id}
                        aria-hidden={!this.props.open}
                        role="menu"
                        aria-expanded={this.props.open}
                        ref={(ref) => {
                            if (setContentRef) {
                                setContentRef(ref);
                            }
                            if (ref) {
                                const firstButt = ref.querySelector("button");
                                firstButt.focus();
                            }
                        }}
                    >
                        {this.props.children}
                    </div>
                </AccessibleMenu>
            ),
            this.rootElement,
        );
    }
}
