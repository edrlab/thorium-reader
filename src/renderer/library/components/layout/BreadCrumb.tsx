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
import useResizeObserver from '@react-hook/resize-observer';

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

function useSize<T extends Element>(target: React.RefObject<T>) {
    const [size, setSize] = React.useState(undefined);

    React.useLayoutEffect(() => {
        setSize(target.current.getBoundingClientRect())
    }, [target])

    // Where the magic happens
    useResizeObserver(target, (entry) => setSize(entry.contentRect))
    return size
}

const BreadCrumbComponent: React.FC<IProps> = (props) => {
    const { breadcrumb } = props;
    const breadcrumbRefs = React.useRef([]);
    const prevNbBreadcrumbs = React.useRef(0);
    const [ i, setI ] = React.useState(0);
    const target = React.useRef(null);
    const size = useSize(target)?.width;
    const prevWidth = React.useRef(size?.width);

    const [breadcrumbsArray, setBreadcrumbsArray] = React.useState([]);
    let newBreadcrumbsArray: IBreadCrumbItem[];

    React.useEffect(() => {
        newBreadcrumbsArray = [...breadcrumb].slice(i);
        const item = newBreadcrumbsArray.shift();
        console.log("item", item);
        console.log("test")
    }, []);

    console.log("i before effect", i);

    React.useEffect(() => {
        console.log("###### useEffect #######");
        console.log("size", size);
        console.log("initial i", i);
        console.log("prevWidth.current", prevWidth.current);

        if (size === 0 && prevWidth.current === 0) {
            if (i <= breadcrumb.length - 1) {
                setI(i + 1);
            } 
        } else if (prevWidth.current !== size) {
            if (size < 50) {
                if (i <= breadcrumb.length - 1) {
                    setI(i + 1);
                }
            } else if (size > 250) {
                if (i >= 1) {
                    setI(i - 1)
                } else {
                    setI(0);
                }
            }
        } else if (breadcrumbsArray.length < prevNbBreadcrumbs.current) {
            const diff = prevNbBreadcrumbs.current - breadcrumbsArray.length;
            if (diff > i) {
                setI(0)
            } else {
                setI(i - diff);
            }
        }
        if (breadcrumb.length > 4) {
            newBreadcrumbsArray = [...breadcrumb].slice(i + 1);
        } else {
            newBreadcrumbsArray = [...breadcrumb].slice(i);
        }
        if (i === 0) {
            const item = newBreadcrumbsArray?.shift();
            console.log("item", item);
        }

        prevWidth.current = size;
        prevNbBreadcrumbs.current = breadcrumbsArray.length;
        setBreadcrumbsArray(newBreadcrumbsArray);
        console.log("array", newBreadcrumbsArray);
        console.log("i end effect",i);
    }, [breadcrumb, size]);


    const brdcrmb = breadcrumbsArray?.map(
        (item, index) =>
            item.path && index !== breadcrumbsArray.length - 1 ?
                <li key={index} ref={el => breadcrumbRefs.current[index + 1] = el}>
                    <Link
                        key={index}
                        to={{
                            ...props.location,
                            pathname: item?.path,
                        }}
                        state={{ displayType: (props.location.state && (props.location.state as IRouterLocationState).displayType) ? (props.location.state as IRouterLocationState).displayType : DisplayType.Grid }}
                        title={item.name}
                        className={stylesButtons.button_transparency}
                        ref={el => breadcrumbRefs.current[index + 1] = el}
                        style={{maxWidth: "200px"}}
                    >
                        <p title={item.name}>{item.name}</p>
                    </Link>
                    <SVG ariaHidden svg={ChevronRight} />
                </li>
                :
                <strong key={index} title={item.name} id="currentBreadcrumb" className={size < 50 ? stylesBreadcrumb.strongBreadcrumb : ""}>
                    {item.name}
                </strong>,
    );

    return (
        <>
        <ul className={classNames(stylesBreadcrumb.breadcrumb, props.className)} id="breadcrumb_container" style={{display: "flex", flexWrap: "nowrap", flex: "2"}}>
            {
                breadcrumb?.length
                    ?
                        <>
                        <li>
                            <Link
                                to={{
                                    ...props.location,
                                    pathname: breadcrumb[0]?.path,
                                }}
                                    state={{ displayType: (props.location.state && (props.location.state as IRouterLocationState).displayType) ? (props.location.state as IRouterLocationState).displayType : DisplayType.Grid }}
                                    title={breadcrumb[0].name}
                                    className={stylesButtons.button_transparency}
                                    ref={el => breadcrumbRefs.current[0] = el}
                                >
                                    <SVG ariaHidden={true} svg={BreacrmbsNavIcon} />
                                    {breadcrumb.length < 5 ?
                                        <p>{breadcrumb[0].name}</p>
                                        : <></>
                                    }
                                </Link>
                                <SVG ariaHidden svg={ChevronRight} />
                            </li>
                            { breadcrumb.length > 4 ?
                                <li>
                                    <Link
                                        to={{
                                            ...props.location,
                                            pathname: breadcrumb[i + 1]?.path,
                                        }}
                                        state={{ displayType: (props.location.state && (props.location.state as IRouterLocationState).displayType) ? (props.location.state as IRouterLocationState).displayType : DisplayType.Grid }}
                                        title={breadcrumb[i + 1]?.name}
                                        className={stylesButtons.button_transparency}
                                        ref={el => breadcrumbRefs.current[i + 1] = el}
                                    >
                                        <p>...</p>
                                    </Link>
                                    <SVG ariaHidden svg={ChevronRight} />
                                </li>
                                : <></>
                            }
                            {brdcrmb}
                        </>
                        : <></>
            }
        </ul>
        <span id="spaceLeft" className="spaceLeft" ref={target}></span>
        </>

    );
};

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
});

export default connect(mapStateToProps)(withTranslator(BreadCrumbComponent));
