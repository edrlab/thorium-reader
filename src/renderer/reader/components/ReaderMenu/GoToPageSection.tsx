// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesPopoverDialog from "readium-desktop/renderer/assets/styles/components/popoverDialog.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.scss";
import classNames from "classnames";
import * as React from "react";

import SVG from "readium-desktop/renderer/common/components/SVG";

import * as BookOpenIcon from "readium-desktop/renderer/assets/icons/bookOpen-icon.svg";
import * as TargetIcon from "readium-desktop/renderer/assets/icons/target-icon.svg";
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";

import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useReaderConfig } from "readium-desktop/renderer/common/hooks/useReaderConfig";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";

import { trimNormaliseWhitespaceAndCollapse } from "readium-desktop/common/string";
import { IReaderMenuProps } from "../options-values";
import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";


// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends IReaderMenuProps {
    // focusNaviguationMenu: () => void;
    currentLocation: MiniLocatorExtended;
    isDivina: boolean;
    isPdf: boolean;
    isAudiobook: boolean;
    pdfNumberOfPages: number;
    // handleMenuClick: (open: boolean) => void;
}

export const GoToPageSection: React.FC<IBaseProps & { totalPages?: number }> = (props) => {

    const { handleLinkClick, isDivina, isPdf, currentLocation, totalPages: totalPagesFromProps, goToLocator } = props;
    const r2Publication = useSelector((state: IReaderRootState) => state.reader.info.r2Publication);
    const dockingMode = useReaderConfig("readerDockingMode");
    const dockedMode = dockingMode !== "full";
    let totalPages = `${totalPagesFromProps}`;
    const goToRef = React.useRef<HTMLInputElement>();

    const [refreshError, setRefreshError] = React.useState(false);
    const [pageError, setPageError] = React.useState(false);

    const [__] = useTranslator();

    React.useEffect(() => {
        if (refreshError) {
            if (pageError) {
                setPageError(false);
            } else {
                setPageError(true);
                setRefreshError(false);
            }
        }

    }, [refreshError, pageError]);

    const handleSubmitPage = (closeNavPanel = true) => {
        if (!goToRef?.current?.value) {
            return;
        }

        // this.props.currentLocation.docInfo.isFixedLayout
        const isFixedLayoutPublication = !r2Publication.PageList &&
            r2Publication.Metadata?.Rendition?.Layout === "fixed";

        const pageNbr = trimNormaliseWhitespaceAndCollapse(goToRef.current.value);
        if (isFixedLayoutPublication) {
            try {
                const spineIndex = parseInt(pageNbr, 10) - 1;
                const spineLink = r2Publication.Spine[spineIndex];
                if (spineLink) {
                    setPageError(false);
                    handleLinkClick(undefined, spineLink.Href, closeNavPanel);
                    return;
                }
            } catch (_e) {
                // ignore error
            }

            setRefreshError(true);
        } else if (isDivina || isPdf) {
            let page: number | undefined;

            if (isDivina) {
                // try {
                //     page = parseInt(pageNbr, 10) - 1;
                // } catch (_e) {
                //     // ignore error
                // }

                if (typeof page !== "undefined" && page >= 0 &&
                    r2Publication.Spine && r2Publication.Spine[page]) {

                    setPageError(false);

                    // handleLinkClick(undefined, pageNbr);
                    const loc = {
                        href: (page || pageNbr).toString(),
                        // progression generate in divina pagechange event
                    };
                    goToLocator(loc as any, closeNavPanel);

                    return;
                }
            } else if (isPdf) {
                const nPages = r2Publication.Metadata?.NumberOfPages || 1;
                let pageStr = "";
                try {
                    const n = parseInt(pageNbr, 10);
                    if (Number.isInteger(n)) { // NaN
                        if (n >= 1 && n <= nPages) {
                            pageStr = String(n);
                        }
                    }
                } catch (_e) {
                }
                if (pageStr) {
                    setPageError(false);

                    const loc = {
                        href: pageStr,
                        locations: { progression: 1 },
                    };
                    goToLocator(loc, closeNavPanel);

                    return;
                }
            }

            setRefreshError(true);
        } else {
            const foundPage = r2Publication.PageList ?
                r2Publication.PageList.find((page) => page.Title === pageNbr) :
                undefined;
            if (foundPage) {
                setPageError(false);
                handleLinkClick(undefined, foundPage.Href, closeNavPanel);

                return;
            }

            setRefreshError(true);
        }
    };

    // TODO enable Divina??
    if (!r2Publication || isDivina) {
        return <></>;
    }

    // // currentLocation.docInfo.isFixedLayout
    const isFixedLayoutPublication = r2Publication.Metadata?.Rendition?.Layout === "fixed";
    const isFixedLayoutWithPageList = isFixedLayoutPublication && r2Publication.PageList;
    const isFixedLayoutNoPageList = isFixedLayoutPublication && !!r2Publication.PageList;

    let currentPageInPageList: string | undefined;
    if (currentLocation?.epubPageID && r2Publication.PageList) {
        const p = r2Publication.PageList.find((page) => {
            return page.Title && page.Href && page.Href.endsWith(`#${currentLocation.epubPageID}`);
        });
        if (p) {
            currentPageInPageList = p.Title;
        }
    }

    let currentPage: string | undefined;
    if (isDivina || isPdf) {
        currentPage = isDivina
            ? `${currentLocation?.locator.locations.position}`
            : currentLocation?.locator?.href;
    } else if (currentLocation?.epubPage) {
        const epubPageIsEmpty = currentLocation.epubPage.trim().length === 0;
        if (epubPageIsEmpty && currentPageInPageList) {
            currentPage = currentPageInPageList;
        } else if (!epubPageIsEmpty) {
            currentPage = currentLocation.epubPage;
        }
    }

    if (isFixedLayoutWithPageList && !currentPage && currentLocation?.locator?.href) {
        const page = r2Publication.PageList.find((l) => {
            return l.Href === currentLocation.locator.href;
        });
        if (page) {
            currentPage = page.Title;
            if (currentPage) {
                totalPages = r2Publication.PageList.length.toString();
            }
        }
    } else if (isFixedLayoutNoPageList &&
        currentLocation?.locator?.href &&
        r2Publication.Spine) {
        const spineIndex = r2Publication.Spine.findIndex((l) => {
            return l.Href === currentLocation.locator.href;
        });
        if (spineIndex >= 0) {
            currentPage = (spineIndex + 1).toString();
            totalPages = r2Publication.Spine.length.toString();
        }
    } else if (currentPage) {
        if (isDivina) {
            try {
                const p = parseInt(currentPage, 10) + 1;
                currentPage = p.toString();
            } catch (_e) {
                // ignore
            }
        } else if (isPdf) {
            currentPage = currentPage;
        }
    }

    let options: { id: number; name: string; value: string; }[];

    if (isFixedLayoutNoPageList) {
        options = r2Publication.Spine.map((_spineLink, idx) => {
            const indexStr = (idx + 1).toString();
            return (
                {
                    id: idx + 1,
                    name: indexStr,
                    value: indexStr,
                }
            );
        });
    } else if (r2Publication?.PageList) {
        options = r2Publication.PageList.map((pageLink, idx) => {
            return (
                pageLink.Title ?
                    {
                        id: idx + 1,
                        name: pageLink.Title,
                        value: pageLink.Title,
                    }
                    : null
            );
        }).filter((i)=>!!i);
    } else if (isPdf) {
        options = Array.from({ length: r2Publication.Metadata?.NumberOfPages || 1 }, (_v, idx) => {
            const indexStr = (idx + 1).toString();
            return (
                {
                    id: idx + 1,
                    name: indexStr,
                    value: indexStr,
                }
            );
        });
    }

    let defaultKey;

    if (isFixedLayoutNoPageList || r2Publication?.PageList) {
        defaultKey = options.findIndex((value) => value.name === currentPage) + 1;
    }


    return < div className={stylesPopoverDialog.goToPage} >
        {/* <p>{__("reader.navigation.goToTitle")}</p> */}

        {
            currentPage ? <label className={stylesPopoverDialog.currentPage}
                id="reader-menu-tab-gotopage-label"
                htmlFor="reader-menu-tab-gotopage-input">
                <SVG ariaHidden svg={BookOpenIcon} />
                {
                    currentPage ?
                        (parseInt(totalPages, 10)
                            ? __("reader.navigation.currentPageTotal", { current: `${currentPage}`, total: `${totalPages}` })
                            : __("reader.navigation.currentPage", { current: `${currentPage}` })) :
                        ""
                }
            </label> : <></>}
        <form
            id="reader-menu-tab-gotopage-form"
            onSubmit={(e) => {
                e.preventDefault();
            }
            }
        // onKeyUp=
        //     {
        //         (e) => {
        //             // SPACE does not work (only without key mods on button)
        //             //  || e.key === "Space"
        //             if (e.key === "Enter") {
        //                 const closeNavGotoPage = !dockedMode && !(e.shiftKey && e.altKey);
        //                 e.preventDefault();
        //                 handleSubmitPage(closeNavGotoPage);
        //             }
        //     }
        // }
        >

            <div className={classNames(stylesInputs.form_group, stylesPopoverDialog.gotopage_combobox)} style={{ width: "80%" }}>
                {/* <label style={{position: "absolute"}}> {__("reader.navigation.goToPlaceHolder")}</label> */}
                <ComboBox
                    inputId="reader-menu-tab-gotopage-input"
                    label={__("reader.navigation.goToPlaceHolder")}
                    defaultItems={options}
                    defaultSelectedKey={defaultKey}
                    refInputEl={goToRef}
                    allowsCustomValue
                    isDisabled={!(isFixedLayoutNoPageList || r2Publication.PageList || isDivina || isPdf)}
                    onSelectionChange={(ev) => {
                        const val = ev?.toString();
                        if (!val || !goToRef?.current) {
                            return;
                        }
                        goToRef.current.value = val;
                        setPageError(false);
                    }}
                >
                    {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
                </ComboBox>
            </div>
            <button
                type="button"
                className={stylesButtons.button_primary_blue}

                onClick=
                {(e) => {
                    const closeNavGotoPage = !dockedMode && !(e.shiftKey && e.altKey);
                    e.preventDefault();
                    // console.log(goToRef?.current?.value);
                    handleSubmitPage(closeNavGotoPage);
                }}

                // does not work on button (works on 'a' link)
                // onDoubleClick=
                // {(e) => {e.preventDefault(); handleSubmitPage(false);}}

                // not necessary (onClick works)
                // onKeyUp=
                //     {
                //         (e) => {
                //             // SPACE does not work (only without key mods on button)
                //             //  || e.key === "Space"
                //             if (e.key === "Enter") {
                //                 const closeNavGotoPage = !dockedMode && !(e.shiftKey && e.altKey);
                //                 e.preventDefault();
                //                 handleSubmitPage(closeNavGotoPage);
                //             }
                //         }
                //     }
                disabled={
                    !(isFixedLayoutNoPageList || r2Publication.PageList || isDivina || isPdf)
                }
            >
                <SVG ariaHidden svg={TargetIcon} />
                {__("reader.navigation.goTo")}
            </button>
        </form>

        {pageError &&
            <p
                className={stylesPopoverDialog.goToErrorMessage}
                aria-live="assertive"
                aria-relevant="all"
                role="alert"
            >
                {__("reader.navigation.goToError")}
            </p>
        }

    </div>;
};
