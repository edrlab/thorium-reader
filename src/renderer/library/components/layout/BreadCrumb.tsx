// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
// import { connect } from "react-redux";
import { Link } from "react-router-dom";
import * as ArrowIcon from "readium-desktop/renderer/assets/icons/arrow-left.svg";
import * as stylesBreadcrumb from "readium-desktop/renderer/assets/styles/components/breadcrumb.css";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import {
    TranslatorProps, /* withTranslator */
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { IBreadCrumbItem } from "readium-desktop/renderer/common/models/breadcrumbItem.interface";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { DisplayType, IRouterLocationState } from "../../routing";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";

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
// interface IProps extends IBaseProps {
// }

// class BreadCrumb extends React.Component<IProps, undefined> {

//     constructor(props: IProps) {
//         super(props);
//     }

//     public render(): React.ReactElement<{}> {
//         const { breadcrumb, __ } = this.props;

//         return (
//             <div className={classNames(stylesBreadcrumb.breadcrumb, this.props.className)}>
//                 {
//                     breadcrumb.length >= 2
//                     && <Link
//                         to={{
//                             ...this.props.location,
//                             pathname: breadcrumb[breadcrumb.length - 2].path,
//                         }}
//                         state = {{displayType: (this.props.location.state && (this.props.location.state as IRouterLocationState).displayType) ? (this.props.location.state as IRouterLocationState).displayType : DisplayType.Grid}}
//                         title={__("opds.back")}
//                         className={stylesButtons.button_transparency_icon}
//                     >
//                         <SVG ariaHidden={true} svg={ArrowIcon} />
//                     </Link>
//                 }
//                 {
//                     breadcrumb
//                     && breadcrumb.map(
//                         (item, index) =>
//                             item.path && index !== breadcrumb.length - 1 ?
//                                 <Link
//                                     key={index}
//                                     to={{
//                                         ...this.props.location,
//                                         pathname: item.path,
//                                     }}
//                                     state = {{displayType: (this.props.location.state && (this.props.location.state as IRouterLocationState).displayType) ? (this.props.location.state as IRouterLocationState).displayType : DisplayType.Grid}}
//                                     title={item.name}
//                                     className={stylesButtons.button_transparency}
//                                 >
//                                     {item.name}
//                                 </Link>
//                             :
//                                 <strong key={index}>
//                                     {item.name}
//                                 </strong>,
//                     )
//                 }
//             </div>
//         );
//     }
// }

// const mapStateToProps = (state: ILibraryRootState) => ({
//     location: state.router.location,
// });


const Breadcrumb: React.FC<IBaseProps> = ({ breadcrumb, className }) => {
    const __ = useTranslator();
    const location = useSelector((state: ILibraryRootState) => state.router.location);

    const renderBreadcrumbItem = (item: { name: string; path?: string }, index: number) => {
        const isLastItem = index === breadcrumb.length - 1;

        if (item.path && !isLastItem) {
            return (
            <Link
                key={index}
                to={{
                ...location,
                pathname: item.path,
                }}
                state={{
                displayType: (location.state && (location.state as IRouterLocationState).displayType) ? (location.state as IRouterLocationState).displayType : DisplayType.Grid,
                }}
                title={item.name}
                className={stylesButtons.button_transparency}
            >
                {item.name}
            </Link>
            );
        }

        return (
            <strong key={index}>
            {item.name}
            </strong>
        );
    };

    const renderBackLink = () => {
        if (breadcrumb.length >= 2) {
            return (
            <Link
                to={{
                ...location,
                pathname: breadcrumb[breadcrumb.length - 2].path,
                }}
                state={{
                displayType: (location.state && (location.state as IRouterLocationState).displayType) ? (location.state as IRouterLocationState).displayType : DisplayType.Grid,
                }}
                title={__("opds.back")}
                className={stylesButtons.button_transparency_icon}
            >
                <SVG ariaHidden={true} svg={ArrowIcon} />
            </Link>
            );
        }

        return null;
    };

    return (
        <div className={classNames(stylesBreadcrumb.breadcrumb, className)}>
            {renderBackLink()}
            {breadcrumb.map((item, index) => renderBreadcrumbItem(item, index))}
        </div>
    );
};

export default Breadcrumb;
