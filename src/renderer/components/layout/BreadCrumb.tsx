// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as classNames from "classnames";
import * as React from "react";
import { Link } from "react-router-dom";
import * as ArrowIcon from "readium-desktop/renderer/assets/icons/arrow-left.svg";
import * as styles from "readium-desktop/renderer/assets/styles/breadcrumb.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { parseQueryString } from "readium-desktop/utils/url";

export interface BreadCrumbItem {
    name: string;
    path?: string;
    state?: any;
}

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    breadcrumb: BreadCrumbItem[];
    search: string;
    className?: string;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps {
}

class BreadCrumb extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { breadcrumb, __ } = this.props;
        const search = parseQueryString(this.props.search);
        return (
            <div className={classNames(styles.breadcrumb, this.props.className)}>
                {breadcrumb.length >= 2 &&
                    <Link
                        to={{
                            pathname: breadcrumb[breadcrumb.length - 2].path,
                            search: `?displayType=${search.displayType}`,
                        }}
                        title={__("opds.back")}
                    >
                        <SVG svg={ArrowIcon} />
                    </Link>
                }
                {breadcrumb && breadcrumb.map((item, index) => {
                    const name = item.name;
                    return (item.path && index !== breadcrumb.length - 1 ?
                        <Link
                            key={index}
                            to={{
                                pathname: item.path,
                                search: `?displayType=${search.displayType}`,
                                state: item.state,
                            }}
                            title={name}
                        >
                            {`${name} /`}
                        </Link>
                        :
                        <span key={index}>
                            {name}
                        </span>
                    );
                })}
            </div>
        );
    }
}

export default withTranslator(BreadCrumb);
