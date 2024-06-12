// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Link } from "react-router-dom";
import * as BreacrmbsNavIcon from "readium-desktop/renderer/assets/icons/breadcrumbsNav-icon.svg";
import * as ChevronRight from "readium-desktop/renderer/assets/icons/chevron-right.svg";
import * as stylesBreadcrumb from "readium-desktop/renderer/assets/styles/components/breadcrumb.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { IBreadCrumbItem } from "readium-desktop/common/redux/states/renderer/breadcrumbItem";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { DisplayType, IRouterLocationState } from "../../routing";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import useResizeObserver from "@react-hook/resize-observer";
import debounce from "debounce";

function useSize<T extends Element>(target: React.RefObject<T>) {
    const [size, setSize] = React.useState<DOMRect | undefined>(undefined);

    React.useLayoutEffect(() => {
        target.current && setSize(target.current.getBoundingClientRect());
        // TODO: "destructor" needed?
        // return () => {
        //     setSize(undefined);
        // };
    }, [target]);

    // UseResizeObserverCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handler = React.useCallback(debounce((entry: ResizeObserverEntry, _observer: ResizeObserver) => setSize(entry.contentRect), 500), [setSize]);
    // const handler = React.useCallback((entry: ResizeObserverEntry, _observer: ResizeObserver) => setSize(entry.contentRect), [setSize]);
    useResizeObserver(target, handler);
    // useResizeObserver(target, (entry: ResizeObserverEntry, _observer: ResizeObserver) => setSize(entry.contentRect));

    return size;
}

const LinkItemBreadcrumb = ({item: {name, path}, isTheFirstOne}: {item: IBreadCrumbItem, isTheFirstOne?: boolean}) => {

    const location = useSelector((state: ILibraryRootState) => state.router.location);

    return (<Link
        to={{
            ...location,
            pathname: path,
        }}
        state={{ displayType: (location.state && (location.state as IRouterLocationState).displayType) ? (location.state as IRouterLocationState).displayType : DisplayType.Grid }}
        title={name}
        className={stylesButtons.button_transparency}
    >
        {isTheFirstOne ? <SVG ariaHidden={true} svg={BreacrmbsNavIcon} /> : <></>}
        <p >{name}</p>
    </Link>);
};

const ChevronRightBreadCrumb = () => <SVG ariaHidden svg={ChevronRight} />;

// TODO: more magic hard-coded numbers here! (CSS values?)
const firstItemSize = (textLength: number) => 15 + 20 + 5 + 7 * textLength + 15 + 20;
const breadcrumbLayoutSize = (firstOne: IBreadCrumbItem, between: IBreadCrumbItem[], lastOne: IBreadCrumbItem) => {

    let sizeFootprint = 0;
    sizeFootprint += firstItemSize(firstOne.name.length);
    for (const el of between) {
        sizeFootprint += 15 + 7 * el.name.length + 15 + 20;
    }
    sizeFootprint += 10 + 8 * lastOne.name.length + 10;

    return sizeFootprint;
};

const BreadCrumb = () => {

    const spanLeft = React.useRef<HTMLSpanElement>(null);
    const container = React.useRef<HTMLDivElement>(null);

    const [displayFullBreadcrumb, setDisplayFullBreadcrumb] = React.useState(false);

    const containerSize = useSize(container);
    const containerWidth = Math.floor(containerSize?.width || -1);

    const breadCrumbData = useSelector((state: ILibraryRootState) => state.opds.browser.breadcrumb);

    const firstOne = {...(breadCrumbData.at(0) || {name: "", path: ""})};
    // const lastOneFromBreadcrumbData = () => ({...(breadCrumbData.at(-1) || {name: "", path: ""})});
    const lastOneFromBreadcrumbData = {...(breadCrumbData.at(-1) || {name: "", path: ""})};

    const [lastOne, setLastOne] = React.useState(lastOneFromBreadcrumbData);

    // React.useEffect(() => {
    //     if (lastOne.name !== lastOneFromBreadcrumbData.name || lastOne.path !== lastOneFromBreadcrumbData.path) {
    //         setLastOne({
    //             name: lastOneFromBreadcrumbData.name,
    //             path: lastOneFromBreadcrumbData.path,
    //         });
    //     }
    // },
    // [lastOne.name, lastOne.path, lastOneFromBreadcrumbData.name, lastOneFromBreadcrumbData.path]);

    const between = breadCrumbData.length > 2 ? [...(breadCrumbData.slice(1, -1) || [])] : [];
    let someBetweenWereRemoved = false;
    // skip trim logic before initial useLayoutEffect or first resize observer
    if (containerWidth > 0 && between.length && !displayFullBreadcrumb) {
        do {
            const sizeFootprint = breadcrumbLayoutSize(firstOne, between, lastOne);
            if (sizeFootprint > containerWidth) {
                between.shift();
                someBetweenWereRemoved = true;
            } else {
                break;
            }
        } while (between.length);

        if (someBetweenWereRemoved) {
            between.unshift({name: "...", path: ""});
        }
    }

    const theOnlyBetweenIsDotDotDot = between.length === 1 && between[0].name === "..." && between[0].path === "";

    React.useEffect(() => {
        if (displayFullBreadcrumb) {
            if (lastOne.name !== lastOneFromBreadcrumbData.name || lastOne.path !== lastOneFromBreadcrumbData.path) {
                setLastOne({
                    name: lastOneFromBreadcrumbData.name,
                    path: lastOneFromBreadcrumbData.path,
                });
            }
            return;
        }
        const spaceLeftWidth = Math.floor(spanLeft.current?.clientWidth || -1);
        // const spaceLeftWidth = spanLeft.current?.clientWidth || -1;

        // console.log(spaceLeftWidth, spanLeft.current?.clientWidth, containerWidth, between.length, firstOne.name.length, lastOne.name, lastOneFromBreadcrumbData.name);

        if (between.length && !theOnlyBetweenIsDotDotDot) {
            if (lastOne.name !== lastOneFromBreadcrumbData.name || lastOne.path !== lastOneFromBreadcrumbData.path) {
                setLastOne({
                    name: lastOneFromBreadcrumbData.name,
                    path: lastOneFromBreadcrumbData.path,
                });
            }
        } else if (!between.length || theOnlyBetweenIsDotDotDot) {
            const name = lastOneFromBreadcrumbData.name.slice(0,
                // TODO: logic based on hard-coded CSS values is super britle! (also, font metrics multiplier is unreliable, just an approximation)
                Math.round((containerWidth - (firstItemSize(firstOne.name.length) + 30/*offset*/) - 3/*...*/ - (theOnlyBetweenIsDotDotDot ? (12 + 20) : 0)) / 8/*fontsize*/),
            ) + "...";
            if (spaceLeftWidth <= 4) {
                if (lastOne.name !== name) {
                    setLastOne({
                        name,
                        path: lastOne.path,
                    });
                }
            } else {
                if (lastOne.name !== name && lastOne.name !== lastOneFromBreadcrumbData.name || lastOne.path !== lastOneFromBreadcrumbData.path) {
                    setLastOne({
                        name: lastOneFromBreadcrumbData.name,
                        path: lastOneFromBreadcrumbData.path,
                    });
                }
            }
        }
    }, [theOnlyBetweenIsDotDotDot, displayFullBreadcrumb, spanLeft.current?.clientWidth, containerWidth, between.length, firstOne.name.length, lastOne.name, lastOne.path, lastOneFromBreadcrumbData.name, lastOneFromBreadcrumbData.path]);

    // console.log("RENDER");
    return (
        <div id="breadcrumb-div-container" style={{
            width: "100%",
            containerType: "inline-size",
            containerName: "spaceLeft",
            display: "flex",
            alignItems: "center",
            overflowY: "hidden",
            overflowX: displayFullBreadcrumb ? "auto" : "hidden",
        }} ref={container} className={stylesBreadcrumb.breadcrumb_container}>
            <ul className={stylesBreadcrumb.breadcrumb}>
                {
                    <li key={0} className={"breadcrumb-li-item"}>
                        <LinkItemBreadcrumb item={firstOne} isTheFirstOne />
                        <ChevronRightBreadCrumb />
                    </li>
                }
                {
                    between.map((item, index) => {
                        return (
                            <li key={index+1} className={"breadcrumb-li-item"}>
                                {
                                    (!displayFullBreadcrumb && item.name === "..." && item.path === "") ?
                                    (<button onClick={() => { setDisplayFullBreadcrumb(true); }}>...</button>) :
                                    (<LinkItemBreadcrumb item={item} />)
                                }
                                <ChevronRightBreadCrumb />
                            </li>
                        );
                    })
                }
                {
                    <li key={between.length+1} id="breadcrumb-li-lastone">
                        <strong title={lastOneFromBreadcrumbData.name}>{lastOne.name}</strong>
                    </li>
                }
                {
                    // displayFullBreadcrumb && 
                    // (<li key={between.length+2} id="breadcrumb-li-plus">
                    //     <button onClick={() => {
                    //         setDisplayFullBreadcrumb(false);
                    //     }}>...</button>
                    // </li>)
                }
            </ul>
            <span id="spaceLeft" className="spaceLeft" ref={spanLeft} aria-hidden></span>
        </div>
    );
};


export default BreadCrumb;
