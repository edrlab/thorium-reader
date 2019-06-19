// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as style from "readium-desktop/renderer/assets/styles/myBooks.css";
import { withApi } from "../utils/api";

import { Link } from "react-router-dom";

interface ButtonTagProps {
    name: string;
    tag?: PublicationView[];
    findByTag?: (data: { tag: string }) => PublicationView[];
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
