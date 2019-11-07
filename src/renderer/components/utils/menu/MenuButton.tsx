// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps {
    menuId: string;
    open: boolean;
    toggle: () => void;
    focusMenuButton?: (ref: React.RefObject<HTMLButtonElement>, menuID: string) => void;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps {
}

export default class MenuButton extends React.Component<IProps, undefined> {
    private menuButton = React.createRef<HTMLButtonElement>();

    constructor(props: IProps) {
        super(props);

        this.getFocusBack = this.getFocusBack.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { toggle, open, menuId, children } = this.props;
        return (
            <button
                aria-expanded={open}
                aria-controls={menuId}
                onClick={toggle}
                ref={this.menuButton}
            >
                {this.getFocusBack()}
                {children}
            </button>
        );
    }

    public getFocusBack() {
        if (this.menuButton && this.props.open) {
            this.props.focusMenuButton(this.menuButton, this.props.menuId);
        }
    }
}
