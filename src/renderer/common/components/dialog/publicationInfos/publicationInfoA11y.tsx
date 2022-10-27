// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as stylesBlocks from "readium-desktop/renderer/assets/styles/components/blocks.css";
import * as stylesBookDetailsDialog from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as debug_ from "debug";
import DOMPurify from "dompurify";
import * as React from "react";
import { TPublication } from "readium-desktop/common/type/publication.type";
import { convertMultiLangStringToString } from "readium-desktop/renderer/common/language-string";
import { TranslatorProps, withTranslator } from "../../hoc/translator";
// Logger
const debug = debug_("readium-desktop:renderer:publicationA11y");
debug("_");

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends TranslatorProps {
    publication: TPublication;
}

interface IState {
    seeMore_a11y: boolean;
    needSeeMore_a11y: boolean;
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
            needSeeMore_a11y: false,
        };
    }

    public componentDidMount() {
        setTimeout(this.needSeeMoreButton_a11y, 500);
    }

    public componentDidUpdate(prevProps: IProps) {

        if (this.props.publication !== prevProps.publication) {
            setTimeout(this.needSeeMoreButton_a11y, 500);
        }
    }

    public render() {

        const { __, publication } = this.props;
        const {
            a11y_accessModeSufficient,
            a11y_accessibilityFeature,
            a11y_accessibilityHazard,
            a11y_accessibilitySummary,
            a11y_conformsTo,
            a11y_certifierReport,
        } = publication;

        const findStrInArrayArray = (array: string[][], str: string): boolean => array?.findIndex((a) => a.findIndex((b) => b === str) > -1) > -1;
        const findStrInArray = (array: string[], str: string): boolean => array?.findIndex((a) => a === str) > -1;

        const AccessModeSufficient = (() => {

            const isTextual = findStrInArrayArray(a11y_accessModeSufficient || [], "textual");
            return isTextual ? <li>{__("publication.accessibility.accessModeSufficient.textual")}</li> : undefined;
        })();

        const AccessibilityHazard = (() => {
            const isFlashing = findStrInArray(a11y_accessibilityHazard, "flashing");
            const isMotion = findStrInArray(a11y_accessibilityHazard, "motion");
            const isSimulation = findStrInArray(a11y_accessibilityHazard, "simulation");
            const isSound = findStrInArray(a11y_accessibilityHazard, "sound");
            const isNoFlashing = findStrInArray(a11y_accessibilityHazard, "no flashing");
            const isNoMotion = findStrInArray(a11y_accessibilityHazard, "no motion");
            const isNoSimulation = findStrInArray(a11y_accessibilityHazard, "no simulation");
            const isNoSound = findStrInArray(a11y_accessibilityHazard, "no sound");
            const isNone = findStrInArray(a11y_accessibilityHazard, "none");
            const isUnknown = findStrInArray(a11y_accessibilityHazard, "unknown");

            return (isFlashing
            || isMotion
            || isSimulation
            || isSound
            || isNoFlashing
            || isNoMotion
            || isNoSimulation
            || isNoSound
            || isNone
            || isUnknown) ? <>
            {isFlashing ? <li>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.flashing")}</li> : <></>}
            {isMotion ? <li>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.motion")}</li> : <></>}
            {isSimulation ? <li>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.simulation")}</li> : <></>}
            {isSound ? <li>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.sound")}</li> : <></>}
            {isNoFlashing ? <li>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.noFlashing")}</li> : <></>}
            {isNoMotion ? <li>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.noMotion")}</li> : <></>}
            {isNoSimulation ? <li>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.noSimulation")}</li> : <></>}
            {isNoSound ? <li>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.noSound")}</li> : <></>}
            {isNone ? <li>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.none")}</li> : <></>}
            {isUnknown ? <li>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.unknown")}</li> : <></>}
            </> : undefined;
        })();

        const AccessibiltySummary = (() => {

            if (!a11y_accessibilitySummary) return undefined;

            let textSanitize_a11y = "";
            const [, text] = convertMultiLangStringToString(this.props.translator, a11y_accessibilitySummary);
            if (text) {
                textSanitize_a11y = DOMPurify.sanitize(text).replace(/font-size:/g, "font-sizexx:");
            }

            return textSanitize_a11y ?
                <div className={classNames(stylesBlocks.block_line, stylesBlocks.description_see_more)}>
                    <div
                        ref={this.descriptionWrapperRef_a11y}
                        className={classNames(
                            stylesBookDetailsDialog.descriptionWrapper,
                            this.state.needSeeMore_a11y && stylesGlobal.mb_30,
                            this.state.needSeeMore_a11y && stylesBookDetailsDialog.hideEnd,
                            this.state.seeMore_a11y && stylesBookDetailsDialog.seeMore,
                        )}
                    >
                        <div
                            ref={this.descriptionRef_a11y}
                            className={stylesBookDetailsDialog.allowUserSelect}
                            dangerouslySetInnerHTML={{ __html: textSanitize_a11y }}
                        >
                        </div>
                    </div>
                    {
                        this.state.needSeeMore_a11y &&
                        <button aria-hidden className={stylesButtons.button_see_more} onClick={this.toggleSeeMore_a11y}>
                            {
                                this.state.seeMore_a11y
                                    ? __("publication.seeLess")
                                    : __("publication.seeMore")
                            }
                        </button>
                    }
                </div>
                : undefined;
        })();

        const AccessibilityFeatureIsprintPageNumber = (() => {

            const isPrintPageNumbers = findStrInArray(a11y_accessibilityFeature, "printPageNumbers");
            return isPrintPageNumbers ? <li>{__("publication.accessibility.accessibilityFeature.printPageNumbers")}</li> : undefined;

        })();
        const AccessibilityFeatureIsDisplayTransformability = (() => {

            const isDisplayTransformability = findStrInArray(a11y_accessibilityFeature, "displayTransformability");
            return isDisplayTransformability ? <li>{__("publication.accessibility.accessibilityFeature.displayTransformability")}</li> : undefined;

        })();
        const AccessibilityFeatureIsSynchronizedAudioText = (() => {

            const isSynchronizedAudioText = findStrInArray(a11y_accessibilityFeature, "synchronizedAudioText") ;
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

            if (!(Array.isArray(a11y_conformsTo) && a11y_conformsTo[0])) return undefined;
            return <li>{a11y_conformsTo[0]}</li>;
        })();

        const AccessibilityConformanceReport = (() => {

            if (!(Array.isArray(a11y_certifierReport) && a11y_certifierReport[0])) return undefined;
            return <li>{a11y_certifierReport[0]}</li>; // url !?
        })();

        return (AccessModeSufficient || AccessibilityHazard) ? <>
            <ul style={{ listStyleType: "none" }}>
                {AccessModeSufficient ? AccessModeSufficient : <></>}
                {AccessibilityFeatureIsprintPageNumber ? AccessibilityFeatureIsprintPageNumber : <></>}
                {AccessibilityFeatureIsDisplayTransformability ? AccessibilityFeatureIsDisplayTransformability : <></>}
                {AccessibilityFeatureIsSynchronizedAudioText ? AccessibilityFeatureIsSynchronizedAudioText : <></>}
                {AccessibilityHazard ? AccessibilityHazard : <></>}
            </ul>
            <div>

                <details>
                    <summary>{__("publication.accessibility.moreInformation")}</summary>
                    <ul style={{ listStyleType: "none" }}>
                        {AccessibilityFeature ? AccessibilityFeature : <></>}
                        {AccessibilityConformsTo ? <li>{AccessibilityConformsTo}</li> : <></>}
                        {AccessibilityConformanceReport ? <li>{AccessibilityConformanceReport}</li> : <></>}
                        {AccessibiltySummary}
                    </ul>
                </details>
            </div>
        </> : <p>{__("publication.accessibility.noA11y")}</p>;
    }

    private needSeeMoreButton_a11y = () => {
        if (!this.descriptionWrapperRef_a11y?.current || !this.descriptionRef_a11y?.current) {
            return;
        }
        const need = this.descriptionWrapperRef_a11y.current.offsetHeight < this.descriptionRef_a11y.current.offsetHeight;
        this.setState({ needSeeMore_a11y: need });
    };

    private toggleSeeMore_a11y = () =>
        this.setState({
            seeMore_a11y: !this.state.seeMore_a11y,
        });

}

export default withTranslator(PublicationInfoA11y);
