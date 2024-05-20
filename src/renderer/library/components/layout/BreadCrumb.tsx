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

interface IState {
    width: number;
    height: number;
}

class BreadCrumb extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);
        this.state = { width: 0, height: 0 };
        this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
    }

    componentDidMount() {
        this.updateWindowDimensions();
        window.addEventListener("resize", this.updateWindowDimensions);
      }
      
      componentWillUnmount() {
        window.removeEventListener("resize", this.updateWindowDimensions);
      }
      
      updateWindowDimensions() {
        this.setState({ width: window.innerWidth, height: window.innerHeight });
      }

    public render(): React.ReactElement<{}> {
        const { breadcrumb } = this.props;
        const windowWidth = this.state.width;

        let breadItems: number;

        if (windowWidth <= 1400) {
            breadItems = 5;
        } else if (windowWidth <= 1800) {
            breadItems = 8;
        } else if (windowWidth <= 2400) {
            breadItems = 10;
        } else {
            breadItems = 13;
        };

        return (
            <div className={classNames(stylesBreadcrumb.breadcrumb, this.props.className)}>
                {
                    breadcrumb
                        ?
                        breadcrumb.length > breadItems ?
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
                                     <SVG ariaHidden={true} svg={BreacrmbsNavIcon} />
                                    <p>{breadcrumb[0].name}</p>
                                </Link>
                                <SVG ariaHidden svg={ChevronRight} />
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
                                </Link>
                                <SVG ariaHidden svg={ChevronRight} />
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
                                </Link>
                                <SVG ariaHidden svg={ChevronRight} />
                                <strong>
                                    {breadcrumb[breadcrumb.length - 1].name}
                                </strong>
                            </>
                        :
                        breadcrumb.length >= 2 && breadcrumb.length <= breadItems ?
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
                                    <SVG ariaHidden={true} svg={BreacrmbsNavIcon} />
                                    <p>{breadcrumb[0].name}</p>
                                </Link>
                                <SVG ariaHidden svg={ChevronRight} />
                                {breadcrumb.slice(1).map(
                                    (item, index) =>
                                        item.path && index !== breadcrumb.length - 2 ?
                                            <React.Fragment key={index}>
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
                                                </Link>
                                                <SVG ariaHidden svg={ChevronRight} />
                                            </React.Fragment>
                                            :
                                        <strong key={index} title={item.name}>
                                            {item.name}
                                        </strong>,
                                )}
                            </>
                        : <></> : <></>
                } 
            </div>
        );
    }
}

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
});

export default connect(mapStateToProps)(withTranslator(BreadCrumb));
