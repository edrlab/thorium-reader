// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as ReactDOM from "react-dom";

import * as stylesDropDown from "readium-desktop/renderer/assets/styles/components/dropdown.css";
import AccessibleMenu from "./AccessibleMenu";
import { arrow, autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    id: string;
    closeMenu: () => void,
    menuButtonRef: React.RefObject<HTMLButtonElement>;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

interface IState {
    menuStyle: { content: React.CSSProperties, arrow: React.CSSProperties };
}

export default class MenuContent extends React.Component<IProps, IState> {
    private appElement: HTMLElement;
    private appOverlayElement: HTMLElement;
    private rootElement: HTMLElement;
    private accessibleMenuContentRef: React.RefObject<HTMLDivElement>;
    private cleanupFloatingUITracker: () => void;
    private arrowMenuRef: React.RefObject<HTMLDivElement>;

    constructor(props: IProps) {
        super(props);

        this.state = {
            menuStyle: { content: {}, arrow: {} },
        };
        this.appElement = document.getElementById("app");
        this.appOverlayElement = document.getElementById("app-overlay");
        this.rootElement = document.createElement("div");

        this.accessibleMenuContentRef = React.createRef<HTMLDivElement>();
        this.arrowMenuRef = React.createRef<HTMLDivElement>();
        this.loadContentStyles = this.loadContentStyles.bind(this);
        this.cleanupFloatingUITracker = () => { };
    }

    public componentDidMount() {
        this.appElement.setAttribute("aria-hidden", "true");
        this.appOverlayElement.appendChild(this.rootElement);

        setTimeout(() => this.accessibleMenuContentRef?.current?.querySelector("button")?.focus(), 1);
        this.cleanupFloatingUITracker = this.loadContentStyles();
    }

    public componentWillUnmount() {
        this.appElement.setAttribute("aria-hidden", "false");
        this.appOverlayElement.removeChild(this.rootElement);

        this.cleanupFloatingUITracker();
    }

    public render() {

        return ReactDOM.createPortal(
            (
                <AccessibleMenu
                    doBackFocusMenuButton={() => this.props.menuButtonRef.current?.focus()}
                    visible={true}
                    toggleMenu={this.props.closeMenu}
                >
                    <div
                        style={this.state.menuStyle.content}
                        id={this.props.id}
                        aria-hidden={false}
                        role="menu"
                        aria-expanded={true}
                        ref={this.accessibleMenuContentRef}
                    >

                        <div className={stylesDropDown.dropdown_menu}>
                            {this.props.children}
                            <div id={"arrow"} aria-hidden={true} ref={this.arrowMenuRef} style={this.state.menuStyle.arrow}></div>
                        </div>
                    </div>
                </AccessibleMenu>
            ),
            this.rootElement,
        );
    }

    private loadContentStyles() {

        const cleanup = autoUpdate(
            this.props.menuButtonRef.current,
            this.accessibleMenuContentRef.current,
            () => computePosition(this.props.menuButtonRef.current, this.accessibleMenuContentRef.current, {
                placement: "bottom",
                middleware: [flip(), shift({ padding: 5 }), offset(10), arrow({ element: this.arrowMenuRef.current })],
            })
                .then(({ x, y, placement, middlewareData: { arrow: { x: arrowX, y: arrowY } } }) => {

                    const staticSide = {
                        top: "bottom",
                        right: "left",
                        bottom: "top", // not used
                        left: "right", // not used
                    }[placement.split("-")[0]];

                    this.setState({
                        menuStyle: {
                            content: {
                                position: "absolute",
                                left: `${x}px`,
                                top: `${y}px`,
                            },
                            arrow: {
                                left: arrowX != null ? `${arrowX}px` : "",
                                top: arrowY != null ? `${arrowY}px` : "",
                                right: "",
                                bottom: "",
                                [staticSide]: "-4px",
                            },
                        },
                    });
                })
                .catch((e) => {
                    // nothing
                    console.error("floatingUI err", e);
                }),
        );
        return cleanup;
    }
}
