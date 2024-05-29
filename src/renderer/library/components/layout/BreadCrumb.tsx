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
import debounce from "debounce";

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

const BreadCrumbComponent: React.FC<IProps> = (props) => {
    const { breadcrumb } = props;
    const breadcrumbRefs = React.useRef([]);
    const [ breadcrumbWidth, setBreadcrumbWidth ] = React.useState("fit-content");


    React.useEffect(() => {

        const cb = () => {
            const body = document.getElementById("breadcrumb_container") as HTMLDivElement;
            const bodyWidth = body?.offsetWidth;
            const nbBreadcrumbs = breadcrumb.length;
            if (!bodyWidth || !breadcrumb || breadcrumb.length === 0) {
                return;
              }

            breadcrumbRefs.current = breadcrumbRefs.current.slice(0, breadcrumb.length);
            let totalWidth: number = 0;
        
            breadcrumbRefs.current.forEach(ref => {
                if (ref) {
                    totalWidth = totalWidth + (ref.offsetWidth + 20);
                    console.log("ref offset",ref.offsetWidth);
                    console.log("total width", totalWidth);
                    console.log("body width", bodyWidth);

                    const leftWidth = Math.floor(bodyWidth - totalWidth);
                    console.log("left width", leftWidth);
                    if (leftWidth < 70) {
                        setBreadcrumbWidth("50px");
                    } else if (leftWidth < ref.offsetWidth) {
                        setBreadcrumbWidth("110px");
 
                    } else {
                        setBreadcrumbWidth("fit-content");
                    }
                }
            });
            console.log("nb:",nbBreadcrumbs);
        };
        cb();

        const cdDebounce = debounce(cb, 500);

        window.addEventListener("resize", cdDebounce);
        
        return () => {
            window.removeEventListener("resize", cdDebounce);
        };
    }, [breadcrumb]);

    return (
        <div className={classNames(stylesBreadcrumb.breadcrumb, props.className)} id="breadcrumb_container">
            {
                breadcrumb
                    ?
                        <>
                            <Link
                                to={{
                                    ...props.location,
                                    pathname: breadcrumb[0].path,
                                }}
                                state={{ displayType: (props.location.state && (props.location.state as IRouterLocationState).displayType) ? (props.location.state as IRouterLocationState).displayType : DisplayType.Grid }}
                                title={breadcrumb[0].name}
                                className={stylesButtons.button_transparency}
                                ref={el => breadcrumbRefs.current[0] = el}
                            >
                                <SVG ariaHidden={true} svg={BreacrmbsNavIcon} />
                                <p>{breadcrumb[0].name}</p>
                            </Link>
                            <SVG ariaHidden svg={ChevronRight} />
                            {
                                breadcrumb.slice(1).map(
                                    (item, index) =>
                                        item.path && index !== breadcrumb.length - 2 ?
                                            <React.Fragment key={index}>
                                                <Link
                                                    key={index}
                                                    to={{
                                                        ...props.location,
                                                        pathname: item.path,
                                                    }}
                                                    state={{ displayType: (props.location.state && (props.location.state as IRouterLocationState).displayType) ? (props.location.state as IRouterLocationState).displayType : DisplayType.Grid }}
                                                    title={item.name}
                                                    className={stylesButtons.button_transparency}
                                                    style={{width: breadcrumbWidth}}
                                                    ref={el => breadcrumbRefs.current[index + 1] = el}
                                                >
                                                    <p title={item.name}>{item.name}</p>
                                                </Link>
                                                <SVG ariaHidden svg={ChevronRight} />
                                            </React.Fragment>
                                            :
                                            <strong key={index} title={item.name} ref={el => breadcrumbRefs.current[index + 1] = el}>
                                                {item.name}
                                            </strong>,
                                )}
                        </>
                    : <></>
            }
        </div>
    )
}

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
});

export default connect(mapStateToProps)(withTranslator(BreadCrumbComponent));
