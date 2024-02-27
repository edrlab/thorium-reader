// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as path from "path";
import { computeReadiumCssJsonMessage } from "readium-desktop/common/computeReadiumCssJsonMessage";
import { ReaderConfig } from "readium-desktop/common/models/reader";
import { diMainGet } from "readium-desktop/main/di";
import { _APP_NAME, _APP_VERSION, _NODE_MODULE_RELATIVE_URL, _PACKAGING } from "readium-desktop/preprocessor-directives";

import { IEventPayload_R2_EVENT_READIUMCSS } from "@r2-navigator-js/electron/common/events";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";
import { Transformers } from "@r2-shared-js/transform/transformer";
import { TransformerHTML } from "@r2-shared-js/transform/transformer-html";
import { TransformerSVG } from "./transformer-svg";

const debug = debug_("readium-desktop:main#streamerCommon");

export function computeReadiumCssJsonMessageInStreamer(
    _r2Publication: R2Publication,
    _link: Link | undefined,
    sessionInfo: string | undefined,
): IEventPayload_R2_EVENT_READIUMCSS {

    const winId = sessionInfo ? Buffer.from(sessionInfo, "base64").toString("utf-8") : "";

    let settings: ReaderConfig;
    if (winId) {
        debug("winId:", winId);

        const store = diMainGet("store");
        const state = store.getState();

        try {
            settings = state.win.session.reader[winId].reduxState.config;

            debug("PAGED: ", settings.paged, "colCount:", settings.colCount);

        } catch (err) {
            settings = state.reader.defaultConfig;

            debug("settings from default config");
            debug("ERROR", err);
        }
    } else {

        const store = diMainGet("store");
        settings = store.getState().reader.defaultConfig;
    }

    return computeReadiumCssJsonMessage(settings);
}

let mathJaxPath = "MathJax";
if (_PACKAGING === "1") {
    mathJaxPath = path.normalize(path.join(__dirname, mathJaxPath));
} else {
    mathJaxPath = "mathjax";
    mathJaxPath = path.normalize(path.join(__dirname, _NODE_MODULE_RELATIVE_URL, mathJaxPath));
}
mathJaxPath = mathJaxPath.replace(/\\/g, "/");
debug("MathJax path:", mathJaxPath);

export const MATHJAX_FILE_PATH = mathJaxPath;
export const MATHJAX_URL_PATH = "math-jax";

let rcssPath = "ReadiumCSS";
if (_PACKAGING === "1") {
    rcssPath = path.normalize(path.join(__dirname, rcssPath));
} else {
    rcssPath = "r2-navigator-js/dist/ReadiumCSS";
    rcssPath = path.normalize(path.join(__dirname, _NODE_MODULE_RELATIVE_URL, rcssPath));
}

rcssPath = rcssPath.replace(/\\/g, "/");
debug("readium css path:", rcssPath);

export const READIUMCSS_FILE_PATH = rcssPath;

export function setupMathJaxTransformer(getUrl: () => string) {

    const transformerMathJax = (
        _publication: R2Publication, _link: Link, _url: string | undefined, str: string): string => {

        // TODO: extract this drag logic somewhere else ...
        const cssElectronMouseDrag =
            `
    <style type="text/css">
    /*
     *,
     *::after,
     *::before {
        -webkit-user-drag: none !important;
        -webkit-app-region: no-drag !important;
    }
     */
    </style>
    `;
        str = str.replace(/<\/head>/, `${cssElectronMouseDrag}</head>`);

        // see setEpubReadingSystemInfo() in Reader.tsx
        // see setWindowNavigatorEpubReadingSystem() in r2-navigator-js/preload.ts
        // this will automatically be injected in iframes (recursively, see related transformerIFrames())
        str = str.replace(/<head([^>]*)>/, `<head$1>
<!-- https://github.com/edrlab/thorium-reader/issues/1897 -->
<script type="text/javascript">
window._thorium_websql_void_openDatabase = window.openDatabase;
window.openDatabase = undefined;
</script>

<script type="text/javascript">

const ers = {};
ers.name = "${_APP_NAME}";
ers.version = "${_APP_VERSION}";

ers.hasFeature = (feature, version) => {
    switch (feature) {
        case "dom-manipulation": {
            return true;
        }
        case "layout-changes": {
            return true;
        }
        case "touch-events": {
            return true;
        }
        case "mouse-events": {
            return true;
        }
        case "keyboard-events": {
            return true;
        }
        case "spine-scripting": {
            return true;
        }
        default: return false;
    }
};

if (!window.navigator.epubReadingSystem
    || window.navigator.epubReadingSystem.name != "${_APP_NAME}"
    || window.navigator.epubReadingSystem.version != "${_APP_VERSION}"
    ) {
    window.navigator.epubReadingSystem = ers;
}

</script>
`);

        const scriptTextDrag =
            `
    <script type="text/javascript">
    // document.addEventListener("DOMContentLoaded", () => {
    // });
    window.addEventListener("load", () => {
        setTimeout(() => {
            document.addEventListener("dragstart", (e) => {
                // console.log("dragstart capture currentTarget", typeof e.currentTarget, e.currentTarget);
                // console.log("dragstart capture target", typeof e.target, e.target, e.target.tagName?.toLowerCase());

                const sel = document.getSelection();
                if (sel &amp;&amp; !sel.isCollapsed) {
                    // console.log("dragstart capture document selection preventDefault");
                    // e.preventDefault();
                    e.dataTransfer.clearData();
                    e.dataTransfer.setData("text/plain", " ");
                } else if (e.target.tagName) {
                    const n = e.target.tagName.toLowerCase();
                    if (n === "a") {
                        // console.log("dragstart capture target preventDefault ", n);
                        // e.preventDefault();
                        e.dataTransfer.clearData();
                        e.dataTransfer.setData("text/plain", "https://www.edrlab.org/software/thorium-reader/");
                    } else if (n === "img" || n === "video" || n === "svg") {
                        // console.log("dragstart capture target preventDefault ", n);
                        // e.preventDefault();
                        e.dataTransfer.clearData();
                        e.dataTransfer.setData("text/plain", " ");
                    }
                }
            }, true);

            /*
            document.addEventListener("dragend", (e) => {
                console.log("dragend capture currentTarget", typeof e.currentTarget, e.currentTarget);
                console.log("dragend capture target", typeof e.target, e.target);
            }, true);

            document.addEventListener("dragstart", (e) => {
                console.log("dragstart not-capture currentTarget", typeof e.currentTarget, e.currentTarget);
                console.log("dragstart not-capture target", typeof e.target, e.target);
            }, false);

            document.addEventListener("dragend", (e) => {
                console.log("dragend not-capture currentTarget", typeof e.currentTarget, e.currentTarget);
                console.log("dragend not-capture target", typeof e.target, e.target);
            }, false);
             */
        }, 100);
    });
    </script>
    `;
        str = str.replace(/<\/head>/, `${scriptTextDrag}</head>`);

        const store = diMainGet("store");
        // TODO
        // Same comment that above
        const settings = store.getState().reader.defaultConfig;

        // // &nbsp; &#X200B;
        str = str.replace(/<wbr\/>/g, "<r2-wbr></r2-wbr>");
        // str = str.replace(/<wbr><\/wbr>/g, "<r2-wbr></r2-wbr>");

        if (settings.enableMathJax) {
            const thorium_mathJax_script = "thorium_mathJax_script";

            // import { app } from "electron";
            // const accessibilitySupportEnabled = app.accessibilitySupportEnabled; // .isAccessibilitySupportEnabled()
            const options =
            // !accessibilitySupportEnabled ?
`
loader: {
load: [
'a11y/semantic-enrich',
'a11y/assistive-mml',
// 'a11y/explorer',
// 'a11y/complexity',
],
},
options:
{
menuOptions: {
settings: {
explorer: false,
assistiveMml: true,
collapsible: false,
}
},
enableComplexity: false,
// makeCollapsible: false,
enableAssistiveMml: true,
enableEnrichment: true,
sre: {
speech: 'shallow', // none, shallow, deep
domain: 'mathspeak', // mathspeak, clearspeak
style: 'default', // default, brief
locale: 'en', // en, fr, es, de, it
subiso: 'us', // fr => fr, be, ch
markup: 'none', // none, ssml, sable, voicexml, acss, ssml_step
modality: 'speech', // speech, braille, prefix, summary
},
// enrichError: (doc, math, err) => doc.enrichError(doc, math, err),
enableExplorer: false,
a11y: {
speech: true,
subtitles: false,
braille: false,
viewBraille: false,
}
},
`
// :
// `
// `
;
            const script = `
<script id='${thorium_mathJax_script}' type="text/javascript">
// document.addEventListener("DOMContentLoaded", () => {
// });
window.addEventListener("load", () => {
setTimeout(() => {
var thisEl = document.getElementById('${thorium_mathJax_script}');

if (window.MathJax) {
var msg = 'window.MathJax already exist, SKIP.';
if (thisEl) {
thisEl.setAttribute('data-msg', msg);
}
console.log(msg);
return;
}

if (document.getElementById('__${thorium_mathJax_script}')) {
var msg = '${thorium_mathJax_script} already exist, SKIP.';
if (thisEl) {
thisEl.setAttribute('data-msg', msg);
}
console.log(msg);
return;
}

// https://docs.mathjax.org/en/v3.2-latest/options/
window.MathJax = {
${options}
startup: {
ready: () => {
var msg = 'Thorium MathJax ready';
if (thisEl) {
thisEl.setAttribute('data-msg', msg);
}
console.log(msg);

window.MathJax.startup.promise.then(() => {
var msg = 'Thorium MathJax startup.promise.then';
if (thisEl) {
thisEl.setAttribute('data-msg', msg);
}
console.log(msg);

document.body.querySelectorAll('mjx-container').forEach((mcont) => {
for (var mass of mcont.children) {
// console.log('==== ', mass.tagName, mass.localName);
if (mass.localName === 'mjx-assistive-mml' || mass.tagName.toLowerCase() === 'mjx-assistive-mml') {
mass.removeAttribute('aria-hidden');
// console.log('---- ', mass.firstElementChild.tagName, mass.firstElementChild.localName);
if (mass.firstElementChild &amp;&amp;
(mass.firstElementChild.localName === 'math' || mass.firstElementChild.tagName.toUpperCase() === 'MATH')
) {
var alttext = mass.firstElementChild.getAttribute('alttext');
if (alttext) {
mcont.setAttribute('aria-label', alttext);
}
}
}
}
});
});

window.MathJax.startup.defaultReady();

msg = 'Thorium MathJax after startup.defaultReady';
if (thisEl) {
thisEl.setAttribute('data-msg', msg);
}
console.log(msg);
},
pageReady: () => {
var msg = 'Thorium MathJax page ready';
if (thisEl) {
thisEl.setAttribute('data-msg', msg);
}
console.log(msg);

return window.MathJax.startup.defaultPageReady();
}
}
};

var msg = 'Thorium MathJax ...';
if (thisEl) {
thisEl.setAttribute('data-msg', msg);
}
console.log(msg);

var scriptEl = document.createElement('script');
scriptEl.setAttribute('id', '__${thorium_mathJax_script}');
// scriptEl.setAttribute('async', 'async');
scriptEl.setAttribute('onload', 'javascript:console.log("Thorium MathJax LOADED.")');
// https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-mml-chtml.js
scriptEl.setAttribute('src', '${getUrl()}');
document.head.appendChild(scriptEl);
}, 500);
});
</script>
`;
            // <script type="text/javascript" async="async" src="${getUrl()}"> </script>
            return fixBrokenSelfClosingBody(str.replace(/<\/head>/, `${script}</head>`));
        } else {
            return fixBrokenSelfClosingBody(str);
        }
    };
    Transformers.instance().add(new TransformerHTML(transformerMathJax));

    const transformerSVG = (
        _publication: R2Publication, _link: Link, _url: string | undefined, str: string): string => {

        // see setEpubReadingSystemInfo() in Reader.tsx
        // see setWindowNavigatorEpubReadingSystem() in r2-navigator-js/preload.ts
        // this will automatically be injected in iframes (recursively, see related transformerIFrames())
        str = str.replace(/<svg([^>]*)>/, `<svg$1>
<script type="text/javascript">

const ers = {};
ers.name = "${_APP_NAME}";
ers.version = "${_APP_VERSION}";

ers.hasFeature = (feature, version) => {
    switch (feature) {
        case "dom-manipulation": {
            return true;
        }
        case "layout-changes": {
            return true;
        }
        case "touch-events": {
            return true;
        }
        case "mouse-events": {
            return true;
        }
        case "keyboard-events": {
            return true;
        }
        case "spine-scripting": {
            return true;
        }
        default: return false;
    }
};

if (!window.navigator.epubReadingSystem
    || window.navigator.epubReadingSystem.name != "${_APP_NAME}"
    || window.navigator.epubReadingSystem.version != "${_APP_VERSION}"
    ) {
    window.navigator.epubReadingSystem = ers;
}

</script>
`);

        return str;
    };
    Transformers.instance().add(new TransformerSVG(transformerSVG));
}

// Seen in some InDesign-generated fixed layout FXL pre-paginated EPUBs that have blank pages, literally empty body!
// <body>
// </html>
// (note the missing self-closing "/>" for "<body", that's actually the outcome of r2-navigator DOM parser/serialiser (xmldom lib), after injecting ReadiumCSS)
const fixBrokenSelfClosingBody = (str: string): string => {
    const iBodyClose = str.indexOf("</body>");
    if (iBodyClose < 0) {
        return str.replace("</html>", "</body></html>");
    }
    return str;
};
