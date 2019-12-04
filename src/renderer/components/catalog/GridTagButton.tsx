// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "readium-desktop/renderer/redux/states";
import { DisplayType } from "readium-desktop/renderer/routing";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps {
    name: string;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

class GridTagButton extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {

        let displayType = DisplayType.Grid;
        if (this.props.location?.state?.displayType) {
            displayType = this.props.location.state.displayType;
        }

        return (
            <Link
                to={{
                    pathname: `/library/search/tag/${this.props.name}`,
                    search: "",
                    hash: "",
                    state: {
                        displayType,
                    },
                }}>
                {this.props.name}
                {/*<div id={style.count}>
                    {this.props.tag.length}
                </div>*/}
            </Link>
        );
    }
}

const mapStateToProps = (state: RootState) => ({
    location: state.router.location,
});

export default connect(mapStateToProps)(GridTagButton);
