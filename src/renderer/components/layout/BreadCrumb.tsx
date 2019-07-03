// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { Link } from "react-router-dom";

import * as ArrowIcon from "readium-desktop/renderer/assets/icons/arrow-left.svg";
import SVG from "readium-desktop/renderer/components/utils/SVG";

import * as classNames from "classnames";

import { parseQueryString } from "readium-desktop/utils/url";

import * as styles from "readium-desktop/renderer/assets/styles/breadcrumb.css";

export interface BreadCrumbItem {
    name: string;
    path?: string;
    state?: any;
}

interface BreadCrumbProps {
    breadcrumb: BreadCrumbItem[];
    search: any;
    className?: string;
}

export default class BreadCrumb extends React.Component<BreadCrumbProps, undefined> {
    public render(): React.ReactElement<{}> {
        const { breadcrumb } = this.props;
        const search = parseQueryString(this.props.search.replace("?", ""));
        return (
            <div className={classNames([styles.breadcrumb, this.props.className])}>
                { this.props.breadcrumb.length >= 2 &&
                    <Link to={{pathname: breadcrumb[breadcrumb.length - 2].path, search: this.props.search}}>
                        <SVG svg={ArrowIcon}/>
                    </Link>
                }
                {this.props.breadcrumb && this.props.breadcrumb.map((item, index) =>
                    item.path ?
                        <Link key={index} to={{
                            pathname: item.path,
                            search: `?displayType=${search.displayType}`,
                            state: item.state,
                        }}>{ item.name } /</Link>
                    :
                        <span key={index} >{ item.name }</span>,
                )}
            </div>
        );
    }
}
