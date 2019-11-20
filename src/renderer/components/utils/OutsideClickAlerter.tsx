// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps {
    onClickOutside: any;
    disabled?: boolean;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps {
}

export default class OutsideClickAlerter extends React.Component<IProps> {
    private wrapperRef: any;

    constructor(props: IProps) {
        super(props);

        this.setWrapperRef = this.setWrapperRef.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
    }

    public componentDidUpdate(oldProps: IProps) {
        if (this.props.disabled && !oldProps.disabled) {
            document.removeEventListener("mousedown", this.handleClickOutside);
        } else if (!this.props.disabled && oldProps.disabled) {
            document.addEventListener("mousedown", this.handleClickOutside);
        }
    }

    public componentDidMount() {
        if (!this.props.disabled) {
            document.addEventListener("mousedown", this.handleClickOutside);
        }
    }

    public componentWillUnmount() {
        if (!this.props.disabled) {
            document.removeEventListener("mousedown", this.handleClickOutside);
        }
    }

    public render(): React.ReactElement<{}> {
        return (
            <div ref={this.setWrapperRef}>
                { this.props.children }
            </div>
        );
    }

    private setWrapperRef(node: any) {
        this.wrapperRef = node;
    }

    private handleClickOutside(event: any) {
        if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
            this.props.onClickOutside();
        }
    }
}
