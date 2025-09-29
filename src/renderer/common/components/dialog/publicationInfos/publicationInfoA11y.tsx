// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesBlocks from "readium-desktop/renderer/assets/styles/components/blocks.scss";
import * as stylesBookDetailsDialog from "readium-desktop/renderer/assets/styles/bookDetailsDialog.scss";
import * as stylePublication from "readium-desktop/renderer/assets/styles/publicationInfos.scss";

import { shell } from "electron";
import classNames from "classnames";
import * as debug_ from "debug";
import DOMPurify from "dompurify";
import * as React from "react";
import { TPublication } from "readium-desktop/common/type/publication.type";
import { convertMultiLangStringToLangString, langStringIsRTL } from "readium-desktop/common/language-string";
import isURL from "validator/lib/isURL";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import { connect } from "react-redux";
import { TranslatorProps, withTranslator } from "../../hoc/translator";

// Logger
const debug = debug_("readium-desktop:renderer:publicationA11y");
debug("_");

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends TranslatorProps, ReturnType<typeof mapStateToProps> {
    publicationViewMaybeOpds: TPublication;
}

interface IState {
    seeMore_a11y: boolean;
}

export class PublicationInfoA11y extends React.Component<IProps, IState> {

    private descriptionWrapperRef_a11y: React.RefObject<HTMLDivElement>;
    private descriptionRef_a11y: React.RefObject<HTMLParagraphElement>;

    constructor(props: IProps) {
        super(props);

        this.descriptionWrapperRef_a11y = React.createRef<HTMLDivElement>();
        this.descriptionRef_a11y = React.createRef<HTMLParagraphElement>();

        this.state = {
            seeMore_a11y: false,
        };
    }

    public render() {

        const { __, publicationViewMaybeOpds } = this.props;
        const {
            a11y_accessMode: _a11y_accessMode, // unused
            a11y_accessModeSufficient,
            a11y_accessibilityFeature,
            a11y_accessibilityHazard,
            a11y_accessibilitySummary,
            a11y_conformsTo,
            a11y_certifierReport,
            a11y_certifiedBy,
            a11y_certifierCredential,
        } = publicationViewMaybeOpds;

        debug(a11y_certifiedBy);

        const findStrInArrayArray = (array: string[][] | string[] | undefined, str: string): boolean => Array.isArray(array) && array.findIndex((a) => (Array.isArray(a) ? a : [a]).findIndex((b) => b === str) > -1) > -1;
        const findStrInArray = (array: string[] | undefined, str: string): boolean => Array.isArray(array) && array.findIndex((a) => a === str) > -1;

        const AccessModeSufficient = (() => {

            const isTextual = findStrInArrayArray(a11y_accessModeSufficient || [], "textual");
            return isTextual ? <li>{__("publication.accessibility.accessModeSufficient.textual")}</li> : undefined;
        })();

        const AccessibilityHazard = (() => {
            const isFlashing = findStrInArray(a11y_accessibilityHazard, "flashing");
            const isMotionSimulation = findStrInArray(a11y_accessibilityHazard, "motionSimulation");
            const isSound = findStrInArray(a11y_accessibilityHazard, "sound");
            const isNoFlashing = findStrInArray(a11y_accessibilityHazard, "noFlashingHazard");
            const isNoMotionSimulation = findStrInArray(a11y_accessibilityHazard, "noMotionSimulationHazard");
            const isNoSound = findStrInArray(a11y_accessibilityHazard, "noSoundHazard");
            const isNone = findStrInArray(a11y_accessibilityHazard, "none");
            const isUnknown = findStrInArray(a11y_accessibilityHazard, "unknown");

            return (isFlashing
                || isMotionSimulation
                || isSound
                || isNoFlashing
                || isNoMotionSimulation
                || isNoSound
                || isNone
                || isUnknown) ? <>
                {isFlashing ? <li>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.flashing")}</li> : <></>}
                {isMotionSimulation ? <li>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.motionSimulation")}</li> : <></>}
                {isSound ? <li>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.sound")}</li> : <></>}
                {isNoFlashing ? <li>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.noFlashing")}</li> : <></>}
                {isNoMotionSimulation ? <li>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.noMotionSimulation")}</li> : <></>}
                {isNoSound ? <li>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.noSound")}</li> : <></>}
                {isNone ? <li>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.none")}</li> : <></>}
                {isUnknown ? <li>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.unknown")}</li> : <></>}
            </> : undefined;
        })();

        const AccessibilitySummary = (() => {

            if (!a11y_accessibilitySummary) return undefined;

            const accessibilitySummaryLangStr = convertMultiLangStringToLangString(a11y_accessibilitySummary, this.props.locale);
            const accessibilitySummaryLang = accessibilitySummaryLangStr && accessibilitySummaryLangStr[0] ? accessibilitySummaryLangStr[0].toLowerCase() : "";
            const accessibilitySummaryIsRTL = langStringIsRTL(accessibilitySummaryLang);
            const accessibilitySummaryStr = accessibilitySummaryLangStr && accessibilitySummaryLangStr[1] ? accessibilitySummaryLangStr[1] : "";
            const accessibilitySummaryStrSanitized = accessibilitySummaryStr ? DOMPurify.sanitize(accessibilitySummaryStr).replace(/font-size:/g, "font-sizexx:") : "";

            return accessibilitySummaryStr ?
                <div className={classNames(stylesBlocks.description_see_more)}>
                    <div
                        ref={this.descriptionWrapperRef_a11y}
                        className={classNames(
                            stylesBookDetailsDialog.descriptionWrapper,
                            this.state.seeMore_a11y && stylesBookDetailsDialog.seeMore,
                        )}
                    >
                        <div
                            ref={this.descriptionRef_a11y}
                            className={stylesBookDetailsDialog.allowUserSelect}
                            dir={accessibilitySummaryIsRTL ? "rtl" : undefined}
                            dangerouslySetInnerHTML={{ __html: accessibilitySummaryStrSanitized }}
                        >
                        </div>
                    </div>
                </div>
                : undefined;
        })();

        const AccessibilityFeatureIsprintPageNumber = (() => {

            const isPrintPageNumbers = findStrInArray(a11y_accessibilityFeature, "printPageNumbers") || findStrInArray(a11y_accessibilityFeature, "pageBreakMarkers") || findStrInArray(a11y_accessibilityFeature, "pageNavigation"); // TODO separate printPageNumbers/pageBreakMarkers from pageNavigation (updated a11y metadata presentation guidelines?)
            return isPrintPageNumbers ? <li>{__("publication.accessibility.accessibilityFeature.printPageNumbers")}</li> : undefined;
        })();

        // TODO
        const AccessibilityFeatureIsDisplayTransformability = (() => {

            const isDisplayTransformability = findStrInArray(a11y_accessibilityFeature, "displayTransformability");
            return isDisplayTransformability ? <li>{__("publication.accessibility.accessibilityFeature.displayTransformability")}</li> : undefined;

        })();
        const AccessibilityFeatureIsSynchronizedAudioText = (() => {

            const isSynchronizedAudioText = findStrInArray(a11y_accessibilityFeature, "synchronizedAudioText");
            return isSynchronizedAudioText ? <li>{__("publication.accessibility.accessibilityFeature.synchronizedAudioText")}</li> : undefined;

        })();

        const AccessibilityFeature = (() => {
            const isLongDescription = findStrInArray(a11y_accessibilityFeature, "longDescription");
            // const isTableOfContents = findStrInArray(a11y_accessibilityFeature, "tableOfContents");
            // const isReadingOrders = findStrInArray(a11y_accessibilityFeature, "readingOrder");
            // const isAlternativeText = findStrInArray(a11y_accessibilityFeature, "alternativeText");

            return (
                isLongDescription
                // || isTableOfContents
                // || isReadingOrders
                // || isAlternativeText
            ) ? <>
                {isLongDescription ? <li>{__("publication.accessibility.accessibilityFeature.longDescription")}</li> : <></>}
                {/* {isTableOfContents ? <p>{__("publication.accessibility.accessibilityFeature.tableOfContents")}</p> : <></>} */}
                {/* {isReadingOrders ? <p>{__("publication.accessibility.accessibilityFeature.readingOrder")}</p> : <></>} */}
                {/* {isAlternativeText ? <p>{__("publication.accessibility.accessibilityFeature.alternativeText")}</p> : <></>} */}
            </> : undefined;
        })();

        const AccessibilityConformsTo = (() => {

            if (!(Array.isArray(a11y_conformsTo))) return undefined;
            return <>
                {
                    a11y_conformsTo.map((value, i) => {
                        if (!value) return <></>;
                        // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
                        if (isURL(value)) {
                            const label = value === "http://www.idpf.org/epub/a11y/accessibility-20170105.html#wcag-a"
                                ? "EPUB Accessibility 1.0 - WCAG 2.0 Level A"
                                : value === "http://www.idpf.org/epub/a11y/accessibility-20170105.html#wcag-aa"
                                    ? "EPUB Accessibility 1.0 - WCAG 2.0 Level AA"
                                    : value === "http://www.idpf.org/epub/a11y/accessibility-20170105.html#wcag-aaa"
                                        ? "EPUB Accessibility 1.0 - WCAG 2.0 Level AAA"
                                        : value;
                            return <li key={i}>{__("publication.accessibility.conformsTo")} {label}</li>;
                        }
                        return <li key={`conf-to${i}`}>{__("publication.accessibility.conformsTo")} {value}</li>;
                    })
                }
            </>;
        })();

        const AccessibilityConformanceReport = (() => {

            if (!(Array.isArray(a11y_certifierReport))) return undefined;
            return <>
                {
                    a11y_certifierReport.map((value, i) => {
                        if (!value) return <></>;
                        // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
                        if (isURL(value)) {
                            // onClick (which includes ENTER key) is not strictly necessary but it allows us to prevent SHIFT for new window, OPT/ALT for download hyperlink target
                            return <li key={i}><a
                            onClick={async (ev) => {
                                ev.preventDefault(); // necessary because href, see comment above
                                if (value && /^https?:\/\//.test(value)) { /* ignores file: mailto: data: thoriumhttps: httpsr2: thorium: opds: etc. */
                                    await shell.openExternal(value);
                                }
                            }}
                            href={value} title={value} aria-label={__("publication.accessibility.certifierReport")}>{__("publication.accessibility.certifierReport")}</a></li>;
                        }
                        return <li key={`certi-report${i}`}>{__("publication.accessibility.certifierReport")} {value}</li>;
                    })
                }
            </>;
        })();

        return (a11y_certifiedBy || a11y_certifierCredential || AccessibilityFeature || AccessibilityConformsTo || AccessibilityConformanceReport || AccessibilitySummary || AccessModeSufficient || AccessibilityHazard || AccessibilityFeatureIsprintPageNumber || AccessibilityFeatureIsDisplayTransformability || AccessibilityFeatureIsSynchronizedAudioText) ?
            <>
                {(AccessModeSufficient || AccessibilityHazard || AccessibilityFeatureIsprintPageNumber || AccessibilityFeatureIsSynchronizedAudioText || AccessibilityFeatureIsDisplayTransformability) ?
                    <ul className={stylePublication.accessibility_infos_left}>
                        {AccessModeSufficient ? AccessModeSufficient : <></>}
                        {AccessibilityFeatureIsprintPageNumber ? AccessibilityFeatureIsprintPageNumber : <></>}
                        {AccessibilityFeatureIsDisplayTransformability ? AccessibilityFeatureIsDisplayTransformability : <></>}
                        {AccessibilityFeatureIsSynchronizedAudioText ? AccessibilityFeatureIsSynchronizedAudioText : <></>}
                        {AccessibilityHazard ? AccessibilityHazard : <></>}
                    </ul>
                    : <></>}
                {(a11y_certifiedBy || a11y_certifierCredential || AccessibilityFeature || AccessibilityConformsTo || AccessibilityConformanceReport || AccessibilitySummary) ?
                    <div className={stylePublication.accessibility_infos_right}>
                        <details>
                        <summary>{__("publication.accessibility.moreInformation")}</summary>
                        <ul>
                            {AccessibilityFeature ? AccessibilityFeature : <></>}
                            {AccessibilityConformsTo ? AccessibilityConformsTo : <></>}
                            {AccessibilityConformanceReport ? AccessibilityConformanceReport : <></>}
                            {a11y_certifiedBy ? a11y_certifiedBy.map((v, i) => (<li key={`kCertBy${i}`} style={{ listStyleType: "none" }}>({v})</li>)) : <></>}
                            {a11y_certifierCredential ? a11y_certifierCredential.map((v, i) => (<li key={`kCertCred${i}`} style={{ listStyleType: "none" }}>({v})</li>)) : <></>}
                            {AccessibilitySummary}
                        </ul>
                        </details>
                    </div>
                    : <></>}
            </>
            : <p>{__("publication.accessibility.noA11y")}</p>;
    }

}

const mapStateToProps = (state: IRendererCommonRootState) => ({
    locale: state.i18n.locale, // refresh
});

export default connect(mapStateToProps)(withTranslator(PublicationInfoA11y));
