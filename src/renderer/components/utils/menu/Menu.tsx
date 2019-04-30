// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as uuid from "uuid";

import MenuButton from "./MenuButton";
import MenuContent from "./MenuContent";

interface ContentStyle {
    [key: string]: any;
}

interface MenuProps {
    button: any;
    content: any;
    open: boolean; // Is menu open
    dir: string; // Direction of menu: right or left
    toggle: (open: boolean) => void;
}

interface MenuState {
    contentStyle: any;
}

const CLICKABLE_TAGS = [
    "a",
    "button",
];

export default class Menu extends React.Component<MenuProps, MenuState> {
    private buttonRef: any;
    private contentRef: any;
    private menuId: string;

    public constructor(props: any) {
        super(props);
        this.state = {
            contentStyle: {},
        };
        this.menuId = "menu-" + uuid.v4();
        this.handleGlobalClick = this.handleGlobalClick.bind(this);
        this.handleGlobalKeydown = this.handleGlobalKeydown.bind(this);
    }

    public componentDidMount() {
        document.addEventListener("click", this.handleGlobalClick);
    }

    public componentWillUnmount() {
        document.removeEventListener("click", this.handleGlobalClick);
    }

    public componentDidUpdate(oldProps: MenuProps) {
        if (this.props.open && !oldProps.open) {
            this.refreshStyle();

            document.addEventListener("keydown", this.handleGlobalKeydown);
        } else if (!this.props.open && oldProps.open) {
            document.removeEventListener("keydown", this.handleGlobalKeydown);
        }
    }

    public render(): React.ReactElement<{}> {
        const { open } = this.props;
        const contentStyle = this.state.contentStyle;
        return (
            <>
                <MenuButton
                    ref={(ref) => { this.buttonRef = ref; }}
                    menuId={this.menuId}
                    open={open}
                >
                    {this.props.button}
                </MenuButton>
                { open &&
                    <MenuContent
                        menuId={this.menuId}
                        menuOpen={open}
                        menuDir={this.props.dir}
                        menuStyle={contentStyle}
                        ref={(ref) => { this.contentRef = ref; }}
                    >
                        {this.props.content}
                    </MenuContent>
                }
            </>
        );
    }

    public handleGlobalKeydown(event: any) {
        const key = event.key;

        if (key === "Escape" && this.props.open) {
            this.props.toggle(false);

            // Focus button
            const buttonElement = ReactDOM.findDOMNode(this.buttonRef) as HTMLElement;
            buttonElement.focus();
        }
    }

    public handleGlobalClick(event: any) {
        const buttonElement = ReactDOM.findDOMNode(this.buttonRef) as HTMLElement;
        const targetElement: HTMLElement = event.target;
        const contentElement = document.getElementById(this.menuId);
        const { open } = this.props;

        if (buttonElement.contains(targetElement)) {
            // Click on button: toggle menu
            this.props.toggle(!this.props.open);

            return;
        }
        if (open) {
            if (!contentElement.contains(targetElement)) {
                this.props.toggle(false);
            } else {
                if (CLICKABLE_TAGS.indexOf(targetElement.tagName.toLowerCase()) > -1) {
                    // This is a link => close menu
                    this.props.toggle(false);
                }
            }
        }
    }

    private offset(el: any) {
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
        const contentStyle: ContentStyle = {
            position: "absolute",
        };

        // calculate vertical position of the menu
        const button = ReactDOM.findDOMNode(this.buttonRef) as HTMLElement;
        const buttonRect = button.getBoundingClientRect();
        const bottomPos = window.innerHeight - buttonRect.bottom;
        const contentElement = ReactDOM.findDOMNode(this.contentRef) as HTMLElement;
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
}
