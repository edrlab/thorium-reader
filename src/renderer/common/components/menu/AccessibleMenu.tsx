// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import FocusLock from "react-focus-lock";
import OutsideClickAlerter from "readium-desktop/renderer/common/components/OutsideClickAlerter";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends React.PropsWithChildren {
    className?: string;
    visible: boolean;
    toggleMenu: () => void;
    dontCloseWhenClickOutside?: boolean;
    doBackFocusMenuButton?: () => void;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

interface IState {
    inFocus: boolean;
    triggerElem: HTMLElement | undefined;
}

export default class AccessibleMenu extends React.Component<IProps, IState> {
    private containerRef: React.RefObject<HTMLDivElement>;
    private ismounted = false;

    constructor(props: IProps) {
        super(props);
        this.containerRef = React.createRef<HTMLDivElement>();

        this.state = {
            inFocus: false,
            triggerElem: undefined,
        };

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

    public componentDidUpdate(oldProps: IProps, prevState: IState) {
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
                /**
                 * document.activeElement is a DOM property (HTML, SVG, XML, etc.)
                 * https://developer.mozilla.org/en-US/docs/Web/API/DocumentOrShadowRoot/activeElement
                 * https://developer.mozilla.org/en-US/docs/Web/API/Document
                 *
                 * But in our case, we know that the Thorium UI is built with HTML markup (+ a few SVG images),
                 * so we can cast the correct type for better compile-time checking.
                 */
                this.setState({
                    triggerElem: document.activeElement as HTMLElement,
                });
            }
        }

        if (prevState.inFocus
            && !this.state.inFocus
            && this.state.triggerElem
        ) {
            if (this.state.triggerElem != null) {
                this.state.triggerElem.focus();
            }
        }
    }

    public render() {
        const disabled = !this.props.visible || !this.state.inFocus;

        return (
            <OutsideClickAlerter disabled={!this.props.visible} onClickOutside={this.onClickOutside}>
                <div
                    ref={this.containerRef}
                    className={this.props.className}
                >
                    <FocusLock disabled={disabled} autoFocus={!disabled}>
                        {this.props.children}
                    </FocusLock>
                </div>
            </OutsideClickAlerter>
        );
    }

    private handleKey(event: KeyboardEvent) {
        if (event.key === "Escape" || (!this.state.inFocus && (event.shiftKey && event.key === "Tab"))) {
            this.props.toggleMenu();
            if (this.props.doBackFocusMenuButton) {
                this.props.doBackFocusMenuButton();
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
        /**
         * Event.target is a generic DOM property,
         * which does not only apply to HTML (also SVG, XML, etc.).
         * However, in Thorium we know that the UI is implemented in HTML markup
         * (with the odd SVG image here and there),
         * so we can safely cast the appropriate type for better static / compile-time checking.
         * https://developer.mozilla.org/en-US/docs/Web/API/Event/target
         * https://developer.mozilla.org/en-US/docs/Web/API/Event
         */
        const focusedNode = event.target as HTMLElement;

        if (this.containerRef?.current?.contains(focusedNode)
        ) {
            if (this.ismounted) {
                this.setState({
                    inFocus: true,
                });
            }
        }
    }
}
