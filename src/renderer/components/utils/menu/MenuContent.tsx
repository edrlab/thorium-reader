// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as ReactDOM from "react-dom";

import AccessibleMenu from "./AccessibleMenu";

interface MenuContentProps {
    id: string;
    open: boolean;
    dir: string;
    menuStyle: object;
    toggle: () => void;
    focusMenuButton?: () => void;
    setContentRef?: (ref: any) => any;
}

export default class MenuContent extends React.Component<MenuContentProps, undefined> {
    private appOverlayElement: HTMLElement;
    private rootElement: HTMLElement;

    public constructor(props: any) {
        super(props);

        this.appOverlayElement = document.getElementById("app-overlay");
        this.rootElement = document.createElement("div");
    }

    public componentDidMount() {
        this.appOverlayElement.appendChild(this.rootElement);
    }

    public componentWillUnmount() {
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
                        ref={(ref) => setContentRef && setContentRef(ref)}
                    >
                        {this.props.children}
                    </div>
                </AccessibleMenu>
            ),
            this.rootElement,
        );
    }
}
