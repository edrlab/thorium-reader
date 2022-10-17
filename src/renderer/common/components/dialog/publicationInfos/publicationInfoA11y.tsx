// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
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

export class PublicationInfoA11y extends React.Component<IProps, {}> {

    constructor(props: IProps) {
        super(props);

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

        const findStrInArrayArray = (array: string[][], str: string): boolean => array.findIndex((a) => a.findIndex((b) => b === str) > -1) > -1;
        const findStrInArray = (array: string[], str: string): boolean => array.findIndex((a) => a === str) > -1;

        const AccessModeSufficient = (() => {

            const isTextual = findStrInArrayArray(a11y_accessModeSufficient, "textual");
            return isTextual ? <p>{__("publication.accessibility.accessModeSufficient.textual")}</p> : undefined;
        })();

        const AccessibilityFeature = (() => {
            const isDisplayTransformability = findStrInArray(a11y_accessibilityFeature, "displayTransformability");
            const isSynchronizedAudioText = findStrInArray(a11y_accessibilityFeature, "synchronizedAudioText") ;
            const isPrintPageNumbers = findStrInArray(a11y_accessibilityFeature, "printPageNumbers");
            const isLongDescription = findStrInArray(a11y_accessibilityFeature, "longDescription");
            const isTableOfContents = findStrInArray(a11y_accessibilityFeature, "tableOfContents");
            const isReadingOrders = findStrInArray(a11y_accessibilityFeature, "readingOrder");
            const isAlternativeText = findStrInArray(a11y_accessibilityFeature, "alternativeText");

            return isDisplayTransformability
                || isSynchronizedAudioText
                || isPrintPageNumbers
                || isLongDescription
                || isTableOfContents
                || isReadingOrders
                || isAlternativeText ? <>
                {isDisplayTransformability ? <p>{__("publication.accessibility.accessibilityFeature.displayTransformability")}</p> : <></>}
                {isSynchronizedAudioText ? <p>{__("publication.accessibility.accessibilityFeature.synchronizedAudioText")}</p> : <></>}
                {isPrintPageNumbers ? <p>{__("publication.accessibility.accessibilityFeature.printPageNumbers")}</p> : <></>}
                {isLongDescription ? <p>{__("publication.accessibility.accessibilityFeature.longDescription")}</p> : <></>}
                {/* {isTableOfContents ? <p>{__("publication.accessibility.accessibilityFeature.tableOfContents")}</p> : <></>} */}
                {/* {isReadingOrders ? <p>{__("publication.accessibility.accessibilityFeature.readingOrder")}</p> : <></>} */}
                {/* {isAlternativeText ? <p>{__("publication.accessibility.accessibilityFeature.alternativeText")}</p> : <></>} */}
            </> : undefined;
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

            return isFlashing
            || isMotion
            || isSimulation
            || isSound
            || isNoFlashing
            || isNoMotion
            || isNoSimulation
            || isNoSound
            || isNone
            || isUnknown ? <>
            {isFlashing ? <p>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.flashing")}</p> : <></>}
            {isMotion ? <p>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.motion")}</p> : <></>}
            {isSimulation ? <p>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.simulation")}</p> : <></>}
            {isSound ? <p>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.sound")}</p> : <></>}
            {isNoFlashing ? <p>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.noFlashing")}</p> : <></>}
            {isNoMotion ? <p>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.noMotion")}</p> : <></>}
            {isNoSimulation ? <p>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.noSimulation")}</p> : <></>}
            {isNoSound ? <p>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.noSound")}</p> : <></>}
            {isNone ? <p>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.none")}</p> : <></>}
            {isUnknown ? <p>{__("publication.accessibility.accessibilityHazard.name")} {__("publication.accessibility.accessibilityHazard.unknown")}</p> : <></>}
            </> : <></>;
        })();

        const AccessibiltySummary = (() => {

            if (!a11y_accessibilitySummary) return undefined;
            const [, text] = convertMultiLangStringToString(this.props.translator, a11y_accessibilitySummary);

            return <p>{text}</p>;
        })();

        const AccessibilityConformsTo = (() => {

            if (!Array.isArray(a11y_conformsTo) || a11y_conformsTo[0]) return undefined;
            return <p>a11y_conformsTo[0]</p>;
        })();

        const AccessibilityConformanceReport = (() => {

            if (!Array.isArray(a11y_certifierReport) || a11y_certifierReport[0]) return undefined;
            return <p>a11y_certifierReport[0]</p>; // url !?
        })();

        return AccessModeSufficient || AccessibilityFeature || AccessibilityHazard ? <>
            <div>
                {AccessibilityFeature ? AccessibilityFeature : <></>}
                {AccessModeSufficient ? AccessModeSufficient : <></>}
                {AccessibilityHazard ? AccessibilityHazard : <></>}
            </div>
            <div>

                <details>
                    <summary>{__("publication.accessibility.moreInformation")}</summary>
                    <ul style={{ listStyleType: "none" }}>
                        <li>{AccessibilityConformsTo}</li>
                        <li>{AccessibilityConformanceReport}</li>
                        {AccessibiltySummary}
                    </ul>
                </details>
            </div>
        </> : <p>{__("publication.accessibility.noA11y")}</p>;
    }

}

export default withTranslator(PublicationInfoA11y);
