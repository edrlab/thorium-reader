// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { v4 as uuidv4 } from "uuid";
import { FocusContext } from "readium-desktop/renderer/common/focus";
import MenuContent from "./MenuContent";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    button: React.ReactElement;
    dir: string; // Direction of menu: right or left // FIXME unused ?
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends React.PropsWithChildren<IBaseProps> {
}

interface IState {
    menuOpen: boolean;
}

class Menu extends React.Component<IProps, IState> {

    private backFocusMenuButtonRef: React.RefObject<HTMLButtonElement>;
    private menuId: string;

    declare context: React.ContextType<typeof FocusContext>;
    static contextType = FocusContext;

    constructor(props: IProps) {
        super(props);

        this.backFocusMenuButtonRef = React.createRef<HTMLButtonElement>();
        this.state = {
            menuOpen: false,
        };
        this.menuId = "menu-" + uuidv4();
    }

    public componentWillUnmount() {
        this.context.clearFocusRef(this.backFocusMenuButtonRef);
    }

    public async componentDidUpdate(_oldProps: IProps, oldState: IState) {

        if (oldState.menuOpen === false && this.state.menuOpen === true) {
            this.context.setFocusRef(this.backFocusMenuButtonRef);
        }
    }

    public render(): React.ReactElement<{}> {

        let MenuContentRendered = <></>;
        if (this.state.menuOpen) {
            MenuContentRendered = <>
                <MenuContent
                    id={this.menuId}
                    closeMenu={() => this.setState({ menuOpen: false })}
                    menuButtonRef={this.backFocusMenuButtonRef}
                >
                    {this.props.children}
                </MenuContent>
            </>;
        }

        return (
            <>
                <button
                    aria-expanded={this.state.menuOpen}
                    aria-controls={this.menuId}
                    onClick={() => this.setState({menuOpen: true})}
                    ref={this.backFocusMenuButtonRef}
                >
                    {this.props.button}
                </button>
                {MenuContentRendered}
            </>
        );
    }
}

export default (Menu);
