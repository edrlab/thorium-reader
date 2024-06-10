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
import useResizeObserver from "@react-hook/resize-observer";
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
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {}

function useSize<T extends Element>(target: React.RefObject<T>) {
    const [size, setSize] = React.useState<DOMRect | undefined>(undefined);

    React.useLayoutEffect(() => {
        if (target.current) {
            const sizeUpdate = () => {
                setSize(target.current.getBoundingClientRect());
            };
            debounce(sizeUpdate, 400);
        }
    }, [target]);

    useResizeObserver(target, (entry) => setSize(entry.contentRect));
    return size;
}

const BreadCrumbComponent: React.FC<IProps> = (props) => {
    const { breadcrumb } = props;
    const breadcrumbRefs = React.useRef<(HTMLAnchorElement | HTMLLIElement)[]>([]);
    const prevNbBreadcrumbs = React.useRef(0);
    const [i, setI] = React.useState(0);
    const target = React.useRef<HTMLSpanElement>(null);
    const size = useSize(target)?.width;
    const prevWidth = React.useRef(size);

    const [breadcrumbsArray, setBreadcrumbsArray] = React.useState<IBreadCrumbItem[]>([]);

    React.useEffect(() => {
        const newBreadcrumbsArray = breadcrumb.slice(i);
        const item = newBreadcrumbsArray.shift();
        console.log("item", item);
        setTimeout(() => {
            setBreadcrumbsArray(newBreadcrumbsArray);
        }, 50);
    }, [breadcrumb, i]);

    React.useLayoutEffect(() => {
        if (size !== undefined && prevWidth.current !== size) {
            if (size < 5 && i < breadcrumb.length - 1) {
                setI(i + 1);
            } else if (size > 350 && i > 0) {
                setI(i - 1);
            }
        }
        prevWidth.current = size;
        prevNbBreadcrumbs.current = breadcrumbsArray.length;
    }, [size, breadcrumb.length, i, breadcrumbsArray.length]);

    // if (size !== undefined && prevWidth.current !== size) {
    //     if (size < 5 && i < breadcrumb.length - 1) {
    //         setI(i + 1);
    //     } else if (size > 250 && i > 0) {
    //         setI(i - 1);
    //     }
    // }
    // prevWidth.current = size;
    // prevNbBreadcrumbs.current = breadcrumbsArray.length;
    // console.log("size", size);

    const renderBreadcrumbs = () => {
        return breadcrumbsArray.map((item, index) => (
            item.path && index !== breadcrumbsArray.length - 1 ? (
                <li key={index} ref={el => breadcrumbRefs.current[index + 1] = el}>
                    <Link
                        to={{
                            ...props.location,
                            pathname: item.path,
                        }}
                        state={{ displayType: (props.location.state as IRouterLocationState)?.displayType || DisplayType.Grid }}
                        title={item.name}
                        className={stylesButtons.button_transparency}
                        style={{ maxWidth: "200px" }}
                    >
                        <p title={item.name}>{item.name}</p>
                    </Link>
                    <SVG ariaHidden svg={ChevronRight} />
                </li>
            ) : (
                <strong key={index} title={item.name} id="currentBreadcrumb" className={stylesBreadcrumb.strongBreadcrumb}>
                    {item.name}
                </strong>
            )
        ));
    };

    return (
        <>
            <ul className={classNames(stylesBreadcrumb.breadcrumb, props.className)} id="breadcrumb_container" style={{ display: "flex", flexWrap: "nowrap", flex: "2" }}>
                {breadcrumb.length > 0 && (
                    <>
                        <li>
                            <Link
                                to={{
                                    ...props.location,
                                    pathname: breadcrumb[0]?.path,
                                }}
                                state={{ displayType: (props.location.state as IRouterLocationState)?.displayType || DisplayType.Grid }}
                                title={breadcrumb[0].name}
                                className={stylesButtons.button_transparency}
                                ref={el => breadcrumbRefs.current[0] = el}
                            >
                                <SVG ariaHidden={true} svg={BreacrmbsNavIcon} />
                                {breadcrumb.length < 5 && <p>{breadcrumb[0].name}</p>}
                            </Link>
                            <SVG ariaHidden svg={ChevronRight} />
                        </li>
                        {breadcrumb.length > 4 && i > 0 ? 
                            <li>
                                <Link
                                    to={{
                                        ...props.location,
                                        pathname: breadcrumb[i]?.path,
                                    }}
                                    state={{ displayType: (props.location.state as IRouterLocationState)?.displayType || DisplayType.Grid }}
                                    title={breadcrumb[i]?.name}
                                    className={stylesButtons.button_transparency}
                                    ref={el => breadcrumbRefs.current[i] = el}
                                >
                                    <p>...</p>
                                </Link>
                                <SVG ariaHidden svg={ChevronRight} />
                            </li>
                        : <></>}
                        {renderBreadcrumbs()}
                    </>
                )}
            </ul>
            <span id="spaceLeft" className="spaceLeft" ref={target}></span>
        </>
    );
};

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
});

export default connect(mapStateToProps)(withTranslator(BreadCrumbComponent));
