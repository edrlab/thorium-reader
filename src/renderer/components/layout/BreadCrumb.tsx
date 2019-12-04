// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as classNames from "classnames";
import * as React from "react";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import * as ArrowIcon from "readium-desktop/renderer/assets/icons/arrow-left.svg";
import * as styles from "readium-desktop/renderer/assets/styles/breadcrumb.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";

import { DisplayType, RouterLocationState } from "../utils/displayType";

export interface BreadCrumbItem {
    name: string;
    path?: string;
    // state?: any; UNUSED?!
}

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    breadcrumb: BreadCrumbItem[];
    className?: string;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, RouteComponentProps {
}

class BreadCrumb extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { breadcrumb, __ } = this.props;

        let displayType = DisplayType.Grid;
        if (this.props.location?.state?.displayType) {
            displayType = this.props.location.state.displayType as DisplayType;
        //     console.log("this.props.location -- Breadcrumb");
        //     console.log(this.props.location);
        //     console.log(this.props.location.state);
        // } else {
        //     console.log("XXX this.props.location -- Breadcrumb");
        }

        return (
            <div className={classNames(styles.breadcrumb, this.props.className)}>
                {breadcrumb.length >= 2 &&
                    <Link
                        to={{
                            pathname: breadcrumb[breadcrumb.length - 2].path,
                            search: "",
                            hash: "",
                            state: {
                                displayType,
                            } as RouterLocationState,
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
                                search: "",
                                hash: "",
                                state: {
                                    displayType,
                                } as RouterLocationState,
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

export default withTranslator(withRouter(BreadCrumb));
