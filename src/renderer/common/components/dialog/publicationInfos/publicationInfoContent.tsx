// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { isDivinaFn, isPdfFn } from "readium-desktop/common/isManifestType";
import { I18nTyped, Translator } from "readium-desktop/common/services/translator";
import { TPublication } from "readium-desktop/common/type/publication.type";
import { formatTime } from "readium-desktop/common/utils/time";
import { IOpdsBaseLinkView } from "readium-desktop/common/views/opds";
import * as stylesBookDetailsDialog from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import * as stylesColumns from "readium-desktop/renderer/assets/styles/components/columns.css";
import * as stylesPublications from "readium-desktop/renderer/assets/styles/components/publications.css";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";

import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { LocatorExtended } from "@r2-navigator-js/electron/renderer";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import Cover from "../../Cover";
import { FormatContributorWithLink } from "./FormatContributorWithLink";
import { FormatPublicationLanguage } from "./formatPublicationLanguage";
import { FormatPublisherDate } from "./formatPublisherDate";
import LcpInfo from "./LcpInfo";
import PublicationInfoDescription from "./PublicationInfoDescription";
import { convertMultiLangStringToString, langStringIsRTL } from "readium-desktop/renderer/common/language-string";
import PublicationInfoA11y from "./publicationInfoA11y";
import { PublicationView } from "readium-desktop/common/views/publication";

export interface IProps {
    publicationViewMaybeOpds: TPublication;
    r2Publication: R2Publication | null;
    manifestUrlR2Protocol: string | null;
    handleLinkUrl: ((url: string) => void) | undefined;
    toggleCoverZoomCb: (coverZoom: boolean) => void;
    ControlComponent?: React.ComponentType<any>;
    TagManagerComponent: React.ComponentType<any>;
    coverZoom: boolean;
    focusWhereAmI: boolean;
    pdfPlayerNumberOfPages: number | undefined; // super hacky :(
    divinaNumberOfPages: number | undefined; // super hacky :(
    divinaContinousEqualTrue: boolean;
    readerReadingLocation: LocatorExtended;
    translator: Translator;
    onClikLinkCb?: (tag: IOpdsBaseLinkView) => () => void | undefined;
    closeDialogCb: () => void;
}

const Duration = (props: {
    duration: number;
    __: I18nTyped;
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
    locatorExt: LocatorExtended,
    focusWhereAmI: boolean,
    pdfPlayerNumberOfPages: number | undefined, // super hacky :(
    divinaNumberOfPages: number | undefined, // super hacky :(
    divinaContinousEqualTrue: boolean,
    __: I18nTyped;
    closeDialogCb: () => void;
}) => {
    const { __, closeDialogCb, locatorExt, focusWhereAmI, pdfPlayerNumberOfPages, divinaNumberOfPages, divinaContinousEqualTrue, r2Publication, manifestUrlR2Protocol, handleLinkUrl } = props;

    const focusRef = React.useRef<HTMLHeadingElement>(null);
    React.useEffect(() => {
        if (focusWhereAmI && focusRef.current) {
            focusRef.current.focus();
        }
    }, [focusWhereAmI]);

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
        const isFixedLayout = r2Publication && // && !r2Publication.PageList
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

                // see (locations as any ).totalProgression Divina HACK
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
                if (isFixedLayout) {
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
                        const summary = hs.reduce((arr, h, i) => {
                            return arr.concat(
                                <span key={`_h${k++}`}>{i === 0 ? " " : " / "}</span>,
                                <span key={`_h${k++}`} style={{fontWeight: "bold"}}>h{h.level} </span>,
                                <span key={`_h${k++}`} style={{border: "1px solid grey", padding: "2px"}}>{h.txt ? `${h.txt}` : `${h.id ? `[${h.id}]` : "_"}`}</span>,
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
                        reduce((arr, h, i) => {
                            return arr.concat(
                                <li key={`_li${i}`}>
                                <span style={{fontWeight: "bold"}}>h{h.level} </span>
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
                                    <span style={{padding: "2px"}}>{h.txt ? `${h.txt}` : `${h.id ? `[${h.id}]` : "_"}`}</span>
                                </a>
                                ) : (
                                    <span
                                        data-id={h.id ? h.id : undefined}
                                        data-index={i}
                                        style={{padding: "2px"}}>{h.txt ? `${h.txt}` : `${h.id ? `[${h.id}]` : "_"}`}</span>
                                )}
                                </li>);
                        }, []);

                        txtHeadings = <details><summary>{summary}</summary><ul style={{listStyleType: "none"}}>{details}</ul></details>;
                    }
                }
            }
        }

        return (
            <section>
            <div className={stylesGlobal.heading}>
                <h3 ref={focusRef} tabIndex={focusWhereAmI ? -1 : 0}>{`${__("publication.progression.title")}: `}</h3>
            </div>
            <>
                {(txtProgression ? (<p><i className={stylesBookDetailsDialog.allowUserSelect}>
                    {txtProgression}
                </i></p>) : <></>)}
                {(txtPagination ? (<p><i className={stylesBookDetailsDialog.allowUserSelect}>
                    {txtPagination}
                </i></p>) : <></>)}
                {(txtHeadings ? (<><div style={{lineHeight: "2em"}} className={stylesBookDetailsDialog.allowUserSelect}>
                    {txtHeadings}
                </div></>) : <></>)}
            </>
            </section>
        );

        } catch (_err) {
            return (<>_</>);
        }
    }
    return (<></>);
};

export const PublicationInfoContent: React.FC<IProps> = (props) => {

    // tslint:disable-next-line: max-line-length
    const { closeDialogCb, readerReadingLocation, pdfPlayerNumberOfPages, divinaNumberOfPages, divinaContinousEqualTrue, r2Publication: r2Publication_, manifestUrlR2Protocol, handleLinkUrl, publicationViewMaybeOpds, toggleCoverZoomCb, ControlComponent, TagManagerComponent, coverZoom, translator, onClikLinkCb, focusWhereAmI } = props;
    const __ = translator.translate;

    const r2Publication = React.useMemo(() => {
        if (!r2Publication_ && publicationViewMaybeOpds.r2PublicationJson) {
            // debug("!! r2Publication ".repeat(100));
            return TaJsonDeserialize(publicationViewMaybeOpds.r2PublicationJson, R2Publication);
        }

        // debug("__r2Publication".repeat(100));
        return r2Publication_;

    }, [publicationViewMaybeOpds, r2Publication_]);

    const pubTitleLangStr = convertMultiLangStringToString(translator, (publicationViewMaybeOpds as PublicationView).publicationTitle || publicationViewMaybeOpds.documentTitle);
    const pubTitleLang = pubTitleLangStr && pubTitleLangStr[0] ? pubTitleLangStr[0].toLowerCase() : "";
    const pubTitleIsRTL = langStringIsRTL(pubTitleLang);
    const pubTitleStr = pubTitleLangStr && pubTitleLangStr[1] ? pubTitleLangStr[1] : "";

    return (
        <>
            <div className={stylesColumns.row}>
                <div className={stylesColumns.col_book_img}>
                    <div className={stylesPublications.publication_image_wrapper}>
                        <Cover
                            publicationViewMaybeOpds={publicationViewMaybeOpds}
                            onClick={() => toggleCoverZoomCb(coverZoom)}
                            onKeyDown={
                                (e: React.KeyboardEvent<HTMLImageElement>) =>
                                    e.key === "Enter" && toggleCoverZoomCb(coverZoom)
                            }
                        ></Cover>
                    </div>
                    { ControlComponent && <ControlComponent /> }
                </div>
                <div className={stylesColumns.col}>
                    <section>
                        <h2 className={classNames(stylesBookDetailsDialog.allowUserSelect, stylesGlobal.my_10)}
                            dir={pubTitleIsRTL ? "rtl" : undefined}>
                            {pubTitleStr}
                        </h2>
                        <FormatContributorWithLink
                            contributors={publicationViewMaybeOpds.authors}
                            translator={translator}
                            onClickLinkCb={onClikLinkCb}
                        />
                    </section>

                    <section>
                        <PublicationInfoDescription publicationViewMaybeOpds={publicationViewMaybeOpds} __={__} translator={props.translator} />
                    </section>
                    <section>
                        <div className={stylesGlobal.heading}>
                            <h3>{__("catalog.moreInfo")}</h3>
                        </div>
                        <div>
                            <FormatPublisherDate publicationViewMaybeOpds={publicationViewMaybeOpds} __={__} />
                            {
                                publicationViewMaybeOpds.publishers?.length ?
                                    <>
                                        <strong>{`${__("catalog.publisher")}: `}</strong>
                                        <i className={stylesBookDetailsDialog.allowUserSelect}>
                                            <FormatContributorWithLink
                                                contributors={publicationViewMaybeOpds.publishers}
                                                translator={translator}
                                                onClickLinkCb={onClikLinkCb}
                                            />
                                        </i>
                                        <br />
                                    </> : undefined
                            }
                            {
                                publicationViewMaybeOpds.languages?.length ?
                                    <>
                                        <strong>{`${__("catalog.lang")}: `}</strong>
                                        <FormatPublicationLanguage publicationViewMaybeOpds={publicationViewMaybeOpds} __={__} />
                                        <br />
                                    </> : undefined
                            }
                            {
                                publicationViewMaybeOpds.numberOfPages ?
                                    <>
                                        <strong>{`${__("catalog.numberOfPages")}: `}</strong>
                                        <i className={stylesBookDetailsDialog.allowUserSelect}>
                                            {publicationViewMaybeOpds.numberOfPages}
                                        </i>
                                        <br />

                                    </> : undefined
                            }
                            <Duration
                                __={__}
                                duration={publicationViewMaybeOpds.duration}
                            />
                            {
                                publicationViewMaybeOpds.nbOfTracks ?
                                    <>
                                        <strong>{`${__("publication.audio.tracks")}: `}</strong>
                                        <i className={stylesBookDetailsDialog.allowUserSelect}>
                                            {publicationViewMaybeOpds.nbOfTracks}
                                        </i>
                                        <br />

                                    </> : undefined
                            }
                        </div>
                    </section>
                    <section>
                        <div className={stylesGlobal.heading}>
                            <h3>{__("publication.accessibility.name")}</h3>
                        </div>
                        <div>
                            <PublicationInfoA11y publicationViewMaybeOpds={publicationViewMaybeOpds}></PublicationInfoA11y>
                        </div>
                    </section>
                    {(publicationViewMaybeOpds.lcp ? <section>
                        <LcpInfo publicationLcp={publicationViewMaybeOpds} />
                    </section> : <></>)}
                    <section>
                        <div className={stylesGlobal.heading}>
                            <h3>{__("catalog.tags")}</h3>
                        </div>
                        <TagManagerComponent />
                    </section>
                    <Progression
                        __={__}
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
