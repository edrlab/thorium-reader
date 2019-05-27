// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as uuid from "uuid";

import AccessibleMenu from "./AccessibleMenu";
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
    toggle: () => void;
}

interface MenuState {
    contentStyle: any;
}

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

        this.focusMenuButton = this.focusMenuButton.bind(this);
    }

    public componentDidUpdate(oldProps: MenuProps) {
        if (this.props.open && !oldProps.open) {
            this.refreshStyle();
        }
    }

    public render(): React.ReactElement<{}> {
        const { open, toggle, button, dir, content } = this.props;
        const contentStyle = this.state.contentStyle;
        return (
            <>
                <MenuButton
                    ref={(ref) => { this.buttonRef = ref; }}
                    menuId={this.menuId}
                    open={open}
                    toggle={toggle}
                >
                    {button}
                </MenuButton>
                { open &&
                    <MenuContent
                        id={this.menuId}
                        open={open}
                        dir={dir}
                        menuStyle={contentStyle}
                        toggle={toggle}
                        setContentRef={(ref) => { this.contentRef = ref; }}
                        focusMenuButton={this.focusMenuButton}
                    >
                        {content}
                    </MenuContent>
                }
            </>
        );
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

        console.log(`bottomPos: ${bottomPos} || contentHeight: ${contentHeight}`);
        console.log(contentElement);

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

    private focusMenuButton() {
        const button = ReactDOM.findDOMNode(this.buttonRef) as HTMLElement;

        button.focus();
    }
}
