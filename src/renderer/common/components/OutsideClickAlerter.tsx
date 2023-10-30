// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    onClickOutside: () => void;
    disabled?: boolean;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

export default class OutsideClickAlerter extends React.Component<React.PropsWithChildren<IProps>, undefined> {
    private wrapperRef: React.RefObject<HTMLDivElement>;

    constructor(props: IProps) {
        super(props);

        this.wrapperRef = React.createRef<HTMLDivElement>();

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
            <div ref={this.wrapperRef}>
                { this.props.children }
            </div>
        );
    }

    private handleClickOutside(event: MouseEvent) {
        if (this.wrapperRef?.current && !this.wrapperRef.current.contains(event.target as Element)) {
            this.props.onClickOutside();
        }
    }
}
