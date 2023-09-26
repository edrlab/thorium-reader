// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as ReactDOM from "react-dom";
import { v4 as uuidv4 } from "uuid";

import AccessibleMenu from "./AccessibleMenu";
import { FocusContext } from "../../focus";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    button: React.ReactElement;
    dir: string; // Direction of menu: right or left
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends React.PropsWithChildren<IBaseProps> {
}

interface IState {
    contentStyle: React.CSSProperties;
    menuOpen: boolean;
}

class Menu extends React.Component<IProps, IState> {

    private backFocusMenuButtonRef: React.RefObject<HTMLButtonElement>;
    private accessibleMenuContentRef: React.RefObject<HTMLDivElement>;
    private menuId: string;
    private appElement: HTMLElement;
    private appOverlayElement: HTMLElement;
    private rootElement: HTMLElement;

    declare context: React.ContextType<typeof FocusContext>;
    static contextType = FocusContext;

    constructor(props: IProps) {
        super(props);

        this.backFocusMenuButtonRef = React.createRef<HTMLButtonElement>();
        this.accessibleMenuContentRef = React.createRef<HTMLDivElement>();

        this.state = {
            contentStyle: {},
            menuOpen: false,
        };
        this.menuId = "menu-" + uuidv4();
        this.doBackFocusMenuButton = this.doBackFocusMenuButton.bind(this);
        this.toggleOpenMenu = this.toggleOpenMenu.bind(this);

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

        this.context.clearFocusRef(this.backFocusMenuButtonRef);
    }

    public componentDidUpdate(_oldProps: IProps, oldState: IState) {

        if (oldState.menuOpen === false && this.state.menuOpen === true) {
            this.accessibleMenuContentRef?.current?.querySelector("button")?.focus(); // focus first button
            this.context.setFocusRef(this.backFocusMenuButtonRef);
            this.refreshStyle();
        }
    }

    public render(): React.ReactElement<{}> {

        return (
            <>
                <button
                    aria-expanded={this.state.menuOpen}
                    aria-controls={this.menuId}
                    onClick={this.toggleOpenMenu}
                    ref={this.backFocusMenuButtonRef}
                >
                    {this.props.button}
                </button>
                {
                    this.state.menuOpen ?
                        ReactDOM.createPortal(
                            (
                                <AccessibleMenu
                                    doBackFocusMenuButton={this.doBackFocusMenuButton}
                                    visible={this.state.menuOpen}
                                    toggleMenu={this.toggleOpenMenu}
                                >
                                    <div
                                        style={this.state.contentStyle}
                                        id={this.menuId}
                                        aria-hidden={!this.state.menuOpen}
                                        role="menu"
                                        aria-expanded={this.state.menuOpen}
                                        ref={this.accessibleMenuContentRef}
                                    >
                                        <span onClick={() => setTimeout(this.toggleOpenMenu, 1)}>
                                            {this.props.children}
                                        </span>
                                    </div>
                                </AccessibleMenu>
                            ), this.rootElement)
                        : <></>
                }
            </>
        );
    }

    private toggleOpenMenu() {
        this.setState({ menuOpen: !this.state.menuOpen });
    }

    private offset(el: HTMLElement) {
        const rect = el.getBoundingClientRect();
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const right = window.innerWidth - (rect.right + 19) - scrollLeft;
        return {
            top: rect.top + scrollTop,
            left: rect.left + scrollLeft,
            right,
        };
    }

    private refreshStyle() {
        if (!this.backFocusMenuButtonRef?.current || !this.accessibleMenuContentRef) {
            return;
        }
        const contentStyle: React.CSSProperties = {
            position: "absolute",
        };

        // calculate vertical position of the menu
        const button = this.backFocusMenuButtonRef.current;
        const buttonRect = button.getBoundingClientRect();
        const bottomPos = window.innerHeight - buttonRect.bottom;
        const contentElement = ReactDOM.findDOMNode(this.accessibleMenuContentRef.current) as HTMLElement;
        const contentHeight = contentElement.getBoundingClientRect().height;

        if (bottomPos < contentHeight) {
            contentStyle.top = Math.round(this.offset(button).top - contentHeight) + "px";
        } else {
            contentStyle.top = Math.round(this.offset(button).top + buttonRect.height) + "px";
        }

        if (this.props.dir === "right") {
            contentStyle.right = Math.round(this.offset(button).right) + "px";
        } else {
            contentStyle.left = Math.round(this.offset(button).left) + "px";
        }

        this.setState({ contentStyle });
    }

    private doBackFocusMenuButton() {
        if (this.backFocusMenuButtonRef?.current) {
            this.backFocusMenuButtonRef.current.focus();
        }
    }
}

export default (Menu);
