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
        setSize(target.current.getBoundingClientRect());
    }, [target]);

    const handler = React.useCallback(debounce((entry) => setSize(entry.contentRect), 500), [setSize, debounce])

    useResizeObserver(target, handler);
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
}

const ChevronRightBreadCrumb = () => <SVG ariaHidden svg={ChevronRight} />;

const firstItemSize = (textLength: number) => 15 + 20 + 5 + 7 * textLength + 15 + 20;
const breadcrumbLayoutSize = (firstOne: IBreadCrumbItem, between: IBreadCrumbItem[], lastOne: IBreadCrumbItem) => {

    let sizeFootprint = 0;
    sizeFootprint += firstItemSize(firstOne.name.length);
    for (const el of between) {
        sizeFootprint += 15 + 7 * el.name.length + 15 + 20;
    }
    sizeFootprint += 10 + 8 * lastOne.name.length + 10;

    return sizeFootprint;
}

const BreadCrumb = () => {

    const spanLeft = React.useRef<HTMLSpanElement>(null);
    const container = React.useRef<HTMLDivElement>(null);
    const spaceLeftSize = useSize(spanLeft);
    const containerSize = useSize(container);
    const spaceLeftWidth = Math.floor(spaceLeftSize?.width || -1);
    const containerWidth = Math.floor(containerSize?.width || -1);
    const breadCrumbData = useSelector((state: ILibraryRootState) => state.opds.browser.breadcrumb);
    const firstOne = {...(breadCrumbData.at(0) || {name: "", path: ""})};
    const lastOne = {...(breadCrumbData.at(-1) || {name: "", path: ""})};
    const between = [...(breadCrumbData.slice(1, -1) || [])];

    do {
        const sizeFootprint = breadcrumbLayoutSize(firstOne, between, lastOne);
        if (sizeFootprint > containerWidth) {
            between.shift();
        } else {
            break;
        }
    } while (between.length);

    if (!between.length && spaceLeftWidth === 4/*min-width*/) {
        lastOne.name = lastOne.name.slice(0,
            Math.round((containerWidth - (firstItemSize(firstOne.name.length) + 30/*offset*/) - 3/*...*/) / 8/*fontsize*/)
        ) + '...';
    }

    // console.log("RENDER");
    return (
        <div id="breadcrumb-div-container" style={{
            width: "100%",
            containerType: "inline-size",
            containerName: "spaceLeft",
            display: "flex",
            alignItems: "center"
        }} ref={container}>
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
                                <LinkItemBreadcrumb item={item} />
                                <ChevronRightBreadCrumb />
                            </li>
                        );
                    })
                }
                {
                    <li key={between.length+1} id="breadcrumb-li-lastone">
                        <strong title={lastOne.name}>{lastOne.name}</strong>
                    </li>
                }
            </ul>
            <span id="spaceLeft" className="spaceLeft" ref={spanLeft} aria-hidden></span>
        </div>
    );
}


export default BreadCrumb;