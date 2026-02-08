// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export const ENABLE_EXTRA_COLUMN_SHIFT_METHOD = false;

export enum WebViewSlotEnum {
    center = "center",
    left = "left",
    right = "right",
}

export const EXTRA_COLUMN_PAD_ID = "r2-extra-column-pad";

export const CLASS_VWM = "r2-class-VWM";

export const CLASS_PAGINATED = "r2-css-paginated";

export const HIDE_CURSOR_CLASS = "r2-hideCursor";

export const ZERO_TRANSFORM_CLASS = "r2-zeroTransform";
export const ENABLE_SKIP_LINK = false;
export const SKIP_LINK_ID = "r2-skip-link";
export const LINK_TARGET_CLASS = "r2-link-target";
export const LINK_TARGET_ALT_CLASS = "r2-link-target-alt";

export const DISABLE_TEMPORARY_NAV_TARGET_OUTLINE_CLASS = "r2-no-link-target-temp-highlight";

export const ROOT_CLASS_REDUCE_MOTION = "r2-reduce-motion";
export const ROOT_CLASS_MATHJAX = "r2-mathjax";

export const ROOT_CLASS_FIXED_LAYOUT = "r2-fixed-layout";
export const ROOT_CLASS_NO_FOOTNOTES = "r2-no-popup-foonotes";
export const ROOT_CLASS_NO_RUBY = "r2-no-ruby";
export const FOOTNOTES_CONTAINER_CLASS = "r2-footnote-container";
export const FOOTNOTES_CLOSE_BUTTON_CLASS = "r2-footnote-close";
export const FOOTNOTE_FORCE_SHOW = "r2-footnote-force-show";

export const POPOUTIMAGE_CONTAINER_ID = "r2-popoutimage-container-id";
export const POPOUTIMAGE_CLOSE_ID = "r2-popoutimage-close-id";
export const POPOUTIMAGE_CONTROLS_ID = "r2-popoutimage-controls-id";
export const POPOUTIMAGE_MINUS_ID = "r2-popoutimage-minus-id";
export const POPOUTIMAGE_PLUS_ID = "r2-popoutimage-plus-id";
export const POPOUTIMAGE_RESET_ID = "r2-popoutimage-reset-id";

export const POPUP_DIALOG_CLASS = "r2-popup-dialog";
export const POPUP_DIALOG_CLASS_COLLAPSE = "r2-popup-dialog-collapse";

export const ROOT_CLASS_KEYBOARD_INTERACT = "r2-keyboard-interact";
export const CSS_CLASS_NO_FOCUS_OUTLINE = "r2-no-focus-outline";

// 'a' element: noteref biblioref glossref annoref
//
// @namespace epub "http://www.idpf.org/2007/ops";
// [epub|type~="footnote"]
// VS.
// *[epub\\:type~="footnote"]
//
// :root:not(.${ROOT_CLASS_NO_FOOTNOTES}) aside[epub|type~="biblioentry"],
// :root:not(.${ROOT_CLASS_NO_FOOTNOTES}) aside[epub|type~="annotation"]
export const footnotesCssStyles = `
@namespace epub "http://www.idpf.org/2007/ops";

/* TODO: allowlist for DIV etc. ... or blocklist for SPAN etc. ?*/
div[epub|type~="pagebreak"]:empty {
    line-height: 0 !important;
}
div[role~="doc-pagebreak"]:empty {
    line-height: 0 !important;
}
*[epub|type~="pagebreak"]:empty::before {
    display: contents;
    /*display: inline-block;*/
    content: "\\feff" /* zero width nbsp, instead of &#160; &nbsp; */
}
*[role~="doc-pagebreak"]:empty::before {
    display: contents;
    /*display: inline-block;*/
    content: "\\feff" /* zero width nbsp, instead of &#160; &nbsp; */
}

:root:not(.${ROOT_CLASS_NO_FOOTNOTES}) aside[epub|type~="footnote"]:not(.${FOOTNOTE_FORCE_SHOW}),
:root:not(.${ROOT_CLASS_NO_FOOTNOTES}) aside[epub|type~="note"]:not(.${FOOTNOTE_FORCE_SHOW}),
:root:not(.${ROOT_CLASS_NO_FOOTNOTES}) aside[epub|type~="endnote"]:not(.${FOOTNOTE_FORCE_SHOW}),
:root:not(.${ROOT_CLASS_NO_FOOTNOTES}) aside[epub|type~="rearnote"]:not(.${FOOTNOTE_FORCE_SHOW}) {
    display: none;
}

/*
:root.${POPUP_DIALOG_CLASS} {
    overflow: hidden !important;
}
*/

:root[style] dialog#${POPUP_DIALOG_CLASS}:not(.${POPUP_DIALOG_CLASS_COLLAPSE})::backdrop,
:root dialog#${POPUP_DIALOG_CLASS}:not(.${POPUP_DIALOG_CLASS_COLLAPSE})::backdrop {
    background: rgba(0, 0, 0, 0.3) !important;
}
:root[style*="readium-night-on"] dialog#${POPUP_DIALOG_CLASS}:not(.${POPUP_DIALOG_CLASS_COLLAPSE})::backdrop {
    background: rgba(0, 0, 0, 0.65) !important;
}
:root[style] dialog#${POPUP_DIALOG_CLASS}.${POPUP_DIALOG_CLASS_COLLAPSE}::backdrop,
:root dialog#${POPUP_DIALOG_CLASS}.${POPUP_DIALOG_CLASS_COLLAPSE}::backdrop {
    background: transparent !important;
}

:root[style] dialog#${POPUP_DIALOG_CLASS},
:root dialog#${POPUP_DIALOG_CLASS} {
    -webkit-writing-mode: horizontal-tb;

    z-index: 3;

    position: fixed;

    width: 90%;
    max-width: 40em;

    top: auto;
    bottom: 1em;
    height: 7em;

    margin: 0 auto;
    padding: 0;

    border-radius: 0.3em;
    border-width: 1px;

    background: white !important;
    border-color: black !important;

    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);

    display: grid;
    grid-column-gap: 0px;
    grid-row-gap: 0px;

    grid-template-columns: 1.5em auto 1.5em;
    grid-template-rows: auto 1.5em;
}
:root[style*="readium-night-on"] dialog#${POPUP_DIALOG_CLASS} {
    background: #333333 !important;
    border-color: white !important;
}
:root[style*="readium-sepia-on"] dialog#${POPUP_DIALOG_CLASS} {
    background: var(--RS__backgroundColor) !important;
}
:root[style*="--USER__backgroundColor"] dialog#${POPUP_DIALOG_CLASS} {
    background: var(--USER__backgroundColor) !important;
}

:root[style] dialog#${POPUP_DIALOG_CLASS}.${POPUP_DIALOG_CLASS_COLLAPSE},
:root dialog#${POPUP_DIALOG_CLASS}.${POPUP_DIALOG_CLASS_COLLAPSE} {
    top: auto;
    height: 1px;
}

:root[style] div#${POPOUTIMAGE_CONTAINER_ID},
:root div#${POPOUTIMAGE_CONTAINER_ID},
:root[style].${ROOT_CLASS_KEYBOARD_INTERACT} div#${POPOUTIMAGE_CONTAINER_ID},
:root.${ROOT_CLASS_KEYBOARD_INTERACT} div#${POPOUTIMAGE_CONTAINER_ID} {
    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 1;
    grid-row-end: 3;

    /*
    outline-color: magenta !important;
    outline-style: dotted !important;
    outline-width: 4px !important;
    outline-offset: -4px !important;
    */

    padding: 0;
    margin: 0;

    box-sizing: border-box;

    cursor: pointer;

    /* position: relative; */

    display: flex;
    /* no need for vertical / horizontal control, as we use margin:auto
    justify-content: center;
    align-items: center;
    */

    /* FXL, just in case the top-level transform scale isn't applied */
    overflow-y: auto;
    overflow-x: auto;
}

@keyframes readium2ElectronAnimation_IMG_OUTLINE {
    0% {
        outline-offset: -0.4em;
    }
    25% {
        outline-offset: 0em;
    }
    50% {
        outline-offset: 0.8em;
    }
    75% {
        outline-offset: 0em;
    }
    100% {
        outline-offset: -0.4em;
    }
}

/*
:root[style].${ROOT_CLASS_KEYBOARD_INTERACT} img[data-${POPOUTIMAGE_CONTAINER_ID}],
:root.${ROOT_CLASS_KEYBOARD_INTERACT} img[data-${POPOUTIMAGE_CONTAINER_ID}],
:root[style].${ROOT_CLASS_KEYBOARD_INTERACT} image[data-${POPOUTIMAGE_CONTAINER_ID}],
:root.${ROOT_CLASS_KEYBOARD_INTERACT} image[data-${POPOUTIMAGE_CONTAINER_ID}],
:root[style].${ROOT_CLASS_KEYBOARD_INTERACT} svg[data-${POPOUTIMAGE_CONTAINER_ID}],
:root.${ROOT_CLASS_KEYBOARD_INTERACT} svg[data-${POPOUTIMAGE_CONTAINER_ID}]
*/

:root[style] img[data-${POPOUTIMAGE_CONTAINER_ID}],
:root img[data-${POPOUTIMAGE_CONTAINER_ID}],
:root[style] image[data-${POPOUTIMAGE_CONTAINER_ID}],
:root image[data-${POPOUTIMAGE_CONTAINER_ID}],
:root[style] svg[data-${POPOUTIMAGE_CONTAINER_ID}],
:root svg[data-${POPOUTIMAGE_CONTAINER_ID}]
{
    outline-color: magenta !important;
    outline-style: solid !important;
    outline-width: 0.2em !important;
    /* outline-offset: 2px !important; */

    cursor: pointer !important;

    animation-name: readium2ElectronAnimation_IMG_OUTLINE;
    animation-iteration-count: infinite;
    animation-duration: 1s;
    animation-delay: 0s;
    animation-fill-mode: forwards;
    animation-timing-function: linear;
}

/*
:root[style*="readium-night-on"]
*/
:root[style] div#${POPOUTIMAGE_CONTAINER_ID} #${POPOUTIMAGE_CONTROLS_ID},
:root div#${POPOUTIMAGE_CONTAINER_ID} #${POPOUTIMAGE_CONTROLS_ID} {
    border: 1px solid var(--RS__backgroundColor) !important;
    background: transparent !important;
    color: var(--RS__textColor) !important;
    padding: 4px;
    margin: 0;
    border-radius: 16px;
    position: absolute;
    top: 8px;
    left: 8px;
    width: auto;
    height: auto;
}
:root[style]:not([style*="--USER__"]) div#${POPOUTIMAGE_CONTAINER_ID} #${POPOUTIMAGE_CONTROLS_ID},
:root:not([style]) div#${POPOUTIMAGE_CONTAINER_ID} #${POPOUTIMAGE_CONTROLS_ID} {
    border: 1px solid black !important;
    background: white !important;
    color: black !important;
}

:root[style] div#${POPOUTIMAGE_CONTAINER_ID} #${POPOUTIMAGE_CLOSE_ID},
:root div#${POPOUTIMAGE_CONTAINER_ID} #${POPOUTIMAGE_CLOSE_ID} {
    position: absolute;
    top: 8px;
    right: 8px;
}
:root[style] div#${POPOUTIMAGE_CONTAINER_ID} button,
:root div#${POPOUTIMAGE_CONTAINER_ID} button {
    border: 2px solid var(--RS__textColor) !important;
    background: var(--RS__backgroundColor) !important;
    color: var(--RS__textColor) !important;
    font-family: Arial !important;
    font-size: 20px !important;
    font-weight: bold;
    user-select: none;
    padding: 8px;
    margin: 0;
    border-radius: 16px;
    width: 36px;
    display: inline-block;
    cursor: pointer !important;
}
:root[style]:not([style*="--USER__"]) div#${POPOUTIMAGE_CONTAINER_ID} button,
:root:not([style]) div#${POPOUTIMAGE_CONTAINER_ID} button {
    border: 2px solid black !important;
    background: white !important;
    color: black !important;
}

:root[style] div#${POPOUTIMAGE_CONTAINER_ID} > img,
:root div#${POPOUTIMAGE_CONTAINER_ID} > img {

    /*
    outline-color: red !important;
    outline-style: dashed !important;
    outline-width: 2px !important;
    outline-offset: -2px !important;
    */

    transform-origin: 0px 0px;

    box-sizing: border-box;
    /* border: 2px solid #333333; */

    cursor: move !important;

    margin: 0 !important;
    object-fit: contain !important;
    position: relative !important;
    max-height: 100% !important;
    max-width: 100% !important;
    width: 100% !important;
    height: 100% !important;

    /*
    margin: auto !important;
    object-fit: cover !important;
    position: relative !important;
    max-height: 100% !important;
    max-width: 100% !important;
    width: auto !important;
    height: auto !important;
    */

    /* vertical centering breaks image height
    margin: auto !important;
    position: absolute !important;
    max-height: none !important;
    max-width: 100% !important;
    width: 100% !important;
    height: auto !important;

    top: 0 !important;
    bottom: 0 !important;
    */

    /* this works with position:relative in the parent (no need for flex)
    max-height: 100% !important;
    max-width: 100% !important;
    width: auto !important;
    height: auto !important;

    position: absolute !important;
    top: 0 !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    margin: auto !important;
    */
}

:root[style] .${FOOTNOTES_CONTAINER_CLASS},
:root .${FOOTNOTES_CONTAINER_CLASS} {
    overflow: auto;

    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 1;
    grid-row-end: 3;

    padding: 0.3em;
    margin: 0.2em;
}

:root[style] .${FOOTNOTES_CONTAINER_CLASS} > *,
:root .${FOOTNOTES_CONTAINER_CLASS} > * {
    margin: 0 !important;
    padding: 0 !important;
    width: 100%;
}

/*
https://github.com/edrlab/thorium-reader/issues/2478#issuecomment-2304782942
:root[style] .${FOOTNOTES_CONTAINER_CLASS} a[epub|type~="backlink"],
:root .${FOOTNOTES_CONTAINER_CLASS} a[epub|type~="backlink"],
:root[style] .${FOOTNOTES_CONTAINER_CLASS} a[role~="doc-backlink"],
:root .${FOOTNOTES_CONTAINER_CLASS} a[role~="doc-backlink"] {
    display: none !important;
}
*/

/*
:root[style] .${FOOTNOTES_CLOSE_BUTTON_CLASS},
:root .${FOOTNOTES_CLOSE_BUTTON_CLASS} {
    border: 1px solid black;
    background: white !important;
    color: black !important;

    border-radius: 0.8em;
    position: absolute;
    top: -0.9em;
    left: -0.9em;
    width: 1.8em;
    height: 1.8em;
    font-size: 1em !important;
    font-family: Arial !important;
    cursor: pointer;
}
:root[style*="readium-night-on"] .${FOOTNOTES_CLOSE_BUTTON_CLASS} {
    border: 1px solid white !important;
    background: black !important;
    color: white !important;
}
*/
`;

export const R2_MO_CLASS_ACTIVE = "r2-mo-active";
export const R2_MO_CLASS_ACTIVE_PLAYBACK = "r2-mo-active-playback";

export const R2_MO_CLASS_PLAYING = "r2-mo-playing";
export const R2_MO_CLASS_PAUSED = "r2-mo-paused";
export const R2_MO_CLASS_STOPPED = "r2-mo-stopped";

export const mediaOverlaysCssStyles = `
:root[style] .${R2_MO_CLASS_ACTIVE},
:root .${R2_MO_CLASS_ACTIVE} {
    background-color: yellow !important;
    color: black !important;
}
:root[style*="readium-night-on"] .${R2_MO_CLASS_ACTIVE} {
    background-color: #333333 !important;
    color: white !important;
}
:root[style*="readium-sepia-on"] .${R2_MO_CLASS_ACTIVE} {
    background-color: silver !important;
    color: black !important;
}
`;

export const TTS_CLASS_THEME1 = "r2-tts-theme1";
export const TTS_CLASS_IS_ACTIVE = "r2-tts-isPlaying"; // TTS overlay, not in-document! (legacy)
export const TTS_CLASS_PAUSED = "r2-tts-paused";
export const TTS_CLASS_PLAYING = "r2-tts-playing";
export const TTS_CLASS_STOPPED = "r2-tts-stopped";
export const TTS_ID_PREVIOUS = "r2-tts-previous";
export const TTS_ID_NEXT = "r2-tts-next";
export const TTS_ID_SLIDER = "r2-tts-slider";
export const TTS_ID_ACTIVE_WORD = "r2-tts-active-word";
export const TTS_ID_ACTIVE_UTTERANCE = "r2-tts-active-utterance";
export const TTS_CLASS_UTTERANCE = "r2-tts-utterance";
export const TTS_CLASS_UTTERANCE_HEADING1 = "r2-tts-utterance-h1";
export const TTS_CLASS_UTTERANCE_HEADING2 = "r2-tts-utterance-h2";
export const TTS_CLASS_UTTERANCE_HEADING3 = "r2-tts-utterance-h3";
export const TTS_CLASS_UTTERANCE_HEADING4 = "r2-tts-utterance-h4";
export const TTS_CLASS_UTTERANCE_HEADING5 = "r2-tts-utterance-h5";
export const TTS_ID_CONTAINER = "r2-tts-txt";
export const TTS_NAV_BUTTON_CLASS = "r2-tts-button";
export const TTS_ID_SPEAKING_DOC_ELEMENT = "r2-tts-speaking-el";
export const TTS_POPUP_DIALOG_CLASS = "r2-tts-popup-dialog";

// export const TTS_CLASS_INJECTED_SPAN = "r2-tts-speaking-txt";
// export const TTS_CLASS_INJECTED_SUBSPAN = "r2-tts-speaking-word";
// export const TTS_ID_INJECTED_PARENT = "r2-tts-speaking-txt-parent";

// :root[style] .${TTS_CLASS_INJECTED_SPAN},
// :root .${TTS_CLASS_INJECTED_SPAN} {
//     color: black !important;
//     background: #FFFFCC !important;

//     /* text-decoration: underline; */

//     padding: 0;
//     margin: 0;
// }
// /*
// :root[style*="readium-night-on"] .${TTS_CLASS_INJECTED_SPAN} {
//     color: white !important;
//     background: #333300 !important;
// }
// :root[style] .${TTS_CLASS_INJECTED_SUBSPAN},
// :root .${TTS_CLASS_INJECTED_SUBSPAN} {
//     text-decoration: underline;
//     padding: 0;
//     margin: 0;
// }
// */
// :root[style] .${TTS_ID_INJECTED_PARENT},
// :root .${TTS_ID_INJECTED_PARENT} {
//     /*
//     outline-color: black;
//     outline-style: solid;
//     outline-width: 2px;
//     outline-offset: 1px;
//     */
// }
// :root[style*="readium-night-on"] .${TTS_ID_INJECTED_PARENT} {
//     /*
//     outline-color: white !important;
//     */
// }

export const ttsCssStyles = `

:root[style] dialog#${POPUP_DIALOG_CLASS}.${TTS_POPUP_DIALOG_CLASS},
:root dialog#${POPUP_DIALOG_CLASS}.${TTS_POPUP_DIALOG_CLASS} {
    width: auto;
    max-width: 100%;

    height: auto;
    max-height: 100%;

    top: 0px;
    bottom: 0px;
    left: 0px;
    right: 0px;

    margin: 0;
    padding: 0;

    box-shadow: none;

    border-radius: 0;
    border-style: solid;
    border-width: 1px;
    border-color: #777777 !important;
    border-left: 0;
    border-right: 0;
    border-top: 0;
    border-bottom: 0;
}

:root[style] div#${TTS_ID_CONTAINER},
:root div#${TTS_ID_CONTAINER} {
    overflow: auto;
    overflow-x: hidden;

    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 1;
    grid-row-end: 2;

    padding: 0;
    margin: 0;

    max-width: 800px;
    margin-right: auto;
    margin-left: auto;

    hyphens: none !important;
    word-break: keep-all !important;
    word-wrap: break-word !important;

    line-height: initial !important;

    color: #444444 !important;

    border-radius: 0;
    border-style: solid;
    border-width: 1px;
    border-color: #777777 !important;
    border-left: 0;
    border-right: 0;
    border-top: 0;
}

:root[style] div#${TTS_ID_CONTAINER} > div,
:root div#${TTS_ID_CONTAINER} > div {
    font-size: 1.2rem !important;
}
:root[style] div#${TTS_ID_CONTAINER} > img,
:root div#${TTS_ID_CONTAINER} > img,
:root[style] div#${TTS_ID_CONTAINER} > svg,
:root div#${TTS_ID_CONTAINER} > svg {
    display: block;
    border: 3px solid transparent;
    max-width: 50%;
    margin-left: auto;
    margin-right: auto;
}
:root[style] div#${TTS_ID_CONTAINER} > img + div,
:root div#${TTS_ID_CONTAINER} > img + div,
:root[style] div#${TTS_ID_CONTAINER} > svg + div,
:root div#${TTS_ID_CONTAINER} > svg + div {
    text-align: center;
    text-decoration: underline;
}

:root[style*="--USER__lineHeight"] div#${TTS_ID_CONTAINER} {
    line-height: calc(var(--USER__lineHeight) * 1) !important;
}
:root[style*="readium-night-on"] div#${TTS_ID_CONTAINER} {
    color: #bbbbbb !important;
}
:root[style*="readium-sepia-on"] div#${TTS_ID_CONTAINER} {
    background: var(--RS__backgroundColor) !important;
    color: var(--RS__textColor) !important;
}
:root[style*="--USER__backgroundColor"] div#${TTS_ID_CONTAINER} {
    background: var(--USER__backgroundColor) !important;
}
:root[style*="--USER__textColor"] div#${TTS_ID_CONTAINER} {
    color: var(--USER__textColor) !important;
}

:root[style] #${TTS_ID_SLIDER},
:root #${TTS_ID_SLIDER} {
    padding: 0;
    margin: 0;
    margin-left: 6px;
    margin-right: 6px;
    margin-top: 6px;
    margin-bottom: 6px;

    grid-column-start: 2;
    grid-column-end: 3;
    grid-row-start: 2;
    grid-row-end: 3;

    cursor: pointer;
    -webkit-appearance: none;

    background: transparent !important;
}
:root #${TTS_ID_SLIDER}::-webkit-slider-runnable-track {
    cursor: pointer;

    width: 100%;
    height: 0.5em;

    background: #999999;

    padding: 0;
    margin: 0;
}
:root[style*="readium-night-on"] #${TTS_ID_SLIDER}::-webkit-slider-runnable-track {
    background: #545454;
}
:root #${TTS_ID_SLIDER}::-webkit-slider-thumb {
    -webkit-appearance: none;

    cursor: pointer;

    width: 0.8em;
    height: 1.5em;

    padding: 0;
    margin: 0;
    margin-top: -0.5em;

    border: none;
    border-radius: 0.2em;

    background: #333333;
}
:root[style*="readium-night-on"] #${TTS_ID_SLIDER}::-webkit-slider-thumb {
    background: white;
}
:root[style] button.${TTS_NAV_BUTTON_CLASS} > span,
:root button.${TTS_NAV_BUTTON_CLASS} > span {
    vertical-align: baseline;
}
:root[style] button.${TTS_NAV_BUTTON_CLASS},
:root button.${TTS_NAV_BUTTON_CLASS} {
    border: none;

    font-size: 100% !important;
    font-family: Arial !important;
    cursor: pointer;

    padding: 0;
    margin-top: 0.2em;
    margin-bottom: 0.2em;

    background: transparent !important;
    color: black !important;
}
:root[style*="readium-night-on"] button.${TTS_NAV_BUTTON_CLASS} {
    color: white !important;
}
/*
:root[style*="readium-sepia-on"] button.${TTS_NAV_BUTTON_CLASS} {
    background: var(--RS__backgroundColor) !important;
}
:root[style*="--USER__backgroundColor"] button.${TTS_NAV_BUTTON_CLASS} {
    background: var(--USER__backgroundColor) !important;
}
*/
:root[style] #${TTS_ID_PREVIOUS},
:root #${TTS_ID_PREVIOUS} {
    margin-left: 0.2em;

    grid-column-start: 1;
    grid-column-end: 2;
    grid-row-start: 2;
    grid-row-end: 3;
}
:root[style] #${TTS_ID_NEXT},
:root #${TTS_ID_NEXT} {
    margin-right: 0.2em;

    grid-column-start: 3;
    grid-column-end: 4;
    grid-row-start: 2;
    grid-row-end: 3;
}

:root[style] .${TTS_ID_SPEAKING_DOC_ELEMENT},
:root .${TTS_ID_SPEAKING_DOC_ELEMENT} {
    outline-color: magenta;
    outline-style: solid;
    outline-width: 2px;
    outline-offset: 1px;
}

:root[style] .${TTS_CLASS_UTTERANCE},
:root .${TTS_CLASS_UTTERANCE} {
    margin-bottom: 0.1em;
    padding-top: 0.3em;
    padding-bottom: 0.3em;
    padding-left: 1em;
    padding-right: 1em;
    display: block;

    box-sizing: border-box;
    border: 1px solid transparent !important;

    line-height: 1.5 !important;
}

:root[style] div#${TTS_ID_CONTAINER} .${TTS_CLASS_UTTERANCE_HEADING1},
:root div#${TTS_ID_CONTAINER} .${TTS_CLASS_UTTERANCE_HEADING1} {
    font-weight: bolder !important;
    font-size: 1.5rem !important;
}
:root[style] div#${TTS_ID_CONTAINER} .${TTS_CLASS_UTTERANCE_HEADING2},
:root div#${TTS_ID_CONTAINER} .${TTS_CLASS_UTTERANCE_HEADING2} {
    font-weight: bolder !important;
    font-size: 1.4rem !important;
}
:root[style] div#${TTS_ID_CONTAINER} .${TTS_CLASS_UTTERANCE_HEADING3},
:root div#${TTS_ID_CONTAINER} .${TTS_CLASS_UTTERANCE_HEADING3} {
    font-weight: bold !important;
    font-size: 1.3rem !important;
}
:root[style] div#${TTS_ID_CONTAINER} .${TTS_CLASS_UTTERANCE_HEADING4},
:root div#${TTS_ID_CONTAINER} .${TTS_CLASS_UTTERANCE_HEADING4} {
    font-weight: bold !important;
    font-size: 1.2rem !important;
}
:root[style] div#${TTS_ID_CONTAINER} .${TTS_CLASS_UTTERANCE_HEADING5},
:root div#${TTS_ID_CONTAINER} .${TTS_CLASS_UTTERANCE_HEADING5} {
    font-weight: bold !important;
    font-size: 1.1rem !important;
}

:root[style] div#${TTS_ID_ACTIVE_UTTERANCE},
:root div#${TTS_ID_ACTIVE_UTTERANCE} {
    /* background-color: yellow !important; */

    border: 1px solid #777777 !important;
    border-radius: 0.4em !important;

    color: black !important;
}
:root[style*="readium-night-on"] div#${TTS_ID_ACTIVE_UTTERANCE} {
    color: white !important;
}
:root[style*="readium-sepia-on"] div#${TTS_ID_ACTIVE_UTTERANCE} {
    color: black !important;
}
:root[style*="--USER__textColor"] div#${TTS_ID_ACTIVE_UTTERANCE} {
    color: var(--USER__textColor) !important;
}

:root[style] span#${TTS_ID_ACTIVE_WORD},
:root span#${TTS_ID_ACTIVE_WORD} {
    color: black !important;

    text-decoration: underline;
    text-decoration-color: #777777 !important;
    text-underline-position: under;
    /*
    outline-color: #777777;
    outline-offset: 2px;
    outline-style: solid;
    outline-width: 1px;
    */

    padding: 0;
    margin: 0;
}
:root[style*="readium-night-on"] span#${TTS_ID_ACTIVE_WORD} {
    color: white !important;
    outline-color: white;
}
:root[style*="readium-sepia-on"] span#${TTS_ID_ACTIVE_WORD} {
    color: black !important;
    outline-color: black;
}
:root[style*="--USER__textColor"] span#${TTS_ID_ACTIVE_WORD} {
    color: var(--USER__textColor) !important;
    outline-color: var(--USER__textColor);
}

:root div#${TTS_ID_CONTAINER}.${TTS_CLASS_THEME1},
:root[style] div#${TTS_ID_CONTAINER}.${TTS_CLASS_THEME1} {

    background-color: #f7f9f9 !important;
    color: #333333 !important;
}
:root[style*="readium-night-on"] div#${TTS_ID_CONTAINER}.${TTS_CLASS_THEME1} {
    background: #111111 !important;
    color: #888888 !important;
}
:root[style*="readium-sepia-on"] div#${TTS_ID_CONTAINER}.${TTS_CLASS_THEME1} {
    background: #fdf2e9 !important;
    color: #333333 !important;
}

:root[style] div#${TTS_ID_CONTAINER}.${TTS_CLASS_THEME1} .${TTS_CLASS_UTTERANCE},
:root div#${TTS_ID_CONTAINER}.${TTS_CLASS_THEME1} .${TTS_CLASS_UTTERANCE} {
    background-color: transparent !important;
}

:root[style] div#${TTS_ID_CONTAINER}.${TTS_CLASS_THEME1} div#${TTS_ID_ACTIVE_UTTERANCE},
:root div#${TTS_ID_CONTAINER}.${TTS_CLASS_THEME1} div#${TTS_ID_ACTIVE_UTTERANCE} {

    border: 0 !important;
    border-radius: 0px !important;

    background-color: #ecf0f1 !important;
    color: black !important;

    /* box-shadow: 0px 0px 10px 0px #f2f3f4; */
}
:root[style*="readium-night-on"] div#${TTS_ID_CONTAINER}.${TTS_CLASS_THEME1} div#${TTS_ID_ACTIVE_UTTERANCE} {
    background-color: #222222 !important;
    color: white !important;
    /* box-shadow: 0px 0px 10px 0px #111100; */
}
:root[style*="readium-sepia-on"] div#${TTS_ID_CONTAINER}.${TTS_CLASS_THEME1} div#${TTS_ID_ACTIVE_UTTERANCE} {
    background-color: #fef9e7 !important;
    color: black !important;
    /* box-shadow: 0px 0px 10px 0px #fdebd0; */
}

:root[style] div#${TTS_ID_CONTAINER}.${TTS_CLASS_THEME1} div#${TTS_ID_ACTIVE_UTTERANCE} span#${TTS_ID_ACTIVE_WORD},
:root div#${TTS_ID_CONTAINER}.${TTS_CLASS_THEME1} div#${TTS_ID_ACTIVE_UTTERANCE} span#${TTS_ID_ACTIVE_WORD} {
    background-color: #f7dc6f !important;
    color: black !important;

    outline-color: #f7dc6f;
    outline-style: solid;
    outline-offset: unset;
    outline-width: 4px;

    text-decoration: none;
}
:root[style*="readium-night-on"] div#${TTS_ID_CONTAINER}.${TTS_CLASS_THEME1} div#${TTS_ID_ACTIVE_UTTERANCE} span#${TTS_ID_ACTIVE_WORD} {
    background-color: #d4ac0d !important;
    color: black !important;

    outline-color: #d4ac0d;
}
:root[style*="readium-sepia-on"] div#${TTS_ID_CONTAINER}.${TTS_CLASS_THEME1} div#${TTS_ID_ACTIVE_UTTERANCE} span#${TTS_ID_ACTIVE_WORD} {
    background-color: #f9e79f !important;
    color: black !important;

    outline-color: #f9e79f;
}
`;

export const ID_HIGHLIGHTS_CONTAINER = "R2_ID_HIGHLIGHTS_CONTAINER";
export const ID_HIGHLIGHTS_FLOATING = "R2_ID_HIGHLIGHTS_FLOATING";
export const CLASS_HIGHLIGHT_COMMON = "R2_CLASS_HIGHLIGHT_COMMON";
export const CLASS_HIGHLIGHT_COMMON_SVG = "R2_CLASS_HIGHLIGHT_COMMON_SVG";
export const CLASS_HIGHLIGHT_SVG = "R2_CLASS_HIGHLIGHT_SVG";
export const CLASS_HIGHLIGHT_CONTOUR = "R2_CLASS_HIGHLIGHT_CONTOUR";
export const CLASS_HIGHLIGHT_CONTOUR_MARGIN = "R2_CLASS_HIGHLIGHT_CONTOUR_MARGIN";
export const CLASS_HIGHLIGHT_CONTAINER = "R2_CLASS_HIGHLIGHT_CONTAINER";
export const CLASS_HIGHLIGHT_MARGIN = "R2_CLASS_HIGHLIGHT_MARGIN";
export const CLASS_HIGHLIGHT_BEHIND = "R2_CLASS_HIGHLIGHT_BEHIND";
export const CLASS_HIGHLIGHT_MASK = "R2_CLASS_HIGHLIGHT_MASK";
export const CLASS_HIGHLIGHT_HOVER = "R2_CLASS_HIGHLIGHT_HOVER";
export const CLASS_HIGHLIGHT_CURSOR2 = "R2_CLASS_HIGHLIGHT_CURSOR2";
// export const CLASS_HIGHLIGHT_CURSOR1 = "R2_CLASS_HIGHLIGHT_CURSOR1";
// export const CLASS_HIGHLIGHT_AREA = "R2_CLASS_HIGHLIGHT_AREA";
// export const CLASS_HIGHLIGHT_BOUNDING_AREA = "R2_CLASS_HIGHLIGHT_BOUNDING_AREA";
// export const CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN = "R2_CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN";

export const ENABLE_VISIBILITY_MASK = false;
export const ROOT_CLASS_INVISIBLE_MASK = "r2-visibility-mask-class";
export const ROOT_CLASS_INVISIBLE_MASK_REMOVED = "r2-visibility-mask-removed-class";

// set to false to debug bounding boxes
const hover = true ? `.${CLASS_HIGHLIGHT_HOVER}` : "";

/*
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}${hover}:not(.${CLASS_HIGHLIGHT_MARGIN}) > .${CLASS_HIGHLIGHT_BOUNDING_AREA},
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}${hover}:not(.${CLASS_HIGHLIGHT_MARGIN}) > .${CLASS_HIGHLIGHT_BOUNDING_AREA}
{
outline-color: #555555 !important;
outline-style: solid !important;
outline-width: 2px !important;
outline-offset: 2px !important;
}
*/
/*
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}${hover}.${CLASS_HIGHLIGHT_MARGIN} > .${CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN},
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}${hover}.${CLASS_HIGHLIGHT_MARGIN} > .${CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN}
{
outline-color: #555555 !important;
outline-style: solid !important;
outline-width: 1px !important;
outline-offset: 1px !important;
}
*/
/*
:root[style*="readium-night-on"] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}${hover}:not(.${CLASS_HIGHLIGHT_MARGIN}) > .${CLASS_HIGHLIGHT_BOUNDING_AREA}
{
outline-color: yellow !important;
outline-style: solid !important;
outline-width: 2px !important;
outline-offset: 2px !important;
}
*/
/*
:root[style].${CLASS_PAGINATED} > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > .${CLASS_HIGHLIGHT_AREA},
:root.${CLASS_PAGINATED} > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > .${CLASS_HIGHLIGHT_AREA},
:root[style].${CLASS_PAGINATED} > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > .${CLASS_HIGHLIGHT_BOUNDING_AREA},
:root.${CLASS_PAGINATED} > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > .${CLASS_HIGHLIGHT_BOUNDING_AREA},
:root[style].${CLASS_PAGINATED} > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > .${CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN},
:root.${CLASS_PAGINATED} > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > .${CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN},
*/
/*
:root[style]:not(.${CLASS_PAGINATED}) > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > .${CLASS_HIGHLIGHT_AREA},
:root:not(.${CLASS_PAGINATED}) > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > .${CLASS_HIGHLIGHT_AREA},
:root[style]:not(.${CLASS_PAGINATED}) > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > .${CLASS_HIGHLIGHT_BOUNDING_AREA},
:root:not(.${CLASS_PAGINATED}) > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > .${CLASS_HIGHLIGHT_BOUNDING_AREA},
:root[style]:not(.${CLASS_PAGINATED}) > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > .${CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN},
:root:not(.${CLASS_PAGINATED}) > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > .${CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN},
*/
/*
:root[style*="readium-night-on"] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}${hover}.${CLASS_HIGHLIGHT_MARGIN} > .${CLASS_HIGHLIGHT_BOUNDING_AREA_MARGIN}
{
outline-color: yellow !important;
outline-style: solid !important;
outline-width: 1px !important;
outline-offset: 1px !important;
}
*/
/*
:root[style].${CLASS_HIGHLIGHT_CURSOR1},
:root.${CLASS_HIGHLIGHT_CURSOR1}
{
cursor: pointer !important;
}
*/
/*
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > svg.${CLASS_HIGHLIGHT_CONTOUR} > path:nth-child(1),
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > svg.${CLASS_HIGHLIGHT_CONTOUR} > path:nth-child(1)
{
fill: blue !important;
}
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > svg.${CLASS_HIGHLIGHT_CONTOUR} > path:nth-child(2),
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > svg.${CLASS_HIGHLIGHT_CONTOUR} > path:nth-child(2)
{
stroke: #dddddd !important;
}
:root[style*="readium-night-on"] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > svg.${CLASS_HIGHLIGHT_CONTOUR} > path:nth-child(2)
{
stroke: #aaaaaa !important;
}
*/
/*
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}${hover}.${CLASS_HIGHLIGHT_MARGIN}[data-type="0"] > .${CLASS_HIGHLIGHT_AREA},
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}${hover}.${CLASS_HIGHLIGHT_MARGIN}[data-type="0"] > .${CLASS_HIGHLIGHT_AREA},
*/
/*
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}.${CLASS_HIGHLIGHT_MARGIN}:not(${hover}) > .${CLASS_HIGHLIGHT_AREA},
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}.${CLASS_HIGHLIGHT_MARGIN}:not(${hover}) > .${CLASS_HIGHLIGHT_AREA},
*/
/*
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > .${CLASS_HIGHLIGHT_AREA},
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > .${CLASS_HIGHLIGHT_AREA},
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > svg.${CLASS_HIGHLIGHT_CONTOUR},
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > svg.${CLASS_HIGHLIGHT_CONTOUR}
{
transform: translate3d(0px, 0px, 0px) !important;
}
*/

/*
https://developer.mozilla.org/en-US/docs/Web/CSS/overflow
hidden
    Overflow content is clipped at the element's padding box. There are no scroll bars, and the clipped content is not visible (i.e., clipped content is hidden), but the content still exists. User agents do not add scroll bars and also do not allow users to view the content outside the clipped region by actions such as dragging on a touch screen or using the scroll wheel on a mouse. The content can be scrolled programmatically (for example, by setting the value of the scrollLeft property or the scrollTo() method), in which case the element box is a scroll container.
clip
    Overflow content is clipped at the element's overflow clip edge that is defined using the overflow-clip-margin property. As a result, content overflows the element's padding box by the <length> value of overflow-clip-margin or by 0px if not set. Overflow content outside the clipped region is not visible, user agents do not add a scroll bar, and programmatic scrolling is also not supported. No new formatting context is created. To establish a formatting context, use overflow: clip along with display: flow-root. The element box is not a scroll container.
*/
/*
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}:not(${hover}):not(.${CLASS_HIGHLIGHT_MARGIN})[data-type="0"],
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}:not(${hover}):not(.${CLASS_HIGHLIGHT_MARGIN})[data-type="0"]
{
opacity: 0.5 !important;
}
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}${hover}.${CLASS_HIGHLIGHT_MARGIN}[data-type="0"] > svg.${CLASS_HIGHLIGHT_CONTOUR},
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}${hover}.${CLASS_HIGHLIGHT_MARGIN}[data-type="0"] > svg.${CLASS_HIGHLIGHT_CONTOUR}
{
opacity: 0.5 !important;
}
*/
export const visibilityMaskCssStyles = `
:root[style],
:root,
:root[style] > body,
:root > body,
:root[style] > body *,
:root > body *,
:root[style] > body *::before,
:root > body *::after
{
scroll-behavior: auto !important;
}

:root[style].${ROOT_CLASS_NO_RUBY} > body rt,
:root.${ROOT_CLASS_NO_RUBY} > body rt,
:root[style].${ROOT_CLASS_NO_RUBY} > body rp,
:root.${ROOT_CLASS_NO_RUBY} > body rp
{
display: none;
}

r2-wbr,
wbr {
display: none;
}
:root[style*="readium-advanced-on"][style*="--USER__wordSpacing"] r2-wbr,
:root[style*="readium-advanced-on"][style*="--USER__wordSpacing"] wbr {
display: inherit;
}
r2-wbr::before,
wbr::before {
content: ' ';
}

:root[style].${CLASS_PAGINATED} > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING},
:root.${CLASS_PAGINATED} > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING},
:root[style].${CLASS_PAGINATED} > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING}_,
:root.${CLASS_PAGINATED} > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING}_
{
    position: fixed;
}
:root[style]:not(.${CLASS_PAGINATED}) > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING},
:root:not(.${CLASS_PAGINATED}) > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING},
:root[style]:not(.${CLASS_PAGINATED}) > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING}_,
:root:not(.${CLASS_PAGINATED}) > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING}_
{
    position: absolute;
}
:root[style].${CLASS_VWM} > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING},
:root.${CLASS_VWM} > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING}
/*
,
:root[style].${CLASS_VWM} > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING}_,
:root.${CLASS_VWM} > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING}_
*/
{
/* width: max-content !important; */

width: 200px !important;
height: 100px !important;

max-width: 200px !important;
max-height: 100px !important;
}
:root[style]:not(.${CLASS_VWM}) > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING},
:root:not(.${CLASS_VWM}) > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING}
/*
,
:root[style]:not(.${CLASS_VWM}) > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING}_,
:root:not(.${CLASS_VWM}) > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING}_
*/
{
width: max-content !important;
height: max-content !important;

/* width: 200px !important;
height: 100px !important;

max-width: 200px !important;
max-height: 100px !important;
*/
}

:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING},
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING},
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING}_,
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING}_
{
user-select: none !important;
pointer-events: none !important;

overflow: visible !important;

z-index: 999;

display: none;

top: 0;
left: 0;

background: white !important;
color: black !important;

box-sizing: border-box !important;

padding: 0 !important;
margin: 0 !important;
}
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING},
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING}
{
    border-radius: 8px !important;
    border-width: 1px !important;
    border-color: black !important;
    border-style: solid !important;
    box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 1);
}
/*
:root[style*="--USER__fontFamily"] > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING}
{
    font-family: var(--USER__fontFamily);
}
:root[style*="--USER__lineHeight"] > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING}
{
    line-height: var(--USER__lineHeight);
}
:root[style*="readium-night-on"] > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING} {
    background: #333333 !important;
    border-color: white !important;
}
*/
:root[style*="readium-night-on"] > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING} {
    background: var(--RS__backgroundColor) !important;
    color: var(--RS__textColor) !important;
    border-color: var(--RS__textColor) !important;
    box-shadow: 0px 0px 4px 0px var(--RS__textColor);
}
:root[style*="readium-sepia-on"] > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING} {
    background: var(--RS__backgroundColor) !important;
    color: var(--RS__textColor) !important;
    border-color: var(--RS__textColor) !important;
    box-shadow: 0px 0px 4px 0px var(--RS__textColor);
}
:root[style*="--USER__backgroundColor"] > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING} {
    background: var(--USER__backgroundColor) !important;
}
:root[style*="--USER__textColor"] > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING} {
    color: var(--USER__textColor) !important;
    border-color: var(--USER__textColor) !important;
    box-shadow: 0px 0px 4px 0px var(--USER__textColor);
}

:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING} > div:nth-child(1),
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING} > div:nth-child(1)
{
/*
width: 10px;
height: 10px;
*/
width: 0 !important;
height: 0 !important;

border-left: 8px solid black !important;
border-top: 8px solid black !important;
border-right: 8px solid transparent !important;
border-bottom: 8px solid transparent !important;

box-sizing: border-box !important;

position: absolute;
padding: 0 !important;
margin: 0 !important;

/* background-color: red !important; */
}

:root[style*="readium-night-on"] > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING} > div:nth-child(1) {
border-left: 8px solid var(--RS__textColor) !important;
border-top: 8px solid var(--RS__textColor) !important;
}
:root[style*="readium-sepia-on"] > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING} > div:nth-child(1) {
border-left: 8px solid var(--RS__textColor) !important;
border-top: 8px solid var(--RS__textColor) !important;
}

:root[style*="--USER__textColor"] > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING} > div:nth-child(1) {
border-left: 8px solid var(--USER__textColor) !important;
border-top: 8px solid var(--USER__textColor) !important;
}

:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING} > div:nth-child(2),
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING} > div:nth-child(2)
{
/*
position: absolute;
top: 0;
left: 0;
bottom: 0;
right: 0;
*/

display: grid;

min-width: 40px !important;
max-width: 200px !important;
max-height: 100px !important;

padding: 4px;

text-overflow: ellipsis !important;

overflow-x: clip !important;
overflow-y: clip !important;

font-weight: bold !important;
font-size: 0.8rem !important;
}

/*
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING}_,
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > #${ID_HIGHLIGHTS_FLOATING}_
{
z-index: 1000 !important;
opacity: 0.5 !important;
pointer-events: none !important;
}
*/

:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}.${CLASS_HIGHLIGHT_MARGIN}:not(${hover}) > svg.${CLASS_HIGHLIGHT_CONTOUR},
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}.${CLASS_HIGHLIGHT_MARGIN}:not(${hover}) > svg.${CLASS_HIGHLIGHT_CONTOUR}
{
display: none !important;
}

:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}${hover}:not(.${CLASS_HIGHLIGHT_MARGIN}) > svg.${CLASS_HIGHLIGHT_CONTOUR} > path:last-child,
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}${hover}:not(.${CLASS_HIGHLIGHT_MARGIN}) > svg.${CLASS_HIGHLIGHT_CONTOUR} > path:last-child
{
stroke: #555555 !important;
/* stroke-width: 2 !important; */
}
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}${hover}.${CLASS_HIGHLIGHT_MARGIN} > svg.${CLASS_HIGHLIGHT_CONTOUR} > path:last-child,
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}${hover}.${CLASS_HIGHLIGHT_MARGIN} > svg.${CLASS_HIGHLIGHT_CONTOUR} > path:last-child
{
stroke: #555555 !important;
/* stroke-width: 2 !important; */
}

:root[style*="readium-night-on"] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}${hover}:not(.${CLASS_HIGHLIGHT_MARGIN}) > svg.${CLASS_HIGHLIGHT_CONTOUR} > path:last-child
{
stroke: yellow !important;
/* stroke-width: 2 !important; */
}
:root[style*="readium-night-on"] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}${hover}.${CLASS_HIGHLIGHT_MARGIN} > svg.${CLASS_HIGHLIGHT_CONTOUR} > path:last-child
{
stroke: yellow !important;
/* stroke-width: 2 !important; */
}

:root[style].${CLASS_PAGINATED} > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > svg.${CLASS_HIGHLIGHT_SVG},
:root.${CLASS_PAGINATED} > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > svg.${CLASS_HIGHLIGHT_SVG},
:root[style].${CLASS_PAGINATED} > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > svg.${CLASS_HIGHLIGHT_CONTOUR},
:root.${CLASS_PAGINATED} > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > svg.${CLASS_HIGHLIGHT_CONTOUR},
:root[style].${CLASS_PAGINATED} > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > svg.${CLASS_HIGHLIGHT_CONTOUR_MARGIN},
:root.${CLASS_PAGINATED} > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > svg.${CLASS_HIGHLIGHT_CONTOUR_MARGIN}
{
position: fixed !important;
}

:root[style]:not(.${CLASS_PAGINATED}) > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > svg.${CLASS_HIGHLIGHT_SVG},
:root:not(.${CLASS_PAGINATED}) > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > svg.${CLASS_HIGHLIGHT_SVG},
:root[style]:not(.${CLASS_PAGINATED}) > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > svg.${CLASS_HIGHLIGHT_CONTOUR},
:root:not(.${CLASS_PAGINATED}) > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > svg.${CLASS_HIGHLIGHT_CONTOUR},
:root[style]:not(.${CLASS_PAGINATED}) > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > svg.${CLASS_HIGHLIGHT_CONTOUR_MARGIN},
:root:not(.${CLASS_PAGINATED}) > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER} > svg.${CLASS_HIGHLIGHT_CONTOUR_MARGIN}
{
position: absolute !important;
}

:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER},
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}
{
width: 1px !important;
height: 1px !important;
}

:root[style].${TTS_CLASS_PLAYING} > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}:not([data-group="tts"]),
:root.${TTS_CLASS_PLAYING} > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}:not([data-group="tts"])
{
    display: none;
}
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}:not(.${CLASS_HIGHLIGHT_BEHIND}):not(.${CLASS_HIGHLIGHT_MASK}),
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}:not(.${CLASS_HIGHLIGHT_BEHIND}):not(.${CLASS_HIGHLIGHT_MASK})
{
    opacity: 0.8;
}
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}.${CLASS_HIGHLIGHT_BEHIND}:not(.${CLASS_HIGHLIGHT_MARGIN}),
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}.${CLASS_HIGHLIGHT_BEHIND}:not(.${CLASS_HIGHLIGHT_MARGIN}),
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}.${CLASS_HIGHLIGHT_BEHIND}.${CLASS_HIGHLIGHT_MARGIN}${hover},
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}.${CLASS_HIGHLIGHT_BEHIND}.${CLASS_HIGHLIGHT_MARGIN}${hover}
{
    mix-blend-mode: multiply;
}
:root[style*="readium-night-on"] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}.${CLASS_HIGHLIGHT_BEHIND}:not(.${CLASS_HIGHLIGHT_MARGIN}),
:root[style*="readium-night-on"] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}.${CLASS_HIGHLIGHT_BEHIND}.${CLASS_HIGHLIGHT_MARGIN}${hover}
{
    mix-blend-mode: exclusion;
}

/*
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER},
:root > body > #${ID_HIGHLIGHTS_CONTAINER}
{
isolation: isolate;
}
*/

/*
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}.${CLASS_HIGHLIGHT_BEHIND},
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}.${CLASS_HIGHLIGHT_BEHIND},
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}.${CLASS_HIGHLIGHT_MARGIN},
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}.${CLASS_HIGHLIGHT_MARGIN}
*/
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER},
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}
{
z-index: 1;
}

/*
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}.${CLASS_HIGHLIGHT_BEHIND}${hover},
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}.${CLASS_HIGHLIGHT_BEHIND}${hover},
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}.${CLASS_HIGHLIGHT_MARGIN}${hover},
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}.${CLASS_HIGHLIGHT_MARGIN}${hover}
*/
:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}${hover},
:root > body > #${ID_HIGHLIGHTS_CONTAINER} > .${CLASS_HIGHLIGHT_CONTAINER}${hover}
{
z-index: 2;
}

:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} .${CLASS_HIGHLIGHT_COMMON},
:root > body > #${ID_HIGHLIGHTS_CONTAINER} .${CLASS_HIGHLIGHT_COMMON}
{
background-color: transparent !important;
position: absolute !important;
top: 0 !important;
left: 0 !important;
overflow: visible !important;
margin: 0 !important;
padding: 0 !important;
border: 0 !important;
box-sizing: border-box !important;
pointer-events: none !important;
}

:root[style] > body > #${ID_HIGHLIGHTS_CONTAINER} .${CLASS_HIGHLIGHT_COMMON_SVG},
:root > body > #${ID_HIGHLIGHTS_CONTAINER} .${CLASS_HIGHLIGHT_COMMON_SVG}
{
/* background-color: transparent !important; */
position: absolute !important;
top: 0 !important;
left: 0 !important;
overflow: visible !important;
margin: 0 !important;
padding: 0 !important;
border: 0 !important;
box-sizing: border-box !important;
pointer-events: none !important;
}

:root[style].${CLASS_HIGHLIGHT_CURSOR2},
:root.${CLASS_HIGHLIGHT_CURSOR2}
{
    cursor: crosshair !important;
}

/*
bugfix: for some reason, "inherit" does not work in Chromium, so we patch ReadiumCSS here :(
(was "text-align: var(--USER__textAlign);" on HTML root and "text-align: inherit !important;" on body etc.)
*/
:root[style*="readium-advanced-on"][style*="--USER__textAlign"] {
text-align: var(--USER__textAlign) !important;
}
:root[style*="readium-advanced-on"][style*="--USER__textAlign"] body,
:root[style*="readium-advanced-on"][style*="--USER__textAlign"] *:not(blockquote):not(figcaption) p,
:root[style*="readium-advanced-on"][style*="--USER__textAlign"] li {
text-align: var(--USER__textAlign) !important;
}

/*
https://github.com/readium/readium-css/issues/117
no new stacking context, otherwise massive performance degradation with CSS Columns in large HTML documents
(web inspector profiler shows long paint times, some layout recalc triggers too)
*/
:root {
    -webkit-perspective: none !important;
    perspective: none !important;
}

:root[style].${CLASS_PAGINATED}:not(.${ROOT_CLASS_FIXED_LAYOUT}),
:root.${CLASS_PAGINATED}:not(.${ROOT_CLASS_FIXED_LAYOUT}) {
    overflow: visible !important;
}
:root[style].${CLASS_PAGINATED}:not(.${ROOT_CLASS_FIXED_LAYOUT}):not(.${CLASS_VWM}) > body,
:root.${CLASS_PAGINATED}:not(.${ROOT_CLASS_FIXED_LAYOUT}):not(.${CLASS_VWM}) > body {
    /*
    Electron v19 --> v21 breaking change :(
    ("hidden" is now "clip")
    overflow-x: hidden !important;
    overflow-y: visible !important;
    */
    overflow-x: clip !important;
    overflow-y: hidden !important;
}
/*
:root[style].${CLASS_PAGINATED}:not(.${ROOT_CLASS_FIXED_LAYOUT}).${CLASS_VWM} > body,
:root.${CLASS_PAGINATED}:not(.${ROOT_CLASS_FIXED_LAYOUT}).${CLASS_VWM} > body {
    overflow-x: visible !important;
    overflow-y: clip !important;
}
*/

/*
This only visually hides the scrollbars,
this does not prevent user-scrolling with keyboard arrows, space, drag on character selection, mouse wheel, etc.
We cannot completely disable "scroll" event (prevent default) because we need to detect when user keyboard-tabs through hyperlinks, in order to reset the correct scroll offset programmatically (page alignment on CSS column boundaries).
...so we continue to use "clip" for "overflow-x" (see above)

:root[style].${CLASS_PAGINATED}:not(.${ROOT_CLASS_FIXED_LAYOUT}) > body::-webkit-scrollbar,
:root.${CLASS_PAGINATED}:not(.${ROOT_CLASS_FIXED_LAYOUT}) > body::-webkit-scrollbar {
    display: none;
}
*/

:root[style].${ROOT_CLASS_FIXED_LAYOUT},
:root.${ROOT_CLASS_FIXED_LAYOUT} {
    overflow: hidden !important;
}
:root[style].${ROOT_CLASS_FIXED_LAYOUT} > body,
:root.${ROOT_CLASS_FIXED_LAYOUT} > body {
    overflow: hidden !important;
    margin: 0 !important;
}

:root.${CLASS_PAGINATED} > body,
:root:not(.${CLASS_PAGINATED}) > body,
:root.${ROOT_CLASS_FIXED_LAYOUT} > body,
:root:not(.${ROOT_CLASS_FIXED_LAYOUT}) > body,
:root[style].${CLASS_PAGINATED} > body,
:root[style]:not(.${CLASS_PAGINATED}) > body,
:root[style].${ROOT_CLASS_FIXED_LAYOUT} > body,
:root[style]:not(.${ROOT_CLASS_FIXED_LAYOUT}) > body {
    /* see ensureHighlightsContainer() */
    position: relative !important;
    /* display: block; */

    /* background-color: yellow !important; */
}

:root[style]:not(.${CLASS_PAGINATED}):not(.${ROOT_CLASS_FIXED_LAYOUT}):not(.${CLASS_VWM}),
:root:not(.${CLASS_PAGINATED}):not(.${ROOT_CLASS_FIXED_LAYOUT}):not(.${CLASS_VWM}) {
    overflow-x: clip !important;

    padding: 0 !important;
    margin: 0 !important;

    height: inherit !important;
    min-height: 0 !important;
    max-height: none !important;
}

:root[style]:not(.${ROOT_CLASS_FIXED_LAYOUT}),
:root:not(.${ROOT_CLASS_FIXED_LAYOUT}) {
    --RS__pageGutter: 50px !important;
}

@media screen and (min-width: 35em) {
    :root[style]:not(.${ROOT_CLASS_FIXED_LAYOUT}),
    :root:not(.${ROOT_CLASS_FIXED_LAYOUT}) {
        --RS__pageGutter: 50px !important;
    }
}

@media screen and (min-width: 45em) {
    :root[style]:not(.${ROOT_CLASS_FIXED_LAYOUT}),
    :root:not(.${ROOT_CLASS_FIXED_LAYOUT}) {
        --RS__pageGutter: 50px !important;
    }
}

:root[style]:not(.${ROOT_CLASS_FIXED_LAYOUT}):not(.${CLASS_VWM}) > body,
:root:not(.${ROOT_CLASS_FIXED_LAYOUT}):not(.${CLASS_VWM}) > body {
    padding-top: 20px !important;
    padding-bottom: 20px !important;
    padding-left: 50px !important;
    padding-right: 50px !important;
}
:root[style]:not(.${ROOT_CLASS_FIXED_LAYOUT}).${CLASS_VWM} > body,
:root:not(.${ROOT_CLASS_FIXED_LAYOUT}).${CLASS_VWM} > body {
    padding-top: 22px !important;
    padding-bottom: 22px !important;
    padding-left: 50px !important;
    padding-right: 50px !important;
}
:root[style*="--USER__pageMargins"]:not(.${ROOT_CLASS_FIXED_LAYOUT}):not(.${CLASS_VWM}) > body {
    padding-left: calc(var(--RS__pageGutter) * var(--USER__pageMargins)) !important;
    padding-right: calc(var(--RS__pageGutter) * var(--USER__pageMargins)) !important;
}
:root[style*="--USER__pageMargins"]:not(.${ROOT_CLASS_FIXED_LAYOUT}).${CLASS_VWM} > body {
    padding-top: calc(var(--RS__pageGutter) * var(--USER__pageMargins)) !important;
    padding-bottom: calc(var(--RS__pageGutter) * var(--USER__pageMargins)) !important;
}

:root[style]:not(.${CLASS_PAGINATED}):not(.${ROOT_CLASS_FIXED_LAYOUT}):not(.${CLASS_VWM}) > body,
:root:not(.${CLASS_PAGINATED}):not(.${ROOT_CLASS_FIXED_LAYOUT}):not(.${CLASS_VWM}) > body {
    margin: 0 !important;
    margin: 0 auto !important;

    --RS__maxLineLength: 60em !important;

    height: inherit !important;
    min-height: 0 !important;
    max-height: none !important;
}

/*
:root[style]:not(.${CLASS_PAGINATED}):not(.${ROOT_CLASS_FIXED_LAYOUT}):not(.${CLASS_VWM}) > body > *:not(#${POPUP_DIALOG_CLASS}) div,
:root:not(.${CLASS_PAGINATED}):not(.${ROOT_CLASS_FIXED_LAYOUT}):not(.${CLASS_VWM}) > body > *:not(#${POPUP_DIALOG_CLASS}) div,
:root[style]:not(.${CLASS_PAGINATED}):not(.${ROOT_CLASS_FIXED_LAYOUT}):not(.${CLASS_VWM}) > body > div,
:root:not(.${CLASS_PAGINATED}):not(.${ROOT_CLASS_FIXED_LAYOUT}):not(.${CLASS_VWM}) > body > div
{
    max-width: none !important;
    max-height: none !important;
}
ALLOW HTML CONTENT DOCS TO RETRICT DIMENSIONS:
*/
div {
    max-width: none;
    max-height: none;
}
/*
https://github.com/edrlab/thorium-reader/issues/3247
ReadiumCSS fixed size breaks things:
--RS__baseLineHeight: calc((1em + (2ex - 1ch) - ((1rem - 16px) * 0.1667)) * var(--RS__lineHeightCompensation));
*/
:root,
:root[style] {
    line-height: normal;
}

:root[style]:not(.${ROOT_CLASS_FIXED_LAYOUT}):not(.${CLASS_VWM}) > body,
:root:not(.${ROOT_CLASS_FIXED_LAYOUT}):not(.${CLASS_VWM}) > body {
    min-height: inherit !important;
}

:root[style]:not(.${CLASS_PAGINATED}):not(.${ROOT_CLASS_FIXED_LAYOUT}).${CLASS_VWM},
:root:not(.${CLASS_PAGINATED}):not(.${ROOT_CLASS_FIXED_LAYOUT}).${CLASS_VWM} {
    overflow-y: clip !important;

    padding: 0 !important;
    margin: 0 !important;

    width: inherit !important;
    min-width: 0 !important;
    max-width: none !important;

    height: inherit !important;
    min-height: 0 !important;
    max-height: none !important;
}
:root[style]:not(.${CLASS_PAGINATED}):not(.${ROOT_CLASS_FIXED_LAYOUT}).${CLASS_VWM} > body,
:root:not(.${CLASS_PAGINATED}):not(.${ROOT_CLASS_FIXED_LAYOUT}).${CLASS_VWM} > body {
    margin: 0 !important;

    --RS__maxLineLength: 1000em !important;

    width: inherit !important;
    min-width: 0 !important;
    max-width: none !important;

    height: inherit !important;
    min-height: 0 !important;
    max-height: none !important;
}

:root[style]:not(.${CLASS_PAGINATED}):not(.${ROOT_CLASS_FIXED_LAYOUT}).${CLASS_VWM} > body > *:not(#${POPUP_DIALOG_CLASS}) div,
:root:not(.${CLASS_PAGINATED}):not(.${ROOT_CLASS_FIXED_LAYOUT}).${CLASS_VWM} > body > *:not(#${POPUP_DIALOG_CLASS}) div,
:root[style]:not(.${CLASS_PAGINATED}):not(.${ROOT_CLASS_FIXED_LAYOUT}).${CLASS_VWM} > body > div,
:root:not(.${CLASS_PAGINATED}):not(.${ROOT_CLASS_FIXED_LAYOUT}).${CLASS_VWM} > body > div {
    max-width: none !important;
    max-height: none !important;
}

/*
:root[style]:not(.${ROOT_CLASS_FIXED_LAYOUT}).${CLASS_VWM} > body,
:root:not(.${ROOT_CLASS_FIXED_LAYOUT}).${CLASS_VWM} > body {
    min-width: inherit;
}
*/

:root[style].${CLASS_PAGINATED}:not(.${ROOT_CLASS_FIXED_LAYOUT}),
:root.${CLASS_PAGINATED}:not(.${ROOT_CLASS_FIXED_LAYOUT}) {
    /* display: block; */
    /*
    Chrome Electron 19 - Chrome v102 CSS regression bug!
    display: flex; ... then transition to block or flow-root
    See SKIP_LINK_ID rules below :(
    (hacky, but works without regressions or layout shift)
    */
}

/*
// This workaround fixes the issue of "bleeding" body background color due to scale+translate CSS 2D transform
// https://github.com/edrlab/thorium-reader/issues/1529#issuecomment-900166745
background: unset !important;
background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=) !important;
*/

:root.${ROOT_CLASS_INVISIBLE_MASK}[style] > body,
:root.${ROOT_CLASS_INVISIBLE_MASK} > body {
    /* visibility: hidden !important; */
    opacity: 0;
}
:root.${ROOT_CLASS_INVISIBLE_MASK_REMOVED}[style] > body,
:root.${ROOT_CLASS_INVISIBLE_MASK_REMOVED} > body {
    opacity: 1;
    /*
    animation-name: readium2ElectronAnimation_INVISIBLE_MASK;
    animation-duration: 0.5s;
    animation-delay: 0s;
    animation-timing-function: linear;
    */
    /* animation-fill-mode: forwards; */
}
@keyframes readium2ElectronAnimation_INVISIBLE_MASK {
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
}
`;

export const focusCssStyles = `

#${SKIP_LINK_ID} {
    display: flex !important;
    overflow: hidden !important;
    visibility: visible !important;
    opacity: 1 !important;
    position: absolute !important;
    left: 0px !important;
    top: 0px !important;
    width: 1px !important;
    height: 1px !important;
    background-color: transparent !important;
    color: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
    border: 0 !important;
    outline: 0 !important;
}
/*
#${SKIP_LINK_ID}:focus {
    width: auto;
    height: auto;
}
*/
:root[style] *:focus,
:root *:focus {
    outline: none;
}
:root[style].${ROOT_CLASS_KEYBOARD_INTERACT} *.${CSS_CLASS_NO_FOCUS_OUTLINE}:focus:not(:target):not(.${LINK_TARGET_CLASS}):not([data-${POPOUTIMAGE_CONTAINER_ID}]),
:root.${ROOT_CLASS_KEYBOARD_INTERACT} *.${CSS_CLASS_NO_FOCUS_OUTLINE}:focus:not(:target):not(.${LINK_TARGET_CLASS}):not([data-${POPOUTIMAGE_CONTAINER_ID}]) {
    outline: none !important;
}
:root[style].${ROOT_CLASS_KEYBOARD_INTERACT} *:focus:not(:target):not(.${LINK_TARGET_CLASS}),
:root.${ROOT_CLASS_KEYBOARD_INTERACT} *:focus:not(:target):not(.${LINK_TARGET_CLASS}) {
    outline-color: blue !important;
    outline-style: solid !important;
    outline-width: 2px !important;
    outline-offset: 2px !important;
}
/*
@keyframes readium2ElectronAnimation_FOCUS {
    0% {
    }
    100% {
        outline: inherit !important;
    }
}
:root[style]:not(.${ROOT_CLASS_KEYBOARD_INTERACT}) *:focus,
:root:not(.${ROOT_CLASS_KEYBOARD_INTERACT}) *:focus {
    animation-name: readium2ElectronAnimation_FOCUS;
    animation-duration: 3s;
    animation-delay: 1s;
    animation-fill-mode: forwards;
    animation-timing-function: linear;
}
*/
`;

export const targetCssStyles = `
/*
@keyframes readium2ElectronAnimation_TARGET {
    0% {
    }
    100% {
        outline: inherit !important;
    }
}
:root[style] *:target,
:root *:target,
*/
:root[style] *.${LINK_TARGET_CLASS}:not(.${LINK_TARGET_ALT_CLASS}),
:root *.${LINK_TARGET_CLASS}:not(.${LINK_TARGET_ALT_CLASS})
{
    outline-color: gray !important;
    outline-style: solid !important;
    outline-width: 1px !important;
    outline-offset: 2px !important;

    /*
    animation-name: readium2ElectronAnimation_TARGET;
    animation-duration: 3s;
    animation-delay: 1s;
    animation-fill-mode: forwards;
    animation-timing-function: linear;
    */
}
:root[style] *.${LINK_TARGET_CLASS}.${LINK_TARGET_ALT_CLASS},
:root *.${LINK_TARGET_CLASS}.${LINK_TARGET_ALT_CLASS}
{
    outline-color: gray !important;
    outline-style: dotted !important;
    outline-width: 1px !important;
    outline-offset: 2px !important;

    /*
    animation-name: readium2ElectronAnimation_TARGET;
    animation-duration: 3s;
    animation-delay: 1s;
    animation-fill-mode: forwards;
    animation-timing-function: linear;
    */
}
/*
:root[style] *.r2-no-target-outline:target,
:root *.r2-no-target-outline:target,
*/
:root[style] *.r2-no-target-outline.${LINK_TARGET_CLASS},
:root *.r2-no-target-outline.${LINK_TARGET_CLASS} {
    outline: inherit !important;
}
`;

export const selectionCssStyles = `

:root[style].${HIDE_CURSOR_CLASS},
:root.${HIDE_CURSOR_CLASS},
:root[style].${HIDE_CURSOR_CLASS} *,
:root.${HIDE_CURSOR_CLASS} * {
    cursor: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=), none !important;
}

.${ZERO_TRANSFORM_CLASS} {
    will-change: scroll-position;
    transform: translateX(0px);
}
/*
:root[style] ::selection,
:root ::selection {
background: rgb(155, 179, 240) !important;
color: black !important;
}

:root[style*="readium-night-on"] ::selection {
background: rgb(100, 122, 177) !important;
color: white !important;
}
*/
`;

export const scrollBarCssStyles = `
::-webkit-scrollbar-button {
height: 0px !important;
width: 0px !important;
}

::-webkit-scrollbar-corner {
background: transparent !important;
}

/*::-webkit-scrollbar-track-piece {
background: red;
} */

::-webkit-scrollbar {
width:  14px;
height: 14px;
}

html.${POPUP_DIALOG_CLASS}.${TTS_CLASS_IS_ACTIVE} ::-webkit-scrollbar {
    display: none;
    /* visibility: hidden; */
}

::-webkit-scrollbar-thumb {
background: #727272;
background-clip: padding-box !important;
border: 3px solid transparent !important;
border-radius: 30px;
}

::-webkit-scrollbar-thumb:hover {
background: #4d4d4d;
}

::-webkit-scrollbar-track {
box-shadow: inset 0 0 3px rgba(40, 40, 40, 0.2);
background: #dddddd;
box-sizing: content-box;
}

::-webkit-scrollbar-track:horizontal {
border-top: 1px solid silver;
}
::-webkit-scrollbar-track:vertical {
border-left: 1px solid silver;
}

:root[style*="readium-night-on"] ::-webkit-scrollbar-thumb {
background: #a4a4a4;
border: 3px solid #545454;
}

:root[style*="readium-night-on"] ::-webkit-scrollbar-thumb:hover {
background: #dedede;
}

:root[style*="readium-night-on"] ::-webkit-scrollbar-track {
background: #545454;
}

:root[style*="readium-night-on"] ::-webkit-scrollbar-track:horizontal {
border-top: 1px solid black;
}
:root[style*="readium-night-on"] ::-webkit-scrollbar-track:vertical {
border-left: 1px solid black;
}`;

export const readPosCssStylesAttr1 = "data-readium2-read-pos1";
export const readPosCssStylesAttr2 = "data-readium2-read-pos2";
export const readPosCssStylesAttr3 = "data-readium2-read-pos3";
export const readPosCssStylesAttr4 = "data-readium2-read-pos4";
export const readPosCssStyles = `
:root[style*="readium-sepia-on"] *[${readPosCssStylesAttr1}],
:root[style*="readium-night-on"] *[${readPosCssStylesAttr1}],
:root[style] *[${readPosCssStylesAttr1}],
:root *[${readPosCssStylesAttr1}] {
    color: black !important;
    background: magenta !important;

    outline-color: magenta !important;
    outline-style: solid !important;
    outline-width: 6px !important;
    outline-offset: 0px !important;
}
:root[style*="readium-sepia-on"] *[${readPosCssStylesAttr2}],
:root[style*="readium-night-on"] *[${readPosCssStylesAttr2}],
:root[style] *[${readPosCssStylesAttr2}],
:root *[${readPosCssStylesAttr2}] {
    color: black !important;
    background: yellow !important;

    outline-color: yellow !important;
    outline-style: solid !important;
    outline-width: 4px !important;
    outline-offset: 0px !important;
}
:root[style*="readium-sepia-on"] *[${readPosCssStylesAttr3}],
:root[style*="readium-night-on"] *[${readPosCssStylesAttr3}],
:root[style] *[${readPosCssStylesAttr3}],
:root *[${readPosCssStylesAttr3}] {
    color: black !important;
    background: green !important;

    outline-color: green !important;
    outline-style: solid !important;
    outline-width: 2px !important;
    outline-offset: 0px !important;
}
:root[style*="readium-sepia-on"] *[${readPosCssStylesAttr4}],
:root[style*="readium-night-on"] *[${readPosCssStylesAttr4}],
:root[style] *[${readPosCssStylesAttr4}],
:root *[${readPosCssStylesAttr4}] {
    color: black !important;
    background: silver !important;

    outline-color: silver !important;
    outline-style: solid !important;
    outline-width: 1px !important;
    outline-offset: 0px !important;
}`;

export const AUDIO_BUFFER_CANVAS_ID = "r2-audio-buffer-canvas";
export const AUDIO_PROGRESS_CLASS = "r2-audio-progress";
export const AUDIO_ID = "r2-audio";
export const AUDIO_BODY_ID = "r2-audio-body";
export const AUDIO_SECTION_ID = "r2-audio-section";
export const AUDIO_CONTROLS_ID = "r2-audio-controls";
export const AUDIO_COVER_ID = "r2-audio-cover";
export const AUDIO_TITLE_ID = "r2-audio-title";
export const AUDIO_SLIDER_ID = "r2-audio-slider";
export const AUDIO_TIME_ID = "r2-audio-time";
export const AUDIO_PERCENT_ID = "r2-audio-percent";
export const AUDIO_RATE_ID = "r2-audio-rate";
export const AUDIO_PLAYPAUSE_ID = "r2-audio-playPause";
export const AUDIO_PREVIOUS_ID = "r2-audio-previous";
export const AUDIO_NEXT_ID = "r2-audio-next";
export const AUDIO_REWIND_ID = "r2-audio-rewind";
export const AUDIO_FORWARD_ID = "r2-audio-forward";

export const audioCssStyles = `

#${AUDIO_CONTROLS_ID} select#${AUDIO_RATE_ID} option {
    color: var(--RS__textColor) !important;
    background: var(--RS__backgroundColor) !important;
}

#${AUDIO_BODY_ID} {
    padding: 0 !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    height: 100vh !important;
    display: flex !important;
    align-items: center;
    justify-content: center;
    user-select: none;
}

#${AUDIO_SECTION_ID} {
    margin: 0;
    padding: 0;
    min-width: 500px;
}

#${AUDIO_TITLE_ID} {
    margin-top: 1em;
    margin-bottom: 0;
    display: block;
    margin-left: auto;
    margin-right: auto;
    max-width: 800px;
    width: 80%;
    text-align: center;
}

#${AUDIO_COVER_ID} {
    display: block;
    margin-left: auto;
    margin-right: auto;
    max-width: 500px !important;
    max-height: 250px !important;
    margin-top: 0.4em;
    margin-bottom: 0.6em;
    cursor: pointer;
}

:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_COVER_ID} {
    cursor: wait;
}

#${AUDIO_BUFFER_CANVAS_ID} {
    width: 500px;
    height: 20px;

    margin-left: auto;
    margin-right: auto;

    margin-bottom: 1em;

    display: block;
}

#${AUDIO_ID} {
    display: block;
    margin-left: auto;
    margin-right: auto;
    max-width: 800px;
    height: 2.5em;
    width: 80%;
}

#${AUDIO_CONTROLS_ID} {
    display: block;
    padding: 0;
    margin: 0;
    margin-left: auto;
    margin-right: auto;

    max-width: 500px;
    min-width: 500px;
    width: 500px;
    height: auto;

    display: grid;
    grid-column-gap: 0px;
    grid-row-gap: 0px;

    grid-template-columns: auto 3em 7em 3em auto;
    grid-template-rows: auto 1.5em auto;
}

#${AUDIO_CONTROLS_ID} button {
    border: 0 !important;
    background-color: transparent !important;
    background: transparent !important;
    text-align: center;
    padding: 0;
    margin: 0;
    display: block;
    cursor: pointer;
    position: relative;
}

#${AUDIO_CONTROLS_ID} #${AUDIO_PLAYPAUSE_ID} {
    grid-column-start: 3;
    grid-column-end: 4;
    grid-row-start: 1;
    grid-row-end: 2;

    box-sizing: border-box;

    justify-self: center;

    width: 60px;
    height: 60px;
}

:root #${AUDIO_CONTROLS_ID} svg,
:root[style] #${AUDIO_CONTROLS_ID} svg {
    fill: #202020;
}
:root[style*="readium-night-on"] #${AUDIO_CONTROLS_ID} svg {
    fill: #999999;
}

:root:not(.${AUDIO_PROGRESS_CLASS}) #${AUDIO_CONTROLS_ID} #${AUDIO_PLAYPAUSE_ID} #${AUDIO_PLAYPAUSE_ID}_0,
:root[style]:not(.${AUDIO_PROGRESS_CLASS}) #${AUDIO_CONTROLS_ID} #${AUDIO_PLAYPAUSE_ID} #${AUDIO_PLAYPAUSE_ID}_0 {

    display: none;
}

:root:not(.${AUDIO_PROGRESS_CLASS}) #${AUDIO_CONTROLS_ID} #${AUDIO_PLAYPAUSE_ID}.pause #${AUDIO_PLAYPAUSE_ID}_1 {
    display: none;
}

:root:not(.${AUDIO_PROGRESS_CLASS}) #${AUDIO_CONTROLS_ID} #${AUDIO_PLAYPAUSE_ID}.pause #${AUDIO_PLAYPAUSE_ID}_0 {
    display: block;
}

:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_CONTROLS_ID} #${AUDIO_PLAYPAUSE_ID} svg {
    display: none;
}
:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_CONTROLS_ID} #${AUDIO_PLAYPAUSE_ID} {
    cursor: wait;
}
:root[style].${AUDIO_PROGRESS_CLASS} #${AUDIO_CONTROLS_ID} #${AUDIO_PLAYPAUSE_ID}:after {
    content: "";
    border-radius: 50%;

    position: absolute;
    width: 60px;
    height: 60px;
    left: 0px;
    top: 0px;

    transform: translateZ(0);
    animation: readium2ElectronAnimation_audioLoad-spin 1.1s infinite linear;

    border-top: 3px solid #999999;
    border-right: 3px solid #999999;
    border-bottom: 3px solid #999999;
    border-left: 3px solid #333333;
}
:root[style*="readium-night-on"].${AUDIO_PROGRESS_CLASS} #${AUDIO_CONTROLS_ID} #${AUDIO_PLAYPAUSE_ID}:after {

    border-top: 3px solid #202020;
    border-right: 3px solid #202020;
    border-bottom: 3px solid #202020;
    border-left: 3px solid white;
}
@keyframes readium2ElectronAnimation_audioLoad-spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

#${AUDIO_CONTROLS_ID} #${AUDIO_NEXT_ID},
#${AUDIO_CONTROLS_ID} #${AUDIO_PREVIOUS_ID},
#${AUDIO_CONTROLS_ID} #${AUDIO_REWIND_ID},
#${AUDIO_CONTROLS_ID} #${AUDIO_FORWARD_ID} {
    width: 48px;
    height: 48px;
    position: relative;
    align-self: center;
}

#${AUDIO_CONTROLS_ID} #${AUDIO_PREVIOUS_ID} {
    grid-column-start: 1;
    grid-column-end: 2;
    grid-row-start: 1;
    grid-row-end: 2;

    justify-self: left;
}

#${AUDIO_CONTROLS_ID} #${AUDIO_NEXT_ID} {
    grid-column-start: 5;
    grid-column-end: 6;
    grid-row-start: 1;
    grid-row-end: 2;

    justify-self: right;
}
#${AUDIO_CONTROLS_ID} #${AUDIO_REWIND_ID} {
    grid-column-start: 2;
    grid-column-end: 3;
    grid-row-start: 1;
    grid-row-end: 2;

    justify-self: right;
}
#${AUDIO_CONTROLS_ID} #${AUDIO_FORWARD_ID} {
    grid-column-start: 4;
    grid-column-end: 5;
    grid-row-start: 1;
    grid-row-end: 2;

    justify-self: left;
}
:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_FORWARD_ID},
:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_REWIND_ID} {
    display: none;
}

#${AUDIO_PERCENT_ID}, #${AUDIO_TIME_ID}, #${AUDIO_RATE_ID} {
    font-size: 0.9em !important;
    font-family: sans-serif !important;
}
#${AUDIO_PERCENT_ID}, #${AUDIO_TIME_ID} {
    margin-top: -0.5em;
}
#${AUDIO_RATE_ID} {
    grid-column-start: 3;
    grid-column-end: 4;
    grid-row-start: 3;
    grid-row-end: 4;

    font-size: 0.8em !important;
    width: 4em;

    justify-self: center;

    text-align: center !important;

    margin-top: -0.2em;

    -webkit-appearance: none;
    border: 1px solid #aaa;
    border-radius: .4em;
    box-sizing: border-box;
    padding: .15em .15em .15em .3em;
    background-color: transparent;

    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23aaa%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
    background-repeat: no-repeat, repeat;
    background-position: right .3em top 50%, 0 0;
    background-size: .7em auto, 100%;
}
#${AUDIO_TIME_ID} {
    grid-column-start: 1;
    grid-column-end: 2;
    grid-row-start: 3;
    grid-row-end: 4;

    text-align: left !important;
}
#${AUDIO_PERCENT_ID} {
    grid-column-start: 5;
    grid-column-end: 6;
    grid-row-start: 3;
    grid-row-end: 4;

    text-align: right !important;
}

:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_RATE_ID},
:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_PERCENT_ID},
:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_TIME_ID} {
    visibility: hidden;
}

:root[style] #${AUDIO_SLIDER_ID},
:root #${AUDIO_SLIDER_ID} {
padding: 0;
margin: 0;

display: block;

grid-column-start: 1;
grid-column-end: 6;
grid-row-start: 2;
grid-row-end: 3;

cursor: pointer;

background: transparent !important;

background-clip: padding-box;
border-radius: 2px;
overflow: hidden;

position: relative;

-webkit-appearance: none;

--audiopercent: 50%;
--range-color-left: #545454;
--range-color-right: #999999;
--track-background: linear-gradient(to right, var(--range-color-left) var(--audiopercent), var(--range-color-right) 0) no-repeat 0 100% / 100% 100%;
}
:root[style*="readium-night-on"] #${AUDIO_SLIDER_ID} {
    --range-color-right: #545454;
    --range-color-left: #999999;
}

:root[style].${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID},
:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID} {

cursor: wait;
}

:root[style].${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}:before,
:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}:before {
    content: '';
    position: absolute;
    background-color: #999999;
    left: 0;
    top: 1em;
    height: 0.4em;
    transform: translateZ(0);
    will-change: left, right;
    animation: readium2ElectronAnimation_audioLoad 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
}

:root[style].${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}:after,
:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}:after {
    content: '';
    position: absolute;
    background-color: #999999;
    left: 0;
    top: 1em;
    height: 0.4em;
    transform: translateZ(0);
    will-change: left, right;
    animation: readium2ElectronAnimation_audioLoad-short 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) infinite;
    animation-delay: 1.15s;
}

:root[style*="readium-night-on"].${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}:after {
    background: #545454;
}

@keyframes readium2ElectronAnimation_audioLoad {
0% {
left: -35%;
right: 100%; }
60% {
left: 100%;
right: -90%; }
100% {
left: 100%;
right: -90%; } }

@keyframes readium2ElectronAnimation_audioLoad-short {
0% {
left: -200%;
right: 100%; }
60% {
left: 107%;
right: -8%; }
100% {
left: 107%;
right: -8%; } }

:root #${AUDIO_SLIDER_ID}::-webkit-slider-runnable-track,
:root[style] #${AUDIO_SLIDER_ID}::-webkit-slider-runnable-track {
    cursor: pointer;

    width: 100%;
    height: 0.5em;

    background: #999999;
    background: var(--track-background);

    padding: 0;
    margin: 0;

    border: none;
    border-radius: 0.2em;
}
:root[style*="readium-night-on"] #${AUDIO_SLIDER_ID}::-webkit-slider-runnable-track {

    background: #545454;
    background: var(--track-background);
}

:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}::-webkit-slider-runnable-track,
:root[style].${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}::-webkit-slider-runnable-track {
    background: transparent !important;
    cursor: wait;
}
:root[style*="readium-night-on"].${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}::-webkit-slider-runnable-track {
    background: transparent !important;
}

:root #${AUDIO_SLIDER_ID}::-webkit-slider-thumb,
:root[style] #${AUDIO_SLIDER_ID}::-webkit-slider-thumb {
    -webkit-appearance: none;

    cursor: pointer;

    width: 0.5em;
    height: 0.7em;

    padding: 0;
    margin: 0;
    margin-top: -0.1em;

    border: none;
    border-radius: 0.2em;

    background: #333333;
}
:root[style*="readium-night-on"] #${AUDIO_SLIDER_ID}::-webkit-slider-thumb {
    background: white;
}

:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}::-webkit-slider-thumb,
:root[style].${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}::-webkit-slider-thumb {
    background: transparent !important;
    cursor: wait;
}
:root[style*="readium-night-on"].${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}::-webkit-slider-thumb {
    background: transparent !important;
}
`;
