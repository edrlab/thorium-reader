// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";

import * as qs from "query-string";

interface Props extends RouteComponentProps {
    active?: boolean;
}

class AutoFocus extends React.Component<Props> {
    private wrapperRef: any;
    private canFocus: boolean = true;

    public componentDidUpdate(oldProps: Props) {
        this.focusInside();
        if (oldProps.active !== this.props.active && this.props.active) {
            this.canFocus = true;
        }
        if (this.canFocus) {
            this.focusInside();
        }
    }

    public componentDidMount() {
        if (this.props.active) {
            this.focusInside();
        }
    }

    public render(): React.ReactElement<{}> {
        return (
            <div ref={(ref) => this.wrapperRef = ref}>
                {this.props.children}
            </div>
        );
    }

    private focusFirstElement() {
        const selectors = `button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])`;
        const focusable = this.wrapperRef.querySelector(selectors);
        if (focusable) {
            focusable.focus();
            this.canFocus = false;
            this.props.history.push({pathname: this.props.location.pathname, search: `?focusInside=false`});
        }
    }

    private focusInside() {
        const { location } = this.props;
        const focusInside = qs.parse(location.search).focusInside === "true";
        if (focusInside) {
            this.focusFirstElement();
        }
    }
}

export default withRouter(AutoFocus);
