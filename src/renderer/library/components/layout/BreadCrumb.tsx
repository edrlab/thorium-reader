// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import * as BreacrmbsNavIcon from "readium-desktop/renderer/assets/icons/breadcrumbsNav-icon.svg";
import * as ChevronRight from "readium-desktop/renderer/assets/icons/chevron-right.svg";
import * as stylesBreadcrumb from "readium-desktop/renderer/assets/styles/components/breadcrumb.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { IBreadCrumbItem } from "readium-desktop/common/redux/states/renderer/breadcrumbItem";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { DisplayType, IRouterLocationState } from "../../routing";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    breadcrumb: IBreadCrumbItem[];
    className?: string;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

class BreadCrumb extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { breadcrumb, __ } = this.props;

        return (
            <div className={classNames(stylesBreadcrumb.breadcrumb, this.props.className)}>
                {
                    breadcrumb.length >= 2
                        ? <Link
                            to={{
                                ...this.props.location,
                                pathname: breadcrumb[0].path,
                            }}
                            state={{ displayType: (this.props.location.state && (this.props.location.state as IRouterLocationState).displayType) ? (this.props.location.state as IRouterLocationState).displayType : DisplayType.Grid }}
                            title={__("opds.back")}
                            className={stylesButtons.button_transparency_icon}
                        >
                            <SVG ariaHidden={true} svg={BreacrmbsNavIcon} />
                        </Link>
                        : <></>
                }
                {
                    breadcrumb
                        ?
                        breadcrumb.length > 5 ?
                            <>
                                <Link
                                    to={{
                                        ...this.props.location,
                                        pathname: breadcrumb[0].path,
                                    }}
                                    state={{ displayType: (this.props.location.state && (this.props.location.state as IRouterLocationState).displayType) ? (this.props.location.state as IRouterLocationState).displayType : DisplayType.Grid }}
                                    title={breadcrumb[0].name}
                                    className={stylesButtons.button_transparency}
                                >
                                    <p>{breadcrumb[0].name}</p>
                                    <SVG ariaHidden svg={ChevronRight} />
                                </Link>
                                <Link
                                    to={{
                                        ...this.props.location,
                                        pathname: breadcrumb[breadcrumb.length - 3].path,
                                    }}
                                    state={{ displayType: (this.props.location.state && (this.props.location.state as IRouterLocationState).displayType) ? (this.props.location.state as IRouterLocationState).displayType : DisplayType.Grid }}
                                    title={breadcrumb[breadcrumb.length - 3].name}
                                    className={stylesButtons.button_transparency}
                                >
                                    <p>...</p>
                                    <SVG ariaHidden svg={ChevronRight} />
                                </Link>
                                <Link
                                    to={{
                                        ...this.props.location,
                                        pathname: breadcrumb[breadcrumb.length - 2].path,
                                    }}
                                    state={{ displayType: (this.props.location.state && (this.props.location.state as IRouterLocationState).displayType) ? (this.props.location.state as IRouterLocationState).displayType : DisplayType.Grid }}
                                    title={breadcrumb[breadcrumb.length - 2].name}
                                    className={stylesButtons.button_transparency}
                                >
                                    <p>{breadcrumb[breadcrumb.length - 2].name}</p>
                                    <SVG ariaHidden svg={ChevronRight} />
                                </Link>
                                <strong>
                                    {breadcrumb[breadcrumb.length - 1].name}
                                </strong>
                            </>
                            :
                            breadcrumb.map(
                                (item, index) =>
                                    item.path && index !== breadcrumb.length - 1 ?
                                        <Link
                                            key={index}
                                            to={{
                                                ...this.props.location,
                                                pathname: item.path,
                                            }}
                                            state={{ displayType: (this.props.location.state && (this.props.location.state as IRouterLocationState).displayType) ? (this.props.location.state as IRouterLocationState).displayType : DisplayType.Grid }}
                                            title={item.name}
                                            className={stylesButtons.button_transparency}
                                        >
                                            <p title={item.name}>{item.name}</p>
                                            <SVG ariaHidden svg={ChevronRight} />
                                        </Link>
                                        :
                                        <strong key={index} title={item.name}>
                                            {item.name}
                                        </strong>,
                            )
                        : <></>
                }
            </div>
        );
    }
}

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
});

export default connect(mapStateToProps)(withTranslator(BreadCrumb));
