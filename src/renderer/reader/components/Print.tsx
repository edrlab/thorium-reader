import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesInput from "readium-desktop/renderer/assets/styles/components/inputs.scss";
import * as Popover from "@radix-ui/react-popover";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesSpinner from "readium-desktop/renderer/assets/styles/components/spinnerContainer.scss";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";
import * as stylesAnnotations from "readium-desktop/renderer/assets/styles/components/annotations.scss";
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
import {Button, OverlayArrow, Tooltip, TooltipTrigger} from "react-aria-components";
import SVG from "readium-desktop/renderer/common/components/SVG";

const capitalizedAppName = _APP_NAME.charAt(0).toUpperCase() + _APP_NAME.substring(1);

// VibeCoded on labs.perplexity.ai with R1 :-)
function parsePrintRanges(input: string) {
    const segmentRegex = /^\s*(\d+)\s*$|^\s*(\d*)\s*-\s*(\d*)\s*$/;
    return input.split(";").map(segment => {
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

const pdfThumbnailRequestedArray: (boolean)[] = [];
export const PrintContainer = ({ pdfPageRange, pdfThumbnailImageCacheArray }: { pdfPageRange: [start: number, end: number], pdfThumbnailImageCacheArray: string[] }) => {

    const [getV, setV] = React.useState(pdfPageRange[1] ? `${pdfPageRange[0]}-${pdfPageRange[1]}` : "1");
    const [__] = useTranslator();
    const dispatch = useDispatch();

    const publicationIdentifier = useSelector((state: IReaderRootState) => state.reader.info.publicationIdentifier);

    const pageRange = React.useMemo(() => convertRangestoNumberArray(parsePrintRanges(getV), pdfPageRange).sort((a, b) => a - b), [getV, pdfPageRange]);

    const publicationViewFromReduxState = useSelector((state: IReaderRootState) => state.reader.info.publicationView);



    const [publicationView, setPubView] = React.useState<PublicationView>(publicationViewFromReduxState);

    const isLcp = !!publicationView.lcp?.rights;
    const isLcpWithPrintRights = isLcp && (!!publicationView.lcp?.rights?.print || publicationView.lcp.rights.print === 0);

    const publicationViewLcpRightsPrints = publicationView.lcpRightsPrints || [];

    // console.log(JSON.stringify(publicationView.lcp?.rights, null, 4));
    // console.log(JSON.stringify(publicationView.lcpRightsPrints, null, 4));

    React.useEffect(() => {

        getSaga().run(publicationInfoReaderLibGetPublicationApiCall, publicationIdentifier, false)
            .toPromise<apiActions.result.TAction<PublicationView>>()
            .then((action) => {

            if (action) {

                const pubView = action.payload;
                setPubView({...pubView});
            }
        }).catch((e) => {
            console.error("getSaga().run(publicationInfoReaderLibGetPublicationApiCall, publicationIdentifier, false)", e);
        });

    }, [publicationIdentifier]);


    let pagesToPrint = pageRange;
    let newLcpRightsPrints: number[] = [];
    if (isLcpWithPrintRights) {

        const lcpRightsPrints = publicationViewLcpRightsPrints || [];
        const lcpRightsPrintsRemain = publicationView.lcp.rights.print - lcpRightsPrints.length;
        const pagesToPrintSaved = pagesToPrint.filter((page) => lcpRightsPrints.some((pageSaved) => pageSaved === page));
        const pagesToPrintNotSaved = pagesToPrint.filter((page) => !pagesToPrintSaved.some((pageSaved) => pageSaved === page));
        const pagesToPrintNotSavedRightTruncated = pagesToPrintNotSaved.slice(0, lcpRightsPrintsRemain);
        pagesToPrint = [...pagesToPrintSaved, ...pagesToPrintNotSavedRightTruncated].sort((a, b) => a - b);
        newLcpRightsPrints = [...lcpRightsPrints, ...pagesToPrintNotSavedRightTruncated].sort((a, b) => a - b);

    }

    const rowVirtualizer = useVirtualizer({
        horizontal: true,
        count: pagesToPrint.length,
        getScrollElement: () => document.getElementById("print-popover-image-container"),
        estimateSize: () => 155,
        overscan: 3,
    });
    return <>
        <style>{`
             .print-popover-form {
            background-color: var(--color-extralight-grey);
            max-width: 450px;
            border-radius: 6px;
            border: 1px solid var(--color-light-grey);
            display: flex;
            flex-direction: column;
            padding: 5px 10px;
            color: var(--color-primary);
            min-width: 450px;
            min-height: 400px;
        }

        .print-popover-image-container {
            // display: flex;
            // flex-wrap: nowrap;
            overflow-x: auto;
            overflow-y: hidden;
            padding: 10px;
            // width: 430px;
            height: 200px;
        }

        .print-popover-form h4 {
            padding: 0;
            margin-bottom: 0;
        }

        .print-popover-form p {
            padding: 0;
        }

        .print-popover-image-container img {
            width: 155px;
            height: 200px;
        }

        .print-popover-page-icon {
            position: relative;
        }

        .print-popover-page-icon::after {
            content: '';
            width: 1.2em;
            height: 1.2em;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10' stroke='%23007bff' stroke-width='2' fill='none'/%3E%3Ctext x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23007bff'%3E?%3C/text%3E%3C/svg%3E");
            background-size: contain;
            position: absolute;
            right: -30px;
            top: -7px;
        }
        .print-popover-thumbnail-pagination-bubble {
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.9em;
            font-family: Arial, sans-serif;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        `}</style>
        <form className="print-popover-form">
            <h4>{__("reader.print.print")}</h4>
            <p>{isLcp ? __("reader.print.descriptionLcp", { appName: capitalizedAppName, count: pdfPageRange[1] }) : __("reader.print.description", { count: pdfPageRange[1], appName: capitalizedAppName })}</p>


            <div id="print-popover-image-container" className="print-popover-image-container">

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
                                        className="print-popover-thumbnail-container"
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            height: "100%",
                                            width: `${virtualItem.size}px`,
                                            transform: `translateX(${virtualItem.start}px)`,
                                        }}
                                    >
                                        {
                                            src
                                                ? <img key={pageNumber} src={src} title={(pageNumber).toString()} />
                                                : (<div key={pageNumber} style={{ position: "relative", backgroundColor: "inherit" }} className={stylesSpinner.spinner_container}><div className={stylesSpinner.spinner}><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>)
                                        }
                                        <div className="print-popover-thumbnail-pagination-bubble">{`${pageNumber}`}</div>
                                    </div>
                                );
                            })}
                        </div>
                        : <p style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "-webkit-fill-available" }}>No Pages</p>
                }

            </div>

            {
                isLcpWithPrintRights ?
                    <p style={{overflow: "auto"}}>{__("reader.print.descriptionLcpLimit", { /* pageRangePrinted: `[${publicationViewLcpRightsPrints}]`, */ count: publicationView.lcp.rights.print - publicationViewLcpRightsPrints.length, lcpLimitPages: publicationView.lcp.rights.print })}{publicationViewLcpRightsPrints.length ? <span> <br/> [{publicationViewLcpRightsPrints.join(",")}]</span> : ""}{newLcpRightsPrints.length ? <span> {" ... "} [{newLcpRightsPrints.join(",")}]</span> : ""}</p>
                    : <></>
            }
            <div className={stylesInput.form_group} style={{ marginTop: "20px", width: "360px" }}>
                <input type="text" name="print-range" style={{ width: "100%", marginLeft: "10px" }} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE" title={__("reader.print.pages")} value={getV} onChange={(e) => {
                    const v = e.target.value;
                    setV(v);
                }} />
                <label htmlFor="print-range">{__("reader.print.pages")}</label>

                <TooltipTrigger>
                    <Button style={{ width: "15px", height: "15px", marginLeft: "10px", marginRight: "10px"}}><SVG ariaHidden svg={InfoIcon} /></Button>
                    <Tooltip style={{ border: "1px solid var(--color-primary)", maxWidth: "300px", width: "fit-content", zIndex: "1000", backgroundColor: "var(--color-secondary)", borderRadius: "6px", padding: "5px", color: "var(--color-primary)" }}>
                        <OverlayArrow>
                            <svg width={8} height={8} viewBox="0 0 8 8">
                                <path d="M0 0 L4 4 L8 0" />
                            </svg>
                        </OverlayArrow>
                        {__("reader.print.pageHelpInfo")}
                        <br/>
                        {__("reader.print.pageHelpInfo1")}
                        <br/>
                        {__("reader.print.pageHelpInfo2")}
                        <br/>
                        {__("reader.print.pageHelpInfo3")}
                        <br/>
                        {__("reader.print.pageHelpInfo4")}
                    </Tooltip>
                </TooltipTrigger>
            </div>

            <div className={stylesAnnotations.annotation_form_textarea_buttons}>
                <Popover.Close className={stylesButtons.button_secondary_blue} aria-label={__("dialog.cancel")}>{__("dialog.cancel")}</Popover.Close>
                <Popover.Close
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
                </Popover.Close>
            </div>
        </form>
    </>;
};
