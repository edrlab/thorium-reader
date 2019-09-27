// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Link } from "react-router-dom";

interface IProps {
    name: string;
}

class GridTagButton extends React.Component<IProps> {

    public constructor(props: any) {
        super(props);

    }

    public render(): React.ReactElement<{}> {
        return (
            <Link
            to={{pathname: `/library/search/tag/${this.props.name}`}}>
                {this.props.name}
                {/*<div id={style.count}>
                    {this.props.tag.length}
                </div>*/}
            </Link>
        );
    }
}

export default GridTagButton;
