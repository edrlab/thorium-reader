// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as ReactDOM from "react-dom";
import { v4 as uuidv4 } from "uuid";

import MenuButton from "./MenuButton";
import MenuContent from "./MenuContent";
import { connect } from "react-redux";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { DialogTypeName } from "readium-desktop/common/models/dialog";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    button: React.ReactElement;
    content: React.ReactElement;
    dir: string; // Direction of menu: right or left
    focusMenuButton?: (ref: React.RefObject<HTMLElement>, currentMenuId: string) => void;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

interface IState {
    contentStyle: React.CSSProperties;
    menuOpen: boolean;
}

class Menu extends React.Component<IProps, IState> {

    private backFocusMenuButtonRef: React.RefObject<HTMLElement>;
    private contentRef: HTMLDivElement;
    private menuId: string;

    constructor(props: IProps) {
        super(props);

        this.backFocusMenuButtonRef = React.createRef<HTMLElement>();

        this.state = {
            contentStyle: {},
            menuOpen: false,
        };
        this.menuId = "menu-" + uuidv4();
        this.doBackFocusMenuButton = this.doBackFocusMenuButton.bind(this);
        this.setBackFocusMenuButton = this.setBackFocusMenuButton.bind(this);
        this.toggleOpenMenu = this.toggleOpenMenu.bind(this);
    }

    public componentDidUpdate(oldProps: IProps, oldState: IState) {
        if (this.state.menuOpen && !oldState.menuOpen) {
            this.refreshStyle();
        }
        if (oldProps.infoDialogIsOpen === true &&
            oldProps.infoDialogIsOpen !== this.props.infoDialogIsOpen) {
            this.doBackFocusMenuButton();
        }
    }

    public render(): React.ReactElement<{}> {
        const { button, dir, content } = this.props;
        const contentStyle = this.state.contentStyle;
        return (
            <>
                <MenuButton
                    menuId={this.menuId}
                    open={this.state.menuOpen}
                    toggle={this.toggleOpenMenu}
                    setBackFocusMenuButton={this.setBackFocusMenuButton}
                >
                    {button}
                </MenuButton>
                { this.state.menuOpen ?
                    <MenuContent
                        id={this.menuId}
                        open={this.state.menuOpen}
                        dir={dir}
                        menuStyle={contentStyle}
                        toggle={this.toggleOpenMenu}
                        setContentRef={(ref) => { this.contentRef = ref; }}
                        doBackFocusMenuButton={this.doBackFocusMenuButton}
                    >
                        <span onClick={() => setTimeout(this.toggleOpenMenu, 1)}>
                            {content}
                        </span>
                    </MenuContent>
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
        if (!this.backFocusMenuButtonRef?.current || !this.contentRef) {
            return;
        }
        const contentStyle: React.CSSProperties = {
            position: "absolute",
        };

        // calculate vertical position of the menu
        const button = this.backFocusMenuButtonRef.current;
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

    private setBackFocusMenuButton(currentRef: React.RefObject<HTMLElement>, currentMenuId: string) {
        if (currentRef?.current && this.menuId === currentMenuId) {
            this.backFocusMenuButtonRef = currentRef;
        }
    }

    private doBackFocusMenuButton() {
        if (this.backFocusMenuButtonRef?.current) {
            this.backFocusMenuButtonRef.current.focus();
        }
    }
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => {
    return {
        infoDialogIsOpen: state.dialog.open
            && (state.dialog.type === DialogTypeName.PublicationInfoOpds
                || state.dialog.type === DialogTypeName.PublicationInfoLib
                || state.dialog.type === DialogTypeName.DeletePublicationConfirm),
    };
};

export default connect(mapStateToProps)(Menu);
