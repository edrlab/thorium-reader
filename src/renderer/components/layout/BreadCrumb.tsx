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

import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/translator";

import * as styles from "readium-desktop/renderer/assets/styles/breadcrumb.css";

export interface BreadCrumbItem {
    name: string;
    path?: string;
    state?: any;
}

interface BreadCrumbProps extends TranslatorProps {
    breadcrumb: BreadCrumbItem[];
    search: any;
    className?: string;
}

class BreadCrumb extends React.Component<BreadCrumbProps, undefined> {
    public render(): React.ReactElement<{}> {
        const { breadcrumb, __ } = this.props;
        const search = parseQueryString(this.props.search);
        return (
            <div className={classNames([styles.breadcrumb, this.props.className])}>
                { breadcrumb.length >= 2 &&
                    <Link
                        to={{
                            pathname: breadcrumb[breadcrumb.length - 2].path,
                            search: `?displayType=${search.displayType}`,
                        }}
                        title={__("opds.back")}
                    >
                        <SVG svg={ArrowIcon}/>
                    </Link>
                }
                <div>
                    {breadcrumb && breadcrumb.map((item, index) =>
                        item.path && index !== breadcrumb.length - 1 ?
                            <>
                                <Link
                                    key={index}
                                    to={{
                                        pathname: item.path,
                                        search: `?displayType=${search.displayType}`,
                                        state: item.state,
                                    }}
                                    title={ item.name }
                                >
                                    { item.name }
                                </Link>
                                <span> / </span>
                            </>
                        :
                            <span key={index} >{ item.name }</span>,
                    )}
                </div>
            </div>
        );
    }
}

export default withTranslator(BreadCrumb);
