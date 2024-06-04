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

const BreadCrumbComponent: React.FC<IProps> = (props) => {
    const { breadcrumb } = props;
    const breadcrumbRefs = React.useRef([]);
    const [ i, setI ] = React.useState(1);
    // const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
    const brdcrmb = breadcrumb.slice(1).map(
        (item, index) =>
            item.path && index !== breadcrumb.length - 2 ?
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
                    >
                        <p title={item.name}>{item?.name}</p>
                    </Link>
                    <SVG ariaHidden svg={ChevronRight} />
                </li>
                :
                <strong key={index} title={item.name} ref={el => breadcrumbRefs.current[index + 1] = el} id="currentBreadcrumb">
                    {item.name}
                </strong>,
    );

    const spaceLeft = document.getElementById("spaceLeft");
    const prevNbBreadcrumbs = React.useRef(0);

    React.useEffect(() => {
        const spaceLeft = document.getElementById("spaceLeft");
        const strong = document.getElementById("currentBreadcrumb");
        const remainingWidth = spaceLeft.offsetWidth;
        console.log("######");
        console.log("remaing width", remainingWidth);
        console.log("breadcrumb", breadcrumb);
        console.log("new nb of breadcrumbs", breadcrumb.length);
        if (breadcrumb.length !== prevNbBreadcrumbs.current) {
            // Si différent, mettre à jour le useRef avec la nouvelle valeur
            // prevNbBreadcrumbs.current = breadcrumb.length;
            console.log("prevNbBreadcrumbs.current", prevNbBreadcrumbs.current);

            // Ici vous pouvez utiliser nbBreadcrumbs et prevNbBreadcrumbs.current
            // pour comparer les valeurs avant et après le rendu
            if (breadcrumb.length < prevNbBreadcrumbs.current) {
              // Nouvelle valeur plus petite que l'ancienne
              console.log("un de moins");
                setI(i-1);
                if (i === -1) {
                    setI(0);
                }
                console.log("i", i);
                const currentRef = breadcrumbRefs.current[i];
                if (currentRef) {
                    const currentElement = currentRef as HTMLLIElement;
                    console.log("current", currentElement);
                    currentElement.classList.remove(stylesBreadcrumb.hide);
                    spaceLeft.classList.remove(stylesBreadcrumb.small);
                }
            } else {
              // Nouvelle valeur plus grande que l'ancienne  
              console.log("un de plus");
              if (remainingWidth < 20) {
                setI(i+1);
                spaceLeft.classList.add(stylesBreadcrumb.small);
                const currentRef = breadcrumbRefs.current[i + 1];
                strong.style.overflow = "hidden";
                strong.style.textOverflow = "ellipsis";
                if (currentRef) {
                    const currentElement = currentRef as HTMLLIElement;
                    currentElement.classList.add(stylesBreadcrumb.hide);
                }
            } else {
                strong.style.overflow = "unset";
                strong.style.textOverflow = "unset";
            }
            }
            prevNbBreadcrumbs.current = breadcrumb.length;
          }
            }, [breadcrumb, spaceLeft]);

    return (
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
                        <li className={stylesBreadcrumb.hiddenBreadcrumb}>
                            <Link
                                to={{
                                    ...props.location,
                                    pathname: breadcrumb[i]?.path,
                                }}
                                state={{ displayType: (props.location.state && (props.location.state as IRouterLocationState).displayType) ? (props.location.state as IRouterLocationState).displayType : DisplayType.Grid }}
                                title={breadcrumb[i]?.name}
                                className={stylesButtons.button_transparency}
                                ref={el => breadcrumbRefs.current[i] = el}
                            >
                                <p>...</p>
                            </Link>
                            <SVG ariaHidden svg={ChevronRight} />
                        </li>
                            {brdcrmb}
                        </>
                    : <></>
            }
        </ul>
    );
};

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
});

export default connect(mapStateToProps)(withTranslator(BreadCrumbComponent));
