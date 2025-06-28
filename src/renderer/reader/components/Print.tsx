import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesInput from "readium-desktop/renderer/assets/styles/components/inputs.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesSpinner from "readium-desktop/renderer/assets/styles/components/spinnerContainer.scss";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";
import * as stylesPrint from "readium-desktop/renderer/assets/styles/components/print.scss";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { apiActions, readerActions } from "readium-desktop/common/redux/actions";
import { getSaga } from "../createStore";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";
import { createOrGetPdfEventBus } from "../pdf/driver";

import { useVirtualizer } from "@tanstack/react-virtual";
import { publicationInfoReaderLibGetPublicationApiCall } from "readium-desktop/renderer/common/redux/sagas/dialog/publicationInfoReaderAndLib";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as Dialog from "@radix-ui/react-dialog";
import classNames from "classnames";
import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as ChevronUp from "readium-desktop/renderer/assets/icons/chevron-up.svg";
import * as KeyIcon from "readium-desktop/renderer/assets/icons/key-icon.svg";

// const capitalizedAppName = _APP_NAME.charAt(0).toUpperCase() + _APP_NAME.substring(1);

// VibeCoded on labs.perplexity.ai with R1 :-)
function parsePrintRanges(input: string) {
    const segmentRegex = /^\s*(\d+)\s*$|^\s*(\d*)\s*-\s*(\d*)\s*$/;
    return input.split(/[\,|\;]/).filter((v) => !!v).map(segment => {
        const trimmed = segment.trim();
        if (!trimmed) return null;

        const match = segmentRegex.exec(trimmed);
        if (!match) return null;

        // Single number case (e.g., "1")
        if (match[1] !== undefined) {
            const num = parseInt(match[1], 10);
            return [num, num];
        }

        // Range case (e.g., "1-4", "2-", "-9")
        const start = match[2] ? parseInt(match[2], 10) : null;
        const end = match[3] ? parseInt(match[3], 10) : null;

        // Handle invalid case where both start and end are missing ("-")
        return (start === null && end === null) ? null : [start, end];
    }).filter(Boolean); // Remove any null/invalid entries
}

function convertRangestoNumberArray(ranges: number[][], pdfPageRange: [start: number, end: number]): Array<number> {
    const set = new Set<number>();;
    for (const range of ranges) {

        if (range) {

            if (range[0] < pdfPageRange[0]) {
                range[0] = pdfPageRange[0];
            }
            if (range[1] > pdfPageRange[1]) {
                range[1] = pdfPageRange[1];
            }
            if (!range[0]) {
                range[0] = pdfPageRange[0];
            }
            if (!range[1]) {
                range[1] = pdfPageRange[1];
            }

            let i = range[0];
            while (i <= range[1]) {
                set.add(i++);
            }
        }
    }

    return [...set];
}

function formatRanges(ranges: number[]) {
    const sorted = [...new Set(ranges)].sort((a, b) => a - b);
    const result = [];
    let start = sorted[0];
    let prev = start;
    for (let i = 1; i <= sorted.length; i++) {
        const current = sorted[i];
        if (current === prev + 1) {
            prev = current;
        } else {
            if (start === prev) {
                result.push(`${start}`);
            } else {
                result.push(`${start}-${prev}`);
            }
            start = current;
            prev = current;
        }
    }
    return result.join(", ");
}

const pdfThumbnailRequestedArray: (boolean)[] = [];
export const PrintContainer = ({ pdfPageRange, pdfThumbnailImageCacheArray }: { pdfPageRange: [start: number, end: number], pdfThumbnailImageCacheArray: string[] }) => {

    const [getV, setV] = React.useState(pdfPageRange[1] ? `${pdfPageRange[0]}-${pdfPageRange[1]}` : "1");
    const [__] = useTranslator();
    const dispatch = useDispatch();
    const [infoOpen, setInfoOpen] = React.useState(false);

    const publicationIdentifier = useSelector((state: IReaderRootState) => state.reader.info.publicationIdentifier);

    const pageRange = React.useMemo(() => convertRangestoNumberArray(parsePrintRanges(getV), pdfPageRange).sort((a, b) => a - b), [getV, pdfPageRange]);

    const publicationViewFromReduxState = useSelector((state: IReaderRootState) => state.reader.info.publicationView);



    const [publicationView, setPubView] = React.useState<PublicationView>(publicationViewFromReduxState);

    const isLcpWithPrintRights = !!publicationView.lcp?.rights && (!!publicationView.lcp?.rights?.print && publicationView.lcp.rights.print > 0);
    const publicationViewLcpRightsPrintNumber = isLcpWithPrintRights ? publicationView.lcp.rights.print : 0;

    const publicationViewLcpRightsPrintsConsumed = publicationView.lcpRightsPrints || [];
    const lcpCountPages = isLcpWithPrintRights ? Math.max(0, publicationViewLcpRightsPrintNumber - publicationViewLcpRightsPrintsConsumed.length) : 0;

    // console.log(JSON.stringify(publicationView.lcp?.rights, null, 4));
    // console.log(JSON.stringify(publicationView.lcpRightsPrints, null, 4));

    React.useEffect(() => {

        getSaga().run(publicationInfoReaderLibGetPublicationApiCall, publicationIdentifier, false)
            .toPromise<apiActions.result.TAction<PublicationView>>()
            .then((action) => {

                if (action) {

                    const pubView = action.payload;
                    setPubView({ ...pubView });
                }
            }).catch((e) => {
                console.error("getSaga().run(publicationInfoReaderLibGetPublicationApiCall, publicationIdentifier, false)", e);
            });

    }, [publicationIdentifier]);


    let pagesToPrint = pageRange;
    // let newLcpRightsPrints: number[] = [];
    if (isLcpWithPrintRights) {

        const lcpRightsPrints = publicationViewLcpRightsPrintsConsumed;
        const lcpRightsPrintsRemain = Math.max(0, publicationViewLcpRightsPrintNumber - lcpRightsPrints.length);
        const pagesToPrintSaved = pagesToPrint.filter((page) => lcpRightsPrints.some((pageSaved) => pageSaved === page));
        const pagesToPrintNotSaved = pagesToPrint.filter((page) => !pagesToPrintSaved.some((pageSaved) => pageSaved === page));
        const pagesToPrintNotSavedRightTruncated = pagesToPrintNotSaved.slice(0, lcpRightsPrintsRemain);
        pagesToPrint = [...pagesToPrintSaved, ...pagesToPrintNotSavedRightTruncated].sort((a, b) => a - b);
        // newLcpRightsPrints = [...lcpRightsPrints, ...pagesToPrintNotSavedRightTruncated].sort((a, b) => a - b);

    }

    const rowVirtualizer = useVirtualizer({
        horizontal: true,
        count: pagesToPrint.length,
        getScrollElement: () => document.getElementById("print-dialog-image-container"),
        estimateSize: () => 155,
        overscan: 3,
    });

    return <>
        <form className={stylesPrint.print_dialog_form}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2>{__("reader.print.print")}</h2>
                <Dialog.Close asChild>
                    <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                        <SVG ariaHidden={true} svg={QuitIcon} />
                    </button>
                </Dialog.Close>
            </div>
            {
                isLcpWithPrintRights ?
                    <div className={stylesPrint.info_text}>
                        <div style={{ display: "flex", flexDirection: "row", fontSize: "14px" }}>
                            <SVG ariaHidden svg={InfoIcon} />
                            <p style={{ marginLeft: "10px" }}>{__("reader.print.lcpInfo", { count: publicationViewLcpRightsPrintNumber})}</p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", marginLeft: "20px", marginBottom: "5px" }}>
                            <h4 style={{ marginTop: "0px" }}><SVG ariaHidden svg={KeyIcon} />{__("publication.licensed")}</h4>
                            <ul className={stylesPrint.print_lcp_list}>
                                {/* <li>{__("reader.print.descriptionLcpLimit", { lcpLimitPages: publicationViewLcpRightsPrintNumber })}</li> */}
                                <li>{__("reader.print.descriptionLcpCount", { count: lcpCountPages })}</li>
                                <li>{__("reader.print.descriptionLcpPrintable", { printable: formatRanges(publicationViewLcpRightsPrintsConsumed), count: publicationViewLcpRightsPrintsConsumed.length.toString() })}</li>
                            </ul>
                        </div>
                    </div>
                    : <div style={{ margin: "10px", borderBottom: "2px solid var(--color-extralight-grey)" }} />

            }

            <div style={{ padding: "10px 15px 5px", backgroundColor: "var(--color-extralight-grey)" }}>
                <p aria-label="Prévisualisation">Prévisualisation</p>
                <div id="print-dialog-image-container" className={stylesPrint.print_dialog_image_container}>

                    {
                        pagesToPrint.length ?

                            <div
                                style={{
                                    height: "100%",
                                    width: `${rowVirtualizer.getTotalSize()}px`,
                                    position: "relative",
                                }}
                            >
                                {rowVirtualizer.getVirtualItems().map((virtualItem) => {


                                    const pageNumber = pagesToPrint[virtualItem.index];
                                    const pageIndexZeroBased = pageNumber - 1;
                                    const src = pdfThumbnailImageCacheArray[pageIndexZeroBased];

                                    if (!src && !pdfThumbnailRequestedArray[pageIndexZeroBased]) {
                                        createOrGetPdfEventBus().dispatch("thumbnailRequest", pageIndexZeroBased);
                                        pdfThumbnailRequestedArray[pageIndexZeroBased] = true;
                                    }
                                    return (
                                        <div
                                            key={virtualItem.key}
                                            className={stylesPrint.print_dialog_thumbnail_container}
                                            style={{
                                                width: `${virtualItem.size - 10}px`,
                                                transform: `translateX(${virtualItem.start}px)`,
                                            }}
                                        >
                                            {
                                                src
                                                    ? <img key={pageNumber} src={src} title={(pageNumber).toString()} />
                                                    : (<div key={pageNumber} style={{ position: "relative", backgroundColor: "inherit" }} className={stylesSpinner.spinner_container}><div className={stylesSpinner.spinner}><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>)
                                            }
                                            <div className={stylesPrint.print_dialog_thumbnail_pagination_bubble}>{`${pageNumber}`}</div>
                                        </div>
                                    );
                                })}
                            </div>
                            : <>
                                <p style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "-webkit-fill-available" }}>{__("reader.print.noPrintablePages")}</p>
                                {isLcpWithPrintRights && !!pageRange.length ? <p style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "-webkit-fill-available" }}>{__("reader.print.noPagesLcpLimitReached")}</p> : <></>}
                            </>
                    }

                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "20px", minHeight: "85px" }}>
                <div className={stylesInput.form_group} style={{ marginTop: "20px", minWidth: "360px", marginLeft: "5px" }}>
                    <input type="text" name="print-range" style={{ width: "100%", marginLeft: "10px" }} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE" title={__("reader.print.pages")} value={getV} onChange={(e) => {
                        const v = e.target.value;
                        setV(v);
                    }} />
                    <label htmlFor="print-range">{__("reader.print.pages")}</label>
                </div>
                <div style={{ marginTop: "20px" }}>
                    <label htmlFor="pages-to-print">{__("reader.print.printablePages")}</label>
                    <p style={{ marginTop: "3px" }} id="pages-to-print">{formatRanges(pagesToPrint)} ({pagesToPrint.length})</p>
                </div>
            </div>
            <button className={classNames("button_catalog_infos")} onClick={(e) => { e.preventDefault(); setInfoOpen(!infoOpen); }}>
                <SVG ariaHidden svg={InfoIcon} />
                {__("reader.print.howTo")}
                <SVG ariaHidden svg={infoOpen ? ChevronUp : ChevronDown} />
            </button>
            {infoOpen ?
                <div className={stylesPrint.print_dialog_help_container}>
                    <p>{__("reader.print.pageHelpInfo")}</p>
                    <ul>
                        <li>{__("reader.print.pageHelpInfo1")}</li>
                        <li>{__("reader.print.pageHelpInfo2")}</li>
                        <li>{__("reader.print.pageHelpInfo3")}</li>
                        <li>{__("reader.print.pageHelpInfo4")}</li>
                    </ul>
                </div>
                : <></>}

            <div className={stylesPrint.print_dialog_actions_buttons}>
                <Dialog.Close className={stylesButtons.button_secondary_blue} aria-label={__("dialog.cancel")}>{__("dialog.cancel")}</Dialog.Close>
                <Dialog.Close
                    type="submit"
                    className={stylesButtons.button_primary_blue}
                    aria-label={__("reader.print.print")}
                    disabled={!pagesToPrint.length}
                    onClick={(_e) => {
                        // e.preventDefault();
                        // createOrGetPdfEventBus().dispatch("print", pagesToPrint);

                        dispatch(readerActions.print.build(publicationIdentifier, pagesToPrint)); // send to main process
                    }}
                >
                    {__("reader.print.print")}
                </Dialog.Close>
            </div>
        </form>
    </>;
};
