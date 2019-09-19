// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import FocusLock from "react-focus-lock";
import OutsideClickAlerter from "readium-desktop/renderer/components/utils/OutsideClickAlerter";

interface Props {
    className?: string;
    visible: boolean;
    toggleMenu: () => void;
    dontCloseWhenClickOutside?: boolean;
    focusMenuButton?: () => void;
}

interface State {
    inFocus: boolean;
    triggerElem: Element | undefined;
}

export default class AccessibleMenu extends React.Component<Props, State> {
    private containerRef: React.RefObject<HTMLDivElement>;
    private ismounted = false;

    public constructor(props: Props) {
        super(props);

        this.state = {
            inFocus: false,
            triggerElem: undefined,
        };

        this.containerRef = React.createRef();
        this.handleFocus = this.handleFocus.bind(this);
        this.handleKey = this.handleKey.bind(this);
        this.onClickOutside = this.onClickOutside.bind(this);
    }

    public componentDidMount() {
        this.ismounted = true;
        if (this.props.visible) {
            document.addEventListener("keydown", this.handleKey);
            document.addEventListener("focusin", this.handleFocus);
        }
    }

    public componentWillUnmount() {
        this.ismounted = false;
        if (this.props.visible) {
            document.removeEventListener("keydown", this.handleKey);
            document.removeEventListener("focusin", this.handleFocus);
        }
    }

    public componentDidUpdate(oldProps: Props, prevState: State) {
        if (!this.props.visible && oldProps.visible) {
            document.removeEventListener("keydown", this.handleKey);
            document.removeEventListener("focusin", this.handleFocus);
            if (this.ismounted) {
                this.setState({
                    inFocus: false,
                });
            }
        } else if (this.props.visible && !oldProps.visible) {
            document.addEventListener("keydown", this.handleKey);
            document.addEventListener("focusin", this.handleFocus);
            if (this.ismounted) {
                this.setState({
                    triggerElem: document.activeElement,
                });
            }
        }

        if (prevState.inFocus
            && !this.state.inFocus
            && this.state.triggerElem
        ) {
            if (this.state.triggerElem != null) {
                // WHY ?
                // @ts-ignore
                this.state.triggerElem.focus();
            }
        }
    }

    public render() {
        const disabled = !this.props.visible || !this.state.inFocus;

        return (
            <OutsideClickAlerter disabled={!this.props.visible} onClickOutside={this.onClickOutside}>
                <div
                    {...(this.props.visible)}
                    ref={this.containerRef}
                    className={this.props.className}
                >
                    <FocusLock disabled={disabled} autoFocus={!disabled}>
                        { this.props.children }
                    </FocusLock>
                </div>
            </OutsideClickAlerter>
        );
    }

    private handleKey(event: KeyboardEvent) {
        if (event.key === "Escape" || (!this.state.inFocus && (event.shiftKey && event.key === "Tab"))) {
            this.props.toggleMenu();
            if (this.props.focusMenuButton) {
                this.props.focusMenuButton();
            }
            if (this.ismounted) {
                this.setState({
                    inFocus: false,
                });
            }
        }
        if (event.key === "Tab" && !this.state.inFocus) {
            event.preventDefault();
            if (this.ismounted) {
                this.setState({
                    inFocus: true,
                });
            }

        }
    }

    private onClickOutside() {
        if (!this.props.dontCloseWhenClickOutside) {
            this.props.toggleMenu();
        }
    }

    private handleFocus(event: Event) {
        const focusedNode = event.target;

        if (this.containerRef
            && this.containerRef.current
        // WHY ?
        // @ts-ignore
            && this.containerRef.current.contains(focusedNode)
        ) {
            if (this.ismounted) {
                this.setState({
                inFocus: true,
                });
            }
        }
    }
}
