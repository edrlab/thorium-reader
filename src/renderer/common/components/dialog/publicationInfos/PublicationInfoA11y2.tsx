// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";

import * as React from "react";

import * as stylePublication from "readium-desktop/renderer/assets/styles/publicationInfos.scss";

import { TPublication } from "readium-desktop/common/type/publication.type";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { convertMultiLangStringToLangString, langStringIsRTL } from "readium-desktop/common/language-string";

import DOMPurify from "dompurify";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { shell } from "electron";
import isURL from "validator/lib/isURL";

// Logger
const debug = debug_("readium-desktop:renderer:publicationA11y");
debug("_");

export interface IProps {
    publicationViewMaybeOpds: TPublication;
}

const hasMatchingString = (
    array: string[] | undefined,
    str: string | string[],
): boolean =>
    Array.isArray(array) &&
    array.some(a => Array.isArray(str) ? str.includes(a) : a === str);

const hasContainingString = (
  array: string[] | undefined,
  value: string | string[],
): boolean =>
  Array.isArray(array) &&
  array.some(a =>
    Array.isArray(value)
      ? value.some(v => a.includes(v))
      : a.includes(value),
  );

export const PublicationInfoA11y2: React.FC<IProps> = ({publicationViewMaybeOpds}) => {

    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);

    /**
     * https://www.w3.org/community/reports/publishingcg/CG-FINAL-epub-techniques-20250422
     *
     * Display Techniques for EPUB Accessibility Metadata 2.0 Draft Community Group Report 14 April 2025
     */

    const is_fixed_layout = publicationViewMaybeOpds.isFixedLayoutPublication;
    const {
        a11y_accessMode,
        a11y_accessModeSufficient: a11y_accessModeSufficient_array_array,
        a11y_accessibilityFeature,
        a11y_accessibilityHazard,
        a11y_accessibilitySummary,
        a11y_conformsTo: a11y_conformsTo_,
        a11y_certifierReport: a11y_certifierReport_,
        a11y_certifiedBy: a11y_certifiedBy_,
        a11y_certifierCredential: a11y_certifierCredential_,
    } = publicationViewMaybeOpds;
    
    // (@property="schema:accessModeSufficient" and contains(normalize-space(), "textual"))]. 
    // parsed as [["textual", "visual"], ["auditory", "visual"]] and mapped to ["textual,visual", "auditory,visual"]
    const a11y_accessModeSufficient = (Array.isArray(a11y_accessModeSufficient_array_array) ? a11y_accessModeSufficient_array_array : [])
        .map((value) => Array.isArray(value) ? value.join(",") : value);
    const a11y_conformsTo = Array.isArray(a11y_conformsTo_) ? a11y_conformsTo_ : a11y_conformsTo_ ? [a11y_conformsTo_] : [];
    const a11y_certifierReport = Array.isArray(a11y_certifierReport_) ? a11y_certifierReport_ : a11y_certifierReport_ ? [a11y_certifierReport_] : [];
    const a11y_certifiedBy = Array.isArray(a11y_certifiedBy_) ? a11y_certifiedBy_ : a11y_certifiedBy_ ? [a11y_certifiedBy_] : [];
    const a11y_certifierCredential = Array.isArray(a11y_certifierCredential_) ? a11y_certifierCredential_ : a11y_certifierCredential_ ? [a11y_certifierCredential_] : [];

    // taken from previous a11y implementation src/renderer/common/components/dialog/publicationInfos/publicationInfoA11y.tsx:ln108
    let accessibilitySummaryStrSanitized = undefined;
    let accessibilitySummaryIsRTL = undefined;
    if (a11y_accessibilitySummary) {

        const accessibilitySummaryLangStr = convertMultiLangStringToLangString(a11y_accessibilitySummary, locale);
        const accessibilitySummaryLang = accessibilitySummaryLangStr && accessibilitySummaryLangStr[0] ? accessibilitySummaryLangStr[0].toLowerCase() : "";
        accessibilitySummaryIsRTL = langStringIsRTL(accessibilitySummaryLang);
        const accessibilitySummaryStr = accessibilitySummaryLangStr && accessibilitySummaryLangStr[1] ? accessibilitySummaryLangStr[1] : "";
        accessibilitySummaryStrSanitized = accessibilitySummaryStr ? DOMPurify.sanitize(accessibilitySummaryStr, { FORBID_TAGS: ["style"], FORBID_ATTR: ["style"] }).replace(/font-size:/g, "font-sizexx:") : "";

    }

    // https://www.w3.org/community/reports/publishingcg/CG-FINAL-epub-techniques-20250422#visual-adjustments
    const all_textual_content_can_be_modified = hasMatchingString(a11y_accessibilityFeature, "displayTransformability");

    // https://www.w3.org/community/reports/publishingcg/CG-FINAL-epub-techniques-20250422/#variables-setup-0

    // LET all_necessary_content_textual be the result of calling check for node on package_document, /package/metadata/meta[(@property="schema:accessMode" and normalize-space() = "textual" and count(//meta[@property="schema:accessMode"]) = 1) or (@property="schema:accessModeSufficient" and normalize-space()="textual")]. 
    const all_necessary_content_textual = (hasMatchingString(a11y_accessMode, "textual") && a11y_accessMode.length === 1)
        || hasMatchingString(a11y_accessModeSufficient, "textual");

    // LET audio_only_content be the result of calling check for node on package_document, /package/metadata/meta[@property="schema:accessMode" and normalize-space() = "auditory" and count(//meta[@property="schema:accessMode"]) = 1]. 
    const audio_only_content = hasMatchingString(a11y_accessMode, "auditory") && a11y_accessMode.length === 1;
    
    // LET some_sufficient_text be the result of calling check for node on package_document, /package/metadata/meta[(@property="schema:accessMode" and contains(normalize-space(), "textual")) or (@property="schema:accessModeSufficient" and contains(normalize-space(), "textual"))]. 
    const some_sufficient_text = hasContainingString(a11y_accessMode, "textual") || hasContainingString(a11y_accessModeSufficient, "textual");

    // LET textual_alternatives be the result of calling check for node on package_document, /package/metadata/meta[@property="schema:accessibilityFeature" and (normalize-space() = "longDescription" or normalize-space() = "alternativeText" or normalize-space() = "describedMath" or normalize-space() = "transcript")]. 
    const textual_alternatives = hasMatchingString(a11y_accessibilityFeature, ["longDescription", "alternativeText", "describedMath", "transcript"]);

    // LET visual_only_content be the result of calling check for node on package_document, /package/metadata/meta[(@property="schema:accessMode" and normalize-space() = "visual" and count(//meta[@property="schema:accessMode"]) = 1) and not(//meta[@property="schema:accessModeSufficient" and contains(normalize-space(), "textual")])]. 
    const visual_only_content = (hasMatchingString(a11y_accessMode, "visual") && a11y_accessMode.length === 1)
        && !hasContainingString(a11y_accessModeSufficient, "textual");

    // https://www.w3.org/community/reports/publishingcg/CG-FINAL-epub-techniques-20250422#prerecorded-audio
    const all_content_audio = hasMatchingString(a11y_accessModeSufficient, "auditory");
    const audio_content = hasMatchingString(a11y_accessMode, "auditory");
    const synchronised_pre_recorded_audio = hasMatchingString(a11y_accessibilityFeature, "synchronizedAudioText");

    const enableWaysOfReading = (is_fixed_layout || all_textual_content_can_be_modified || all_necessary_content_textual || some_sufficient_text || textual_alternatives || audio_only_content || visual_only_content || synchronised_pre_recorded_audio || all_content_audio || audio_content);

    // https://www.w3.org/community/reports/publishingcg/CG-FINAL-epub-techniques-20250422#navigation
    const table_of_contents_navigation = hasMatchingString(a11y_accessibilityFeature, "tableOfContents");
    const page_navigation = hasMatchingString(a11y_accessibilityFeature, "pageNavigation");
    const index_navigation = hasMatchingString(a11y_accessibilityFeature, "index");
    const next_previous_structural_navigation = hasMatchingString(a11y_accessibilityFeature, "structuralNavigation");


    const enableNavigation = (table_of_contents_navigation || index_navigation || page_navigation || next_previous_structural_navigation);

    // https://www.w3.org/community/reports/publishingcg/CG-FINAL-epub-techniques-20250422#rich-content
    const chemical_formula_as_latex = hasMatchingString(a11y_accessibilityFeature, "latex-chemistry");
    const chemical_formula_as_mathml = hasMatchingString(a11y_accessibilityFeature, "MathML-chemistry");
    const closed_captions = hasMatchingString(a11y_accessibilityFeature, "closedCaptions");
    const contains_math_formula = hasMatchingString(a11y_accessibilityFeature, "describedMath");
    const full_alternative_textual_descriptions = hasMatchingString(a11y_accessibilityFeature, "longDescriptions") || hasMatchingString(a11y_accessibilityFeature, "longDescription");
    const math_formula_as_latex = hasMatchingString(a11y_accessibilityFeature, "latex");
    const math_formula_as_mathml = hasMatchingString(a11y_accessibilityFeature, "MathML");
    const open_captions = hasMatchingString(a11y_accessibilityFeature, "openCaptions");
    const transcript = hasMatchingString(a11y_accessibilityFeature, "transcript");

    const enableRichContent = (chemical_formula_as_latex ||
                        chemical_formula_as_mathml ||
                        closed_captions ||
                        contains_math_formula ||
                        full_alternative_textual_descriptions ||
                        math_formula_as_latex ||
                        math_formula_as_mathml ||
                        open_captions ||
                        transcript);

    // https://www.w3.org/community/reports/publishingcg/CG-FINAL-epub-techniques-20250422#hazards
    const flashing_hazard = hasMatchingString(a11y_accessibilityHazard, "flashing");
    const motion_simulation_hazard = hasMatchingString(a11y_accessibilityHazard, "motionSimulation");
    const no_flashing_hazard = hasMatchingString(a11y_accessibilityHazard, "noFlashingHazard");
    const no_hazards_or_warnings_confirmed = hasMatchingString(a11y_accessibilityHazard, "none");
    const no_motion_hazard = hasMatchingString(a11y_accessibilityHazard, "noMotionSimulationHazard");
    const sound_hazard = hasMatchingString(a11y_accessibilityHazard, "sound");
    const no_sound_hazard = hasMatchingString(a11y_accessibilityHazard, "noSoundHazard");
    const unknown_flashing_hazard = hasMatchingString(a11y_accessibilityHazard, "unknownFlashingHazard");
    const unknown_if_contains_hazards = hasMatchingString(a11y_accessibilityHazard, "unknown");
    const unknown_motion_hazard = hasMatchingString(a11y_accessibilityHazard, "unknownMotionSimulationHazard");
    const unknown_sound_hazard = hasMatchingString(a11y_accessibilityHazard, "unknownSoundHazard");


    const enableHazard = (no_hazards_or_warnings_confirmed || no_flashing_hazard || no_motion_hazard || no_sound_hazard || unknown_if_contains_hazards || unknown_flashing_hazard || no_motion_hazard || no_sound_hazard || unknown_if_contains_hazards || unknown_flashing_hazard || unknown_motion_hazard || unknown_sound_hazard || flashing_hazard || motion_simulation_hazard || sound_hazard);


    // https://www.w3.org/community/reports/publishingcg/CG-FINAL-epub-techniques-20250422#conformance-group
    const conformanceResult: Array<{epub_version: string, wcag_version: string, wcag_level: string}> = [];
    for (const conformance of a11y_conformsTo) {
        const __conformanceMatch = conformance?.match(/^EPUB Accessibility (\d+\.\d+) - WCAG (\d+\.\d+) Level ([A]+)$/);
        const epub10_wcag20a = hasMatchingString(a11y_conformsTo, "http://www.idpf.org/epub/a11y/accessibility-20170105.html#wcag-a");
        const epub10_wcag20aa = hasMatchingString(a11y_conformsTo, "http://www.idpf.org/epub/a11y/accessibility-20170105.html#wcag-aa");
        const epub10_wcag20aaa = hasMatchingString(a11y_conformsTo, "http://www.idpf.org/epub/a11y/accessibility-20170105.html#wcag-aaa");
        let epub_version = undefined;
        let wcag_version = undefined;
        let wcag_level = undefined;
        if (__conformanceMatch) {
            [, epub_version, wcag_version, wcag_level] = __conformanceMatch;
        } else if (epub10_wcag20aaa) {
            epub_version = "1.0";
            wcag_version = "2.0";
            wcag_level = "AAA";
        } else if (epub10_wcag20aa) {
            epub_version = "1.0";
            wcag_version = "2.0";
            wcag_level = "AA";
        } else if (epub10_wcag20a) {
            epub_version = "1.0";
            wcag_version = "2.0";
            wcag_level = "A";
        }
        if (epub_version && wcag_level && wcag_version) {
            conformanceResult.push({epub_version, wcag_level, wcag_version});
        }
    }


    // const certifier_credentials = a11y_certifierCredential[0] || "";
    // const certifier = a11y_certifiedBy[0] || "";
    // const certifier_report = a11y_certifierReport[0] || "";
    // const certifier_date = "" // https://github.com/daisy/a11y-meta-viewer/blob/ab45abf9317e31fc187029c0e0b186d358780060/js/xpaths.js#L147 + interpolation localization issue https://github.com/w3c/publ-a11y/issues/688

    const enableConformance = !!conformanceResult.length;

    // https://www.w3.org/community/reports/publishingcg/CG-FINAL-epub-techniques-20250422#additional-accessibility-information
    const aria = hasMatchingString(a11y_accessibilityFeature, "aria");
    const audio_descriptions = hasMatchingString(a11y_accessibilityFeature, "audioDescription");
    const braille = hasMatchingString(a11y_accessibilityFeature, "braille");
    const full_ruby_annotations = hasMatchingString(a11y_accessibilityFeature, "fullRubyAnnotations");
    const high_contrast_between_foreground_and_background_audio = hasMatchingString(a11y_accessibilityFeature, "highContrastAudio");
    const high_contrast_between_text_and_background = hasMatchingString(a11y_accessibilityFeature, "highContrastDisplay");
    const large_print = hasMatchingString(a11y_accessibilityFeature, "largePrint");
    const page_break_markers = hasMatchingString(a11y_accessibilityFeature, "pageBreakMarkers") || hasMatchingString(a11y_accessibilityFeature, "printPageNumbers");
    const ruby_annotations = hasMatchingString(a11y_accessibilityFeature, "rubyAnnotations");
    const sign_language = hasMatchingString(a11y_accessibilityFeature, "signLanguage");
    const tactile_graphic = hasMatchingString(a11y_accessibilityFeature, "tactileGraphic");
    const tactile_object = hasMatchingString(a11y_accessibilityFeature, "tactileObject");
    const text_to_speech_hinting = hasMatchingString(a11y_accessibilityFeature, "ttsMarkup");
    // const print_page_numbers = findStrInArray(a11y_accessibilityFeature, "printPageNumbers");
    // Replaced by pageBreakMarkers
    // TODO: already declared in previous a11y implementation but not in https://www.w3.org/community/reports/publishingcg/CG-FINAL-epub-techniques-20250422 // declared in readium webpub manifest https://github.com/readium/webpub-manifest/blob/4c73f7323f9241e61bb919ecae2656a491ba15f6/schema/a11y.schema.json#L84

    const enableAdditionnals = (page_break_markers || aria || audio_descriptions || braille || full_ruby_annotations || high_contrast_between_foreground_and_background_audio || high_contrast_between_text_and_background || large_print || ruby_annotations || sign_language || tactile_graphic || tactile_object || text_to_speech_hinting);

    const enableSummaryDetail = accessibilitySummaryStrSanitized || enableAdditionnals || enableConformance || enableHazard || enableRichContent;

    // https://www.w3.org/community/reports/publishingcg/CG-FINAL-epub-techniques-20250422#legal-considerations
    // https://github.com/w3c/publ-a11y/issues/350
    // a11y:exemption metadata not implemented on models parsing https://github.com/readium/r2-shared-js/blob/3dbce230c09c00042b38d5dbc9ffba6f2420992e/src/models/metadata.ts#L99 https://github.com/readium/webpub-manifest/blob/4c73f7323f9241e61bb919ecae2656a491ba15f6/schema/a11y.schema.json#L18-L25

    const [__] = useTranslator();

    return (<>

        <style>{`
            .publicationInfoA11y2-icon {
                position: relative;
            }

            // .publicationInfoA11y2-icon::after {
            //     content: '';
            //     width: 1.2em;
            //     height: 1.2em;
            //     background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10' stroke='%23007bff' stroke-width='2' fill='none'/%3E%3Ctext x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23007bff'%3E?%3C/text%3E%3C/svg%3E");
            //     background-size: contain;
            //     position: absolute;
            //     right: -7px;
            //     top: 2px;
            // }

            .publicationInfoA11y2-title {
                font-size: 1em;
                margin-bottom: 5px;
            }

        `}</style>

        {enableWaysOfReading
            ? <><h5 className="publicationInfoA11y2-title">{__("publ-a11y-display-guide.ways-of-reading.ways-of-reading-title")}</h5>
                <ul className={stylePublication.accessibility_infos_left}>
                    <li className="publicationInfoA11y2-icon" title={all_textual_content_can_be_modified
                        ? __("publ-a11y-display-guide.ways-of-reading.ways-of-reading-visual-adjustments-modifiable.descriptive")
                        : is_fixed_layout
                            ? __("publ-a11y-display-guide.ways-of-reading.ways-of-reading-visual-adjustments-unmodifiable.descriptive")
                            : __("publ-a11y-display-guide.ways-of-reading.ways-of-reading-visual-adjustments-unknown.descriptive")}>
                        {all_textual_content_can_be_modified
                            ? __("publ-a11y-display-guide.ways-of-reading.ways-of-reading-visual-adjustments-modifiable.compact")
                            : is_fixed_layout
                                ? __("publ-a11y-display-guide.ways-of-reading.ways-of-reading-visual-adjustments-unmodifiable.compact")
                                : __("publ-a11y-display-guide.ways-of-reading.ways-of-reading-visual-adjustments-unknown.compact")}
                    </li>
                    <li className="publicationInfoA11y2-icon" title={all_necessary_content_textual
                        ? __("publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-readable.descriptive")
                        : some_sufficient_text || textual_alternatives
                            ? __("publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-not-fully.descriptive")
                            : audio_only_content || visual_only_content
                                ? __("publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-none.descriptive")
                                : __("publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-no-metadata.descriptive")}>
                        {all_necessary_content_textual
                            ? __("publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-readable.compact")
                            : some_sufficient_text || textual_alternatives
                                ? __("publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-not-fully.compact")
                                : audio_only_content || visual_only_content
                                    ? __("publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-none.compact")
                                    : __("publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-no-metadata.compact")}
                    </li>
                    {textual_alternatives ?
                        <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-alt-text.descriptive")}>
                            {__("publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-alt-text.compact")}
                        </li>
                        : <></>}
                    {(synchronised_pre_recorded_audio || all_content_audio || audio_content) ?
                        <li className="publicationInfoA11y2-icon" title={synchronised_pre_recorded_audio
                            ? __("publ-a11y-display-guide.ways-of-reading.ways-of-reading-prerecorded-audio-synchronized.descriptive")
                            : all_content_audio
                                ? __("publ-a11y-display-guide.ways-of-reading.ways-of-reading-prerecorded-audio-only.descriptive")
                                : __("publ-a11y-display-guide.ways-of-reading.ways-of-reading-prerecorded-audio-complementary.descriptive")}>
                            {synchronised_pre_recorded_audio
                                ? __("publ-a11y-display-guide.ways-of-reading.ways-of-reading-prerecorded-audio-synchronized.compact")
                                : all_content_audio
                                    ? __("publ-a11y-display-guide.ways-of-reading.ways-of-reading-prerecorded-audio-only.compact")
                                    : __("publ-a11y-display-guide.ways-of-reading.ways-of-reading-prerecorded-audio-complementary.compact")}
                        </li>
                        : <></>}
                </ul></>
            : <></>}
        {enableNavigation
            ? <><h5 className="publicationInfoA11y2-title">{__("publ-a11y-display-guide.navigation.navigation-title")}</h5>
                <ul className={stylePublication.accessibility_infos_left}>
                    {
                        enableNavigation
                            ? <>
                                {table_of_contents_navigation ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.navigation.navigation-toc.descriptive")}>
                                    {__("publ-a11y-display-guide.navigation.navigation-toc.compact")}
                                </li> : <></>}
                                {page_navigation ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.navigation.navigation-page-navigation.descriptive")}>
                                    {__("publ-a11y-display-guide.navigation.navigation-page-navigation.compact")}
                                </li> : <></>}
                                {next_previous_structural_navigation ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.navigation.navigation-structural.descriptive")}>
                                    {__("publ-a11y-display-guide.navigation.navigation-structural.compact")}
                                </li> : <></>}
                                {index_navigation ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.navigation.navigation-index.descriptive")}>
                                    {__("publ-a11y-display-guide.navigation.navigation-index.compact")}
                                </li> : <></>}
                            </>
                            : <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.navigation.navigation-no-metadata.descriptive")}>
                                {__("publ-a11y-display-guide.navigation.navigation-no-metadata.compact")}
                            </li>
                    }
                </ul></>
            : <></>}
        {enableSummaryDetail
            ? <><details>
                <summary>{__("publication.accessibility.moreInformation")}</summary>
                {enableRichContent
                    ? <><h5 className="publicationInfoA11y2-title">{__("publ-a11y-display-guide.rich-content.rich-content-title")}</h5>
                        <ul className={stylePublication.accessibility_infos_left}>
                            {
                                enableRichContent
                                    ? <>
                                        {full_alternative_textual_descriptions ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.rich-content.rich-content-extended.descriptive")}>
                                            {__("publ-a11y-display-guide.rich-content.rich-content-extended.compact")}
                                        </li> : <></>}
                                        {chemical_formula_as_latex ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.rich-content.rich-content-accessible-chemistry-as-latex.descriptive")}>
                                            {__("publ-a11y-display-guide.rich-content.rich-content-accessible-chemistry-as-latex.compact")}
                                        </li> : <></>}
                                        {chemical_formula_as_mathml ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.rich-content.rich-content-accessible-chemistry-as-mathml.descriptive")}>
                                            {__("publ-a11y-display-guide.rich-content.rich-content-accessible-chemistry-as-mathml.compact")}
                                        </li> : <></>}
                                        {contains_math_formula ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.rich-content.rich-content-accessible-math-described.descriptive")}>
                                            {__("publ-a11y-display-guide.rich-content.rich-content-accessible-math-described.compact")}
                                        </li> : <></>}
                                        {math_formula_as_latex ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.rich-content.rich-content-accessible-math-as-latex.descriptive")}>
                                            {__("publ-a11y-display-guide.rich-content.rich-content-accessible-math-as-latex.compact")}
                                        </li> : <></>}
                                        {math_formula_as_mathml ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.rich-content.rich-content-accessible-math-as-mathml.descriptive")}>
                                            {__("publ-a11y-display-guide.rich-content.rich-content-accessible-math-as-mathml.compact")}
                                        </li> : <></>}
                                        {closed_captions ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.rich-content.rich-content-closed-captions.descriptive")}>
                                            {__("publ-a11y-display-guide.rich-content.rich-content-closed-captions.compact")}
                                        </li> : <></>}
                                        {open_captions ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.rich-content.rich-content-open-captions.descriptive")}>
                                            {__("publ-a11y-display-guide.rich-content.rich-content-open-captions.compact")}
                                        </li> : <></>}
                                        {transcript ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.rich-content.rich-content-transcript.descriptive")}>
                                            {__("publ-a11y-display-guide.rich-content.rich-content-transcript.compact")}
                                        </li> : <></>}
                                    </>
                                    : <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.rich-content.rich-content-unknown.descriptive")}>
                                        {__("publ-a11y-display-guide.rich-content.rich-content-unknown.compact")}
                                    </li>
                            }
                        </ul></>
                    : <></>}
                <h5 className="publicationInfoA11y2-title">{__("publ-a11y-display-guide.hazards.hazards-title")}</h5>
                {enableHazard
                    ? <><ul className={stylePublication.accessibility_infos_left}>

                        {(no_hazards_or_warnings_confirmed || (no_flashing_hazard && no_motion_hazard && no_sound_hazard))
                            ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.hazards.hazards-none.descriptive")}>
                                {__("publ-a11y-display-guide.hazards.hazards-none.compact")}
                            </li>
                            : (unknown_if_contains_hazards || (unknown_flashing_hazard && unknown_motion_hazard && unknown_sound_hazard))
                                ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.hazards.hazards-unknown.descriptive")}>
                                    {__("publ-a11y-display-guide.hazards.hazards-unknown.compact")}
                                </li>
                                : (flashing_hazard ||
                                    motion_simulation_hazard ||
                                    sound_hazard ||
                                    no_flashing_hazard ||
                                    no_motion_hazard ||
                                    no_sound_hazard ||
                                    unknown_flashing_hazard ||
                                    unknown_motion_hazard ||
                                    unknown_sound_hazard
                                )
                                    ? <>
                                        {flashing_hazard ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.hazards.hazards-flashing.descriptive")}>
                                            {__("publ-a11y-display-guide.hazards.hazards-flashing.compact")}
                                        </li> : <></>}
                                        {motion_simulation_hazard ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.hazards.hazards-motion.descriptive")}>
                                            {__("publ-a11y-display-guide.hazards.hazards-motion.compact")}
                                        </li> : <></>}
                                        {sound_hazard ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.hazards.hazards-sound.descriptive")}>
                                            {__("publ-a11y-display-guide.hazards.hazards-sound.compact")}
                                        </li> : <></>}
                                        {unknown_flashing_hazard ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.hazards.hazards-flashing-unknown.descriptive")}>
                                            {__("publ-a11y-display-guide.hazards.hazards-flashing-unknown.compact")}
                                        </li> : <></>}
                                        {unknown_motion_hazard ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.hazards.hazards-motion-unknown.descriptive")}>
                                            {__("publ-a11y-display-guide.hazards.hazards-motion-unknown.compact")}
                                        </li> : <></>}
                                        {unknown_sound_hazard ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.hazards.hazards-sound-unknown.descriptive")}>
                                            {__("publ-a11y-display-guide.hazards.hazards-sound-unknown.compact")}
                                        </li> : <></>}
                                        {no_flashing_hazard ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.hazards.hazards-flashing-none.descriptive")}>
                                            {__("publ-a11y-display-guide.hazards.hazards-flashing-none.compact")}
                                        </li> : <></>}
                                        {no_motion_hazard ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.hazards.hazards-motion-none.descriptive")}>
                                            {__("publ-a11y-display-guide.hazards.hazards-motion-none.compact")}
                                        </li> : <></>}
                                        {no_sound_hazard ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.hazards.hazards-sound-none.descriptive")}>
                                            {__("publ-a11y-display-guide.hazards.hazards-sound-none.compact")}
                                        </li> : <></>}
                                    </>
                                    : <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.hazards.hazards-no-metadata.descriptive")}>
                                        {__("publ-a11y-display-guide.hazards.hazards-no-metadata.compact")}
                                    </li>
                        }
                    </ul></>
                    : <></>}
                {enableConformance
                    ? <><h5 className="publicationInfoA11y2-title">{__("publ-a11y-display-guide.conformance.conformance-title")}</h5>
                        <ul className={stylePublication.accessibility_infos_left}>
                            {enableConformance
                                ? <>
                                    {conformanceResult.reduce((pv, { wcag_level }) => pv.includes(wcag_level) ? pv : [...pv, wcag_level], []).map((wcag_level, i) => wcag_level === "AAA" ? <li key={"level_" + i} className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.conformance.conformance-aaa.descriptive")}>
                                        {__("publ-a11y-display-guide.conformance.conformance-aaa.compact")}
                                    </li> : wcag_level === "AA" ? <li key={"level_" + i} className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.conformance.conformance-aa.descriptive")}>
                                        {__("publ-a11y-display-guide.conformance.conformance-aa.compact")}
                                    </li> : wcag_level === "A" ? <li key={"level_" + i} className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.conformance.conformance-a.descriptive")}>
                                        {__("publ-a11y-display-guide.conformance.conformance-a.compact")}
                                    </li> : <li key={"level_" + i} className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.conformance.conformance-unknown-standard.descriptive")}>
                                        {__("publ-a11y-display-guide.conformance.conformance-unknown-standard.compact")}
                                    </li>)
                                    }
                                    {a11y_certifiedBy.length
                                        ? a11y_certifiedBy.map((certifier, i) => <li key={"certifier_" + i}>{
                                            // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
                                            certifier && isURL(certifier) ? <a title={certifier} onClick={async (e) => { e.preventDefault(); if (certifier && /^https?:\/\//.test(certifier)) { /* ignores file: mailto: data: thoriumhttps: httpsr2: thorium: opds: etc. */ await shell.openExternal(certifier); } }} href={certifier}>
                                            {__("publ-a11y-display-guide.conformance.conformance-details-certifier-report.compact")}
                                        </a> :
                                            __("publ-a11y-display-guide.conformance.conformance-certifier.compact") + " " + certifier
                                        }</li>)
                                        : <></>}
                                    {a11y_certifierCredential.length
                                        ? a11y_certifierCredential.map((certifier_credentials, i) => <li key={"certifier_credentials_" + i}>{
                                            // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
                                            certifier_credentials && isURL(certifier_credentials) ? <a title={certifier_credentials} onClick={async (e) => { e.preventDefault(); if (certifier_credentials && /^https?:\/\//.test(certifier_credentials)) { /* ignores file: mailto: data: thoriumhttps: httpsr2: thorium: opds: etc. */ await shell.openExternal(certifier_credentials); } }} href={certifier_credentials}>
                                            {__("publ-a11y-display-guide.conformance.conformance-details-certifier-report.compact")}
                                        </a> :
                                            __("publ-a11y-display-guide.conformance.conformance-certifier-credentials.compact") + " " + certifier_credentials
                                        }</li>)
                                        : <></>}
                                    {conformanceResult.map(({ epub_version, wcag_version, wcag_level }, i) => <li key={"conformance_" + i} className="publicationInfoA11y2-icon" title={
                                        __("publ-a11y-display-guide.conformance.conformance-details-claim.descriptive") + " " +
                                        (epub_version === "1.0" ? __("publ-a11y-display-guide.conformance.conformance-details-epub-accessibility-1-0.descriptive") + " " : epub_version === "1.1" ? __("publ-a11y-display-guide.conformance.conformance-details-epub-accessibility-1-1.descriptive") + " " : epub_version) +
                                        (wcag_version === "2.2" ? __("publ-a11y-display-guide.conformance.conformance-details-wcag-2-2.descriptive") + " " : wcag_version === "2.1" ? __("publ-a11y-display-guide.conformance.conformance-details-wcag-2-1.descriptive") + " " : wcag_version === "2.0" ? __("publ-a11y-display-guide.conformance.conformance-details-wcag-2-0.compact") + " " : wcag_version) +
                                        (wcag_level === "AAA" ? __("publ-a11y-display-guide.conformance.conformance-details-level-aaa.descriptive") : wcag_level === "AA" ? __("publ-a11y-display-guide.conformance.conformance-details-level-aa.descriptive") : wcag_level === "A" ? __("publ-a11y-display-guide.conformance.conformance-details-level-a.descriptive") : wcag_level)}>
                                        {__("publ-a11y-display-guide.conformance.conformance-details-claim.compact") + " " +
                                            (epub_version === "1.0" ? __("publ-a11y-display-guide.conformance.conformance-details-epub-accessibility-1-0.compact") + " " : epub_version === "1.1" ? __("publ-a11y-display-guide.conformance.conformance-details-epub-accessibility-1-1.compact") + " " : epub_version) +
                                            (wcag_version === "2.2" ? __("publ-a11y-display-guide.conformance.conformance-details-wcag-2-2.compact") + " " : wcag_version === "2.1" ? __("publ-a11y-display-guide.conformance.conformance-details-wcag-2-1.compact") + " " : wcag_version === "2.0" ? __("publ-a11y-display-guide.conformance.conformance-details-wcag-2-0.compact") + " " : wcag_version) +
                                            (wcag_level === "AAA" ? __("publ-a11y-display-guide.conformance.conformance-details-level-aaa.compact") : wcag_level === "AA" ? __("publ-a11y-display-guide.conformance.conformance-details-level-aa.compact") : wcag_level === "A" ? __("publ-a11y-display-guide.conformance.conformance-details-level-a.compact") : wcag_level)}
                                    </li>)}
                                    {a11y_certifierReport.length
                                        ? a11y_certifierReport.map((certifier_report, i) => <li key={"certifier_report_" + i} title={certifier_report}>{
                                            // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
                                            certifier_report && isURL(certifier_report) ? <a title={certifier_report} onClick={async (e) => { e.preventDefault(); if (certifier_report && /^https?:\/\//.test(certifier_report)) { /* ignores file: mailto: data: thoriumhttps: httpsr2: thorium: opds: etc. */ await shell.openExternal(certifier_report); } }} href={certifier_report}>
                                            {__("publ-a11y-display-guide.conformance.conformance-details-certifier-report.compact")}
                                        </a> : __("publ-a11y-display-guide.conformance.conformance-details-certifier-report.compact") + " " + certifier_report}</li>)
                                        : <></>}
                                </>
                                : <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.conformance.conformance-no.descriptive")}>
                                    {__("publ-a11y-display-guide.conformance.conformance-no.compact")}
                                </li>
                            }
                        </ul></>
                    : <></>}
                {enableAdditionnals
                    ? <>
                        <h5 className="publicationInfoA11y2-title">{__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-title")}</h5>
                        <ul className={stylePublication.accessibility_infos_left}>
                            {page_break_markers ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-page-breaks.descriptive")}>
                                {__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-page-breaks.compact")}
                            </li> : <></>}
                            {aria ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-aria.descriptive")}>
                                {__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-aria.compact")}
                            </li> : <></>}
                            {audio_descriptions ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-audio-descriptions.descriptive")}>
                                {__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-audio-descriptions.compact")}
                            </li> : <></>}
                            {braille ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-braille.descriptive")}>
                                {__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-braille.compact")}
                            </li> : <></>}
                            {full_ruby_annotations ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-full-ruby-annotations.descriptive")}>
                                {__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-full-ruby-annotations.compact")}
                            </li> : <></>}
                            {high_contrast_between_foreground_and_background_audio ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-high-contrast-between-foreground-and-background-audio.descriptive")}>
                                {__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-high-contrast-between-foreground-and-background-audio.compact")}
                            </li> : <></>}
                            {high_contrast_between_text_and_background ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-high-contrast-between-text-and-background.descriptive")}>
                                {__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-high-contrast-between-text-and-background.compact")}
                            </li> : <></>}
                            {large_print ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-large-print.descriptive")}>
                                {__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-large-print.compact")}
                            </li> : <></>}
                            {ruby_annotations ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-ruby-annotations.descriptive")}>
                                {__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-ruby-annotations.compact")}
                            </li> : <></>}
                            {sign_language ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-sign-language.descriptive")}>
                                {__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-sign-language.compact")}
                            </li> : <></>}
                            {tactile_graphic ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-tactile-graphics.descriptive")}>
                                {__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-tactile-graphics.compact")}
                            </li> : <></>}
                            {tactile_object ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-tactile-objects.descriptive")}>
                                {__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-tactile-objects.compact")}
                            </li> : <></>}
                            {text_to_speech_hinting ? <li className="publicationInfoA11y2-icon" title={__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-text-to-speech-hinting.descriptive")}>
                                {__("publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-text-to-speech-hinting.compact")}
                            </li> : <></>}
                        </ul>
                    </>
                    : <></>
                }
                {accessibilitySummaryStrSanitized ?
                    <><h5 className="publicationInfoA11y2-title">{__("publ-a11y-display-guide.accessibility-summary.accessibility-summary-title")}</h5><div
                        dir={accessibilitySummaryIsRTL ? "rtl" : undefined}
                        dangerouslySetInnerHTML={{ __html: accessibilitySummaryStrSanitized }}
                    ></div></>
                    : <></>
                }
            </details></>
            : <></>}
    </>);
};
