// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesBookDetailsDialog from "readium-desktop/renderer/assets/styles/bookDetailsDialog.scss";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import * as stylePublication from "readium-desktop/renderer/assets/styles/publicationInfos.scss";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";

import classNames from "classnames";
import * as React from "react";
import { isDivinaFn, isPdfFn } from "readium-desktop/common/isManifestType";
import { I18nFunction } from "readium-desktop/common/services/translator";
import { TPublication } from "readium-desktop/common/type/publication.type";
import { formatTime } from "readium-desktop/common/utils/time";
import { IOpdsContributorView } from "readium-desktop/common/views/opds";

import { TaJsonDeserialize } from "@r2-lcp-js/serializable";

import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";

import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import Cover, { CoverWithForwardedRef } from "../../Cover";
import { FormatContributorWithLink } from "./FormatContributorWithLink";
import { FormatPublicationLanguage } from "./formatPublicationLanguage";
import { FormatPublisherDate } from "./formatPublisherDate";
import LcpInfo from "./LcpInfo";
import PublicationInfoDescription from "./PublicationInfoDescription";
import { convertMultiLangStringToLangString, langStringIsRTL } from "readium-desktop/common/language-string";
import PublicationInfoA11y from "./publicationInfoA11y";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as Dialog from "@radix-ui/react-dialog";
import SVG from "../../SVG";
import * as OnGoingBookIcon from "readium-desktop/renderer/assets/icons/ongoingBook-icon.svg";
import * as ChevronUp from "readium-desktop/renderer/assets/icons/chevron-up.svg";
import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";

import * as VisuallyHidden from "@radix-ui/react-visually-hidden";


export interface IProps {
    publicationViewMaybeOpds: TPublication;
    r2Publication: R2Publication | null;
    manifestUrlR2Protocol: string | null;
    handleLinkUrl: ((url: string) => void) | undefined;
    // toggleCoverZoomCb: (coverZoom: boolean) => void;
    ControlComponent?: React.ComponentType<any>;
    TagManagerComponent: React.ComponentType<any>;
    // coverZoom: boolean;
    focusWhereAmI: boolean;
    pdfPlayerNumberOfPages: number | undefined; // super hacky :(
    divinaNumberOfPages: number | undefined; // super hacky :(
    divinaContinousEqualTrue: boolean;
    readerReadingLocation: MiniLocatorExtended;
    onClikLinkCb?: (tag: IOpdsContributorView) => () => void | undefined;
    closeDialogCb: () => void;
}

const Duration = (props: {
    duration: number;
    __: I18nFunction;
}) => {

    const { duration, __ } = props;

    if (!duration) {
        return <></>;
    }

    const sentence = formatTime(duration);

    return (
        sentence
            ? <>
                <strong>{`${__("publication.duration.title")}: `}</strong>
                <i className={stylesBookDetailsDialog.allowUserSelect}>
                    {sentence}
                </i>
                <br />
            </>
            : <></>);
};

const Progression = (props: {
    r2Publication: R2Publication | null,
    manifestUrlR2Protocol: string | null,
    handleLinkUrl: ((url: string) => void) | undefined;
    locatorExt: MiniLocatorExtended,
    focusWhereAmI: boolean,
    pdfPlayerNumberOfPages: number | undefined, // super hacky :(
    divinaNumberOfPages: number | undefined, // super hacky :(
    divinaContinousEqualTrue: boolean,
    closeDialogCb: () => void;
}) => {
    const { closeDialogCb, locatorExt, focusWhereAmI, pdfPlayerNumberOfPages, divinaNumberOfPages, divinaContinousEqualTrue, r2Publication, manifestUrlR2Protocol, handleLinkUrl } = props;

    const focusRef = React.useRef<HTMLHeadingElement>(null);
    React.useEffect(() => {
        if (focusWhereAmI && focusRef.current) {
            focusRef.current.focus();
        }
    }, [focusWhereAmI]);
    const [__] = useTranslator();

    if (typeof locatorExt?.locator?.locations?.progression === "number") {

        // try/catch until the code is cleaned-up!
        // (Audiobooks, PDF, Divina, EPUB FXL and reflow ... page number vs. string types)
        try {

            const isAudio = locatorExt.audioPlaybackInfo
                // total duration can be undefined with badly-constructed publications,
                // for example we found some LibriVox W3C LPF audiobooks missing duration property on reading order resources
                && locatorExt.audioPlaybackInfo.globalDuration
                && typeof locatorExt.locator.locations.position === "number"; // .progression is local to audio item in reading order playlist

            const isDivina = r2Publication && isDivinaFn(r2Publication);
            const isPdf = r2Publication && isPdfFn(r2Publication);

        // locatorExt.docInfo.isFixedLayout
        const isFixedLayoutPublication = r2Publication && // && !r2Publication.PageList
            r2Publication.Metadata?.Rendition?.Layout === "fixed";

            let txtProgression: string | undefined;
            let txtPagination: string | undefined;
            let txtHeadings: JSX.Element | undefined;

        if (isAudio) {
            const percent = Math.round(locatorExt.locator.locations.position * 100);
            // const p = Math.round(100 * (locatorExt.audioPlaybackInfo.globalTime / locatorExt.audioPlaybackInfo.globalDuration));
            txtProgression = `${percent}% [${formatTime(Math.round(locatorExt.audioPlaybackInfo.globalTime))} / ${formatTime(Math.round(locatorExt.audioPlaybackInfo.globalDuration))}]`;
        } else if (isDivina) {
            // console.log("----- ".repeat(100), divinaNumberOfPages, r2Publication?.Spine?.length);
            let totalPages = (divinaNumberOfPages && !divinaContinousEqualTrue) ? divinaNumberOfPages : (r2Publication?.Spine?.length ? r2Publication.Spine.length : undefined);
            if (typeof totalPages === "string") {
                try {
                    totalPages = parseInt(totalPages, 10);
                } catch (_e) {
                    totalPages = 0;
                }
            }

            let pageNum = !divinaContinousEqualTrue ?
                (locatorExt.locator.locations.position || 0) :
                (Math.floor(locatorExt.locator.locations.progression * r2Publication.Spine.length) - 1);
            if (typeof pageNum === "string") {
                try {
                    pageNum = parseInt(pageNum, 10) + 1;
                } catch (_e) {
                    pageNum = 0;
                }
            } else if (typeof pageNum === "number") {
                pageNum = pageNum + 1;
            }

            if (totalPages && typeof pageNum === "number") {
                txtPagination = __("reader.navigation.currentPageTotal", { current: `${pageNum}`, total: `${totalPages}` });

                // txtProgression = `${Math.round(100 * (pageNum / totalPages))}%`;
                txtProgression = `${Math.round(100 * (locatorExt.locator.locations.progression || 0))}%`;

            } else { // divinaContinousEqualTrue (relative to spine items)
                if (typeof pageNum === "number") {
                    txtPagination = __("reader.navigation.currentPage", { current: `${pageNum}` });
                }

                // SEE isDivinaLocation duck typing hack with totalProgression injection!!
                if (typeof locatorExt.locator.locations.progression === "number") {
                    const percent = Math.round(locatorExt.locator.locations.progression * 100);
                    txtProgression = `${percent}%`;
                }
            }

        } else if (isPdf) {
            let totalPages = pdfPlayerNumberOfPages ?
                pdfPlayerNumberOfPages :
                (r2Publication?.Metadata?.NumberOfPages ? r2Publication.Metadata.NumberOfPages : undefined);

            if (typeof totalPages === "string") {
                try {
                    totalPages = parseInt(totalPages, 10);
                } catch (_e) {
                    totalPages = 0;
                }
            }

            let pageNum = (locatorExt.locator?.href as unknown) as number;
            if (typeof pageNum === "string") {
                try {
                    pageNum = parseInt(pageNum, 10);
                } catch (_e) {
                    pageNum = 0;
                }
            }

            if (totalPages) {
                txtPagination = __("reader.navigation.currentPageTotal", { current: `${pageNum}`, total: `${totalPages}` });
                txtProgression = `${Math.round(100 * (pageNum / totalPages))}%`;
            } else {
                txtPagination = __("reader.navigation.currentPage", { current: `${pageNum}` });
            }

        } else if (r2Publication?.Spine && locatorExt.locator?.href) {

            const spineIndex = r2Publication.Spine.findIndex((l) => {
                return l.Href === locatorExt.locator.href;
            });
            if (spineIndex >= 0) {
                if (isFixedLayoutPublication) {
                    const pageNum = spineIndex + 1;
                    const totalPages = r2Publication.Spine.length;

                    txtPagination = __("reader.navigation.currentPageTotal", { current: `${pageNum}`, total: `${totalPages}` });
                    txtProgression = `${Math.round(100 * (pageNum / totalPages))}%`;

                } else {
                    // reflow: no totalPages, potentially just currentPage which is locatorExt.epubPage

                    if (locatorExt.epubPage) {
                        let epubPage = locatorExt.epubPage;
                        if (epubPage.trim().length === 0 && locatorExt.epubPageID && r2Publication.PageList) {
                            const p = r2Publication.PageList.find((page) => {
                                return page.Title && page.Href && page.Href.endsWith(`#${locatorExt.epubPageID}`);
                            });
                            if (p) {
                                epubPage = p.Title;
                            }
                        }
                        txtPagination = __("reader.navigation.currentPage", { current: epubPage });
                    }

                    // no virtual global .position in the current implementation,
                    // just local percentage .progression (current reading order item)
                    const percent = Math.round(locatorExt.locator.locations.progression * 100);
                    txtProgression = `${spineIndex + 1}/${r2Publication.Spine.length}${locatorExt.locator.title ? ` (${locatorExt.locator.title})` : ""} [${percent}%]`;

                    if (locatorExt.headings && manifestUrlR2Protocol) { // focusWhereAmI

                        let rank = 999;
                        const hs = locatorExt.headings.filter((h, _i) => {
                            if (h.level < rank
                                // && (h.id || i === locatorExt.headings.length - 1)
                            ) {

                                rank = h.level;
                                return true;
                            }
                            return false;
                        }).reverse();
                        // WARNING: .reverse() is in-place same-array mutation! (not a new array)
                        // ...but we're chaining with .filter() so that locatorExt.headings is not modified

                            let k = 0;
                            const summary = hs.reduce<React.ReactElement[]>((arr, h, i) => {
                                return arr.concat(
                                    <div style={{ display: "flex", gap: "5px",overflow: "hidden", textWrap: "nowrap", paddingRight: "2px"}}>
                                        <span key={`_h${k++}`}>{i === 0 ? " " : " / "}</span>
                                        <span key={`_h${k++}`} style={{ fontWeight: "bold" }}>h{h.level} </span>
                                        <span key={`_h${k++}`} style={{overflow: "hidden", textOverflow: "ellipsis"}}>{h.txt ? `${h.txt}` : `${h.id ? `[${h.id}]` : "_"}`}</span>
                                    </div>,
                                );
                            }, []);

                        // WARNING: .reverse() is in-place same-array mutation! (not a new array)
                        // ...which is why we use .slice() to create an instance copy
                        // (locatorExt.headings isn't modified)
                        // Note: instead of .slice(), Array.from() works too
                        const details = locatorExt.headings.slice().reverse().
                            // filter((h, i) => {
                            //     return h.id || i === 0;
                            // }).
                            reduce<React.ReactElement[]>((arr, h, i) => {
                                return arr.concat(
                                    <li key={`_li${i}`}>
                                        <span style={{ fontWeight: "bold" }}>h{h.level} </span>
                                        {(h.id || i === 0) ? (
                                            <a
                                                href={(h.id || i === 0) ? "#" : undefined}

                                                data-id={h.id ? h.id : undefined}
                                                data-index={i}

                                                onClick={
                                                    (e) => {
                                                        e.preventDefault();

                                                        const id = e.currentTarget?.getAttribute("data-id");
                                                        const idx = e.currentTarget?.getAttribute("data-index");
                                                        const index = idx ? parseInt(idx, 10) : -1;
                                                        if (id || index === 0) {
                                                            closeDialogCb();
                                                            const url = manifestUrlR2Protocol + "/../" + locatorExt.locator.href.replace(/#[^#]*$/, "") + `#${id ? id : ""}`;
                                                            handleLinkUrl(url);
                                                        }
                                                    }
                                                }>
                                                <span style={{ padding: "2px" }}>{h.txt ? `${h.txt}` : `${h.id ? `[${h.id}]` : "_"}`}</span>
                                            </a>
                                        ) : (
                                            <span
                                                data-id={h.id ? h.id : undefined}
                                                data-index={i}
                                                style={{ padding: "2px" }}>{h.txt ? `${h.txt}` : `${h.id ? `[${h.id}]` : "_"}`}</span>
                                        )}
                                    </li>);
                            }, []);

                        txtHeadings = <ProgressionDetails summary={summary} details={details} />;
                    }
                }
            }
        }

        return (
            <section className="publicationInfo-progressionWrapper">
                <div className={stylePublication.publicationInfo_heading}>
                    <h4 ref={focusRef} tabIndex={focusWhereAmI ? -1 : 0}>{`${__("publication.progression.title")} `}</h4>
                </div>
                <div className={stylePublication.publicationInfo_progressionContainer}>
                    <div style={{ display: "flex", gap: "10px" }}>
                        {(txtProgression ? (<p className={stylesBookDetailsDialog.allowUserSelect}><SVG ariaHidden svg={OnGoingBookIcon} />
                            {txtProgression}
                        </p>) : <></>)}
                        {(txtPagination ? (<p className={stylesBookDetailsDialog.allowUserSelect}>
                            {txtPagination}
                        </p>) : <></>)}
                    </div>
                    {(txtHeadings ? (<><div style={{ lineHeight: "2em" }} className={stylesBookDetailsDialog.allowUserSelect}>
                        {txtHeadings}
                    </div></>) : <></>)}
                </div>
            </section>
        );

        } catch (_err) {
            return (<>_</>);
        }
    }
    return (<></>);
};

const ProgressionDetails: React.FC<{summary: React.ReactElement[], details: React.ReactElement[]}> = (props) => {
    const { summary, details } = props;
    const [open, setOpen] = React.useState(false);
    return (
        <details open={open} onToggle={() => setOpen(!open)}>
            <summary style={{display: "flex", maxWidth: "480px"}}>
            {open ?
                    <SVG ariaHidden svg={ChevronUp} /> :
                    <SVG ariaHidden svg={ChevronDown} />
                }
                {summary}
            </summary>
            <ul>{details}</ul>
        </details>
    );
};

export const PublicationInfoContent: React.FC<React.PropsWithChildren<IProps>> = (props) => {

    // tslint:disable-next-line: max-line-length
    const { closeDialogCb, readerReadingLocation, pdfPlayerNumberOfPages, divinaNumberOfPages, divinaContinousEqualTrue, r2Publication: r2Publication_, manifestUrlR2Protocol, handleLinkUrl, publicationViewMaybeOpds, ControlComponent, TagManagerComponent, onClikLinkCb, focusWhereAmI } = props;

    const r2Publication = React.useMemo(() => {
        if (!r2Publication_ && publicationViewMaybeOpds.r2PublicationJson) {
            // debug("!! r2Publication ".repeat(100));
            return TaJsonDeserialize(publicationViewMaybeOpds.r2PublicationJson, R2Publication);
        }

        // debug("__r2Publication".repeat(100));
        return r2Publication_;

    }, [publicationViewMaybeOpds, r2Publication_]);

    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const pubTitleLangStr = convertMultiLangStringToLangString((publicationViewMaybeOpds as PublicationView).publicationTitle || publicationViewMaybeOpds.documentTitle, locale);
    const pubTitleLang = pubTitleLangStr && pubTitleLangStr[0] ? pubTitleLangStr[0].toLowerCase() : "";
    const pubTitleIsRTL = langStringIsRTL(pubTitleLang);
    const pubTitleStr = pubTitleLangStr && pubTitleLangStr[1] ? pubTitleLangStr[1] : "";

    const [openCoverDialog, setOpenCoverDialog] = React.useState(false);
    const [__] = useTranslator();

    return (
        <>
            <div className={stylePublication.publicationInfo_container}>
                <div className={stylePublication.publicationInfo_leftSide}>
                    <div className={stylePublication.publicationInfo_leftSide_coverWrapper}>
                        <Dialog.Root open={openCoverDialog} onOpenChange={(open) => {
                            setOpenCoverDialog(open);
                        }}>
                            <Dialog.Trigger asChild>
                                <CoverWithForwardedRef
                                    publicationViewMaybeOpds={props.publicationViewMaybeOpds}
                                    coverType="cover"
                                    onKeyUp={
                                        (e) => {
                                            if (e.key === "Enter") {
                                                setOpenCoverDialog(true);
                                            }
                                        }
                                    }
                                />
                            </Dialog.Trigger>
                            <Dialog.Portal>
                                {/* <div className={stylesModals.modal_dialog_overlay}></div> */}
                                <Dialog.Content className={stylesModals.modal_dialog} aria-describedby={undefined}>
                                    <VisuallyHidden.Root>
                                        <Dialog.Title>{__("catalog.bookInfo")}</Dialog.Title>
                                    </VisuallyHidden.Root>
                                    <div className={stylesModals.modal_dialog_body_cover}>
                                        <Cover
                                            publicationViewMaybeOpds={props.publicationViewMaybeOpds}
                                            coverType="cover"
                                            onClick={() => setOpenCoverDialog(false)}
                                            onKeyUp={
                                                (e) => {
                                                    if (e.key === "Enter") {
                                                        setOpenCoverDialog(false);
                                                    }
                                                }
                                            }
                                        />
                                    </div>
                                </Dialog.Content>
                            </Dialog.Portal>
                        </Dialog.Root>
                    </div>
                    <div className={stylePublication.publicationInfo_leftSide_buttonsWrapper}>
                        {ControlComponent ? <ControlComponent /> : <></>}
                    </div>
                </div>
                <div className={stylePublication.publicationInfo_rightSide}>
                    <section>
                        <h2 className={classNames(stylesBookDetailsDialog.allowUserSelect, stylesGlobal.my_10, stylePublication.book_title)}
                            dir={pubTitleIsRTL ? "rtl" : undefined}>
                            {pubTitleStr}
                        </h2>
                        <FormatContributorWithLink
                            contributors={publicationViewMaybeOpds.authorsLangString}
                            onClickLinkCb={onClikLinkCb}
                            className={"authors"}
                        />
                    </section>

                    <section>
                        <PublicationInfoDescription publicationViewMaybeOpds={publicationViewMaybeOpds} __={__} />
                    </section>
                    <section>
                        <div className={stylePublication.publicationInfo_heading}>
                            <h4>{__("catalog.moreInfo")}</h4>
                        </div>
                        <div className={stylePublication.publicationInfo_moreInfo_content}>
                            <FormatPublisherDate publicationViewMaybeOpds={publicationViewMaybeOpds} __={__} />
                            {
                                publicationViewMaybeOpds.publishersLangString?.length ?
                                    <div>
                                        <strong>{`${__("catalog.publisher")}: `}</strong>
                                        <span className={stylesBookDetailsDialog.allowUserSelect}>
                                            <FormatContributorWithLink
                                                contributors={publicationViewMaybeOpds.publishersLangString}
                                                onClickLinkCb={onClikLinkCb}
                                            />
                                        </span>
                                        <br />
                                    </div> : undefined
                            }
                            {
                                publicationViewMaybeOpds.languages?.length ?
                                    <div>
                                        <strong>{`${__("catalog.lang")}: `}</strong>
                                        <FormatPublicationLanguage publicationViewMaybeOpds={publicationViewMaybeOpds} />
                                        <br />
                                    </div> : undefined
                            }
                            {
                                publicationViewMaybeOpds.numberOfPages ?
                                    <div>
                                        <strong>{`${__("catalog.numberOfPages")}: `}</strong>
                                        <span className={stylesBookDetailsDialog.allowUserSelect}>
                                            {publicationViewMaybeOpds.numberOfPages}
                                        </span>
                                        <br />

                                    </div> : undefined
                            }
                            <Duration
                                __={__}
                                duration={publicationViewMaybeOpds.duration}
                            />
                            {
                                publicationViewMaybeOpds.nbOfTracks ?
                                    <div>
                                        <strong>{`${__("publication.audio.tracks")}: `}</strong>
                                        <i className={stylesBookDetailsDialog.allowUserSelect}>
                                            {publicationViewMaybeOpds.nbOfTracks}
                                        </i>
                                        <br />

                                    </div> : undefined
                            }
                        </div>
                    </section>
                    <section>
                        <div className={stylePublication.publicationInfo_heading}>
                            <h4>{__("publication.accessibility.name")}</h4>
                        </div>
                        <div className={stylePublication.accessibility_infos}>
                            <PublicationInfoA11y publicationViewMaybeOpds={publicationViewMaybeOpds}></PublicationInfoA11y>
                        </div>
                    </section>
                    {(publicationViewMaybeOpds.lcp ? <section className={stylePublication.publicationInfo_lcpInfo_content}>
                        <LcpInfo publicationLcp={publicationViewMaybeOpds} />
                    </section> : <></>)}
                    <TagManagerComponent />
                    <Progression
                        closeDialogCb={closeDialogCb}
                        r2Publication={r2Publication}
                        manifestUrlR2Protocol={manifestUrlR2Protocol}
                        handleLinkUrl={handleLinkUrl}
                        pdfPlayerNumberOfPages={pdfPlayerNumberOfPages}
                        divinaNumberOfPages={divinaNumberOfPages}
                        divinaContinousEqualTrue={divinaContinousEqualTrue}
                        focusWhereAmI={focusWhereAmI}
                        locatorExt={readerReadingLocation || publicationViewMaybeOpds.lastReadingLocation}
                    />
                </div>
            </div>
        </>
    );
};
