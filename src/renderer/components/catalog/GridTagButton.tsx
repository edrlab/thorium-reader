// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Link } from "react-router-dom";
import {
    TPublicationApiFindByTag, TPublicationApiFindByTag_result,
} from "readium-desktop/main/api/publication";

import { withApi } from "../utils/api";

interface ButtonTagProps {
    name: string;
    tag?: TPublicationApiFindByTag_result;
    findByTag?: TPublicationApiFindByTag;
}

export class GridTagButton extends React.Component<ButtonTagProps> {

    public constructor(props: any) {
        super(props);

    }

    /*public componentDidMount() {
        console.log("mon tag: ", this.props.name);
        this.props.findByTag({ tag: this.props.name});
        console.log("books: ", this.props.tag.length);
    }*/

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

export default withApi(
    GridTagButton,
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "findByTag",
                callProp: "findByTag",
                resultProp: "tag",
            },
        ],
    },
);
