// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    CSS_CLASS_NO_FOCUS_OUTLINE, POPOUTIMAGE_CONTAINER_ID, POPOUTIMAGE_CONTROLS_ID, POPOUTIMAGE_CLOSE_ID, POPOUTIMAGE_MINUS_ID, POPOUTIMAGE_PLUS_ID, POPOUTIMAGE_RESET_ID, TTS_POPUP_DIALOG_CLASS,
} from "../../common/styles";
import { PopupDialog, closePopupDialogs } from "../common/popup-dialog";
import { ReadiumElectronWebviewWindow } from "./state";

export function popoutImage(
    win: ReadiumElectronWebviewWindow,
    _cssSelectorOf_HTMLImg_SVGImage_SVGFragment: string,
    HTMLImg_SVGImage_SVGFragment: HTMLImageElement | SVGElement,
    HTMLImgSrc_SVGImageHref_SVGFragmentMarkup: string,
    isSVGFragment: boolean,
    _isSVGImage: boolean,
    focusScrollRaw:
        (el: HTMLOrSVGElement, doFocus: boolean, animate: boolean, domRect: DOMRect | undefined) => void,
    ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable: () => number,
    ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable: (val: number) => void,
) {
    const element = HTMLImg_SVGImage_SVGFragment;
    let href_src = HTMLImgSrc_SVGImageHref_SVGFragmentMarkup;

    // https://github.com/jackmoore/wheelzoom/blob/05224659740eea775a779faa62cef0ec0126082/wheelzoom.js
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (win as any).wheelzoom = (img: HTMLImageElement) => {
        const zoomStep = 0.10;
        const panStep = 20;

        let viewportWidth = 0;
        let viewportHeight = 0;
        let naturalWidth = 0;
        let naturalHeight = 0;
        let containedWidth = 0;
        let containedHeight = 0;

        let bgWidth = 0;
        let bgHeight = 0;
        let bgPosX = 0;
        let bgPosY = 0;

        let touchHypot = 0;

        let previousEvent: MouseEvent | undefined;
        let previousEventTouch: TouchEvent | undefined;

        function updateBgStyle() {
            // if (bgPosX > 0) {
            //     bgPosX = 0;
            // } else if (bgPosX < width - bgWidth) {
            //     bgPosX = width - bgWidth;
            // }

            // if (bgPosY > 0) {
            //     bgPosY = 0;
            // } else if (bgPosY < height - bgHeight) {
            //     bgPosY = height - bgHeight;
            // }

            img.style.backgroundSize = bgWidth + "px " + bgHeight + "px";
            img.style.backgroundPosition = bgPosX + "px " + bgPosY + "px";
        }

        function ontouch(e: TouchEvent) {
            e.preventDefault();
            e.stopPropagation();

            if (e.targetTouches.length !== 2) {
                return;
            }

            const pageX1 = e.targetTouches[0].pageX;
            const pageY1 = e.targetTouches[0].pageY;

            const pageX2 = e.targetTouches[1].pageX;
            const pageY2 = e.targetTouches[1].pageY;

            // Math.hypot()
            const touchHypot_ = Math.round(Math.sqrt(Math.pow(Math.abs(pageX1 - pageX2), 2) + Math.pow(Math.abs(pageY1 - pageY2), 2)));

            let direction = 0;
            if (touchHypot_ > touchHypot + 5) direction = -1;
            if (touchHypot_ < touchHypot - 5) direction = 1;

            if (direction !== 0) {
                if (touchHypot || direction === 1) {

                    const pageX = Math.min(pageX1, pageX2) + (Math.abs(pageX1 - pageX2) / 2);
                    const pageY = Math.min(pageY1, pageY2) + (Math.abs(pageY1 - pageY2) / 2);

                    const rect = img.getBoundingClientRect();
                    const offsetX = pageX - rect.left - win.pageXOffset;
                    const offsetY = pageY - rect.top - win.pageYOffset;

                    const bgCursorX = offsetX - bgPosX;
                    const bgCursorY = offsetY - bgPosY;

                    const bgRatioX = bgCursorX / bgWidth;
                    const bgRatioY = bgCursorY / bgHeight;

                    if (direction < 0) {
                        bgWidth += bgWidth * zoomStep;
                        bgHeight += bgHeight * zoomStep;
                    } else {
                        bgWidth -= bgWidth * zoomStep;
                        bgHeight -= bgHeight * zoomStep;
                    }

                    bgPosX = offsetX - (bgWidth * bgRatioX);
                    bgPosY = offsetY - (bgHeight * bgRatioY);

                    updateBgStyle();
                }

                touchHypot = touchHypot_;
            }
        }

        function onwheel(e: WheelEvent) {
            e.preventDefault();
            e.stopPropagation();

            const rect = img.getBoundingClientRect();
            const offsetX = e.pageX - rect.left - win.pageXOffset;
            const offsetY = e.pageY - rect.top - win.pageYOffset;

            const bgCursorX = offsetX - bgPosX;
            const bgCursorY = offsetY - bgPosY;

            const bgRatioX = bgCursorX / bgWidth;
            const bgRatioY = bgCursorY / bgHeight;

            if (e.deltaY < 0) {
                bgWidth += bgWidth * zoomStep;
                bgHeight += bgHeight * zoomStep;
            } else {
                bgWidth -= bgWidth * zoomStep;
                bgHeight -= bgHeight * zoomStep;
            }

            bgPosX = offsetX - (bgWidth * bgRatioX);
            bgPosY = offsetY - (bgHeight * bgRatioY);

            updateBgStyle();
        }

        // let clickDownUpHasMovedTouch = false;
        function dragtouch(e: TouchEvent) {
            if (e.targetTouches.length !== 1) {
                return;
            }
            // clickDownUpHasMovedTouch = true;
            e.preventDefault();
            const pageX = e.targetTouches[0].clientX;
            const pageY = e.targetTouches[0].clientY;
            bgPosX += (pageX - (previousEventTouch?.targetTouches[0].clientX || 0));
            bgPosY += (pageY - (previousEventTouch?.targetTouches[0].clientY || 0));
            previousEventTouch = e;
            updateBgStyle();
        }

        function removeDragtouch(e: TouchEvent) {
            if (e.targetTouches.length !== 1) {
                return;
            }
            // clickDownUpHasMovedTouch = false;
            e.preventDefault();
            e.stopPropagation();
            previousEventTouch = undefined;
            img.removeEventListener("touchend", removeDragtouch);
            img.removeEventListener("touchmove", dragtouch);
        }

        function draggabletouch(e: TouchEvent) {
            if (e.targetTouches.length !== 1) {
                return;
            }
            // clickDownUpHasMovedTouch = false;
            e.preventDefault();
            previousEventTouch = e;
            img.addEventListener("touchmove", dragtouch);
            img.addEventListener("touchend", removeDragtouch);
        }

        let clickDownUpHasMoved = false;
        function drag(e: MouseEvent) {
            clickDownUpHasMoved = true;
            e.preventDefault();
            bgPosX += (e.pageX - (previousEvent?.pageX || 0));
            bgPosY += (e.pageY - (previousEvent?.pageY || 0));
            previousEvent = e;
            updateBgStyle();
        }

        function removeDrag(e: MouseEvent) {
            // clickDownUpHasMoved = false;
            e.preventDefault();
            e.stopPropagation();
            previousEvent = undefined;
            document.removeEventListener("mouseup", removeDrag);
            document.removeEventListener("mouseleave", removeDrag);
            document.removeEventListener("mousemove", drag);
        }

        function draggable(e: MouseEvent) {
            clickDownUpHasMoved = false;
            e.preventDefault();
            previousEvent = e;
            document.addEventListener("mousemove", drag);
            document.addEventListener("mouseup", removeDrag);
            document.addEventListener("mouseleave", removeDrag);
        }

        function onclick(e: MouseEvent | undefined, force?: boolean) {
            if (!force && (previousEvent || clickDownUpHasMoved)) {
                return;
            }
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            const initialZoom = 1;
            bgWidth = containedWidth * initialZoom;
            bgHeight = containedHeight * initialZoom;
            bgPosX = -(bgWidth - viewportWidth) * 0.5;
            bgPosY = -(bgHeight - viewportHeight) * 0.5;

            updateBgStyle();
        }

        function reset() {
            const computedStyle = win.getComputedStyle(img, null);
            viewportWidth = parseInt(computedStyle.width, 10);
            viewportHeight = parseInt(computedStyle.height, 10);

            const hRatio = naturalHeight / viewportHeight;
            const wRatio = naturalWidth / viewportWidth;

            containedWidth = viewportWidth;
            containedHeight = viewportHeight;
            if (hRatio > wRatio) {
                containedWidth = naturalWidth / hRatio;
            } else if (hRatio < wRatio) {
                containedHeight = naturalHeight / wRatio;
            }
        }

        function init() {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((img as any).__INITED) {
                return;
            }

            win.READIUM2.ignorekeyDownUpEvents = true;

            naturalHeight = img.naturalHeight;
            naturalWidth = img.naturalWidth;

            reset();

            img.style.backgroundRepeat = "no-repeat";
            img.style.backgroundImage = "url(\"" + img.src + "\")";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (img as any).__INITED = true;

            img.src = "data:image/svg+xml;base64," + Buffer.from("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + naturalWidth + "\" height=\"" + naturalHeight + "\"></svg>").toString("base64");

            onclick(undefined, true);

            img.addEventListener("wheel", onwheel);
            img.addEventListener("touchmove", ontouch);
            img.addEventListener("touchstart", draggabletouch);
            img.addEventListener("mousedown", draggable);
            img.addEventListener("click", onclick);

            const resizeObserver = new win.ResizeObserver((_entries) => {
                reset();
                onclick(undefined, true);
            });
            resizeObserver.observe(img);
            // img.addEventListener("resize", () => {
            //     reset();
            //     onclick(undefined, true);
            // });

            (win.document.getElementById(POPOUTIMAGE_CLOSE_ID) as HTMLElement).focus();
            (win.document.getElementById(POPOUTIMAGE_CLOSE_ID) as HTMLElement).addEventListener("click", () => {
                closePopupDialogs(win.document);
            });
            (win.document.getElementById(POPOUTIMAGE_RESET_ID) as HTMLElement).addEventListener("click", () => {
                onclick(undefined, true);
            });
            const panLeft = (fast: boolean) => {
                bgPosX -= panStep * (fast ? 2 : 1);

                updateBgStyle();
            };
            const panRight = (fast: boolean) => {
                bgPosX += panStep * (fast ? 2 : 1);

                updateBgStyle();
            };
            const panUp = (fast: boolean) => {
                bgPosY -= panStep * (fast ? 2 : 1);

                updateBgStyle();
            };
            const panDown = (fast: boolean) => {
                bgPosY += panStep * (fast ? 2 : 1);

                updateBgStyle();
            };
            const minus = () => {
                // bgWidth -= bgWidth * zoomStep;
                // bgHeight -= bgHeight * zoomStep;

                const offsetX = viewportWidth / 2;
                const offsetY = viewportHeight / 2;

                const bgCursorX = offsetX - bgPosX;
                const bgCursorY = offsetY - bgPosY;

                const bgRatioX = bgCursorX / bgWidth;
                const bgRatioY = bgCursorY / bgHeight;

                bgWidth -= bgWidth * zoomStep;
                bgHeight -= bgHeight * zoomStep;

                bgPosX = offsetX - (bgWidth * bgRatioX);
                bgPosY = offsetY - (bgHeight * bgRatioY);

                updateBgStyle();
            };
            (win.document.getElementById(POPOUTIMAGE_MINUS_ID) as HTMLElement).addEventListener("click", minus);
            const plus = () => {
                // bgWidth += bgWidth * zoomStep;
                // bgHeight += bgHeight * zoomStep;

                const offsetX = viewportWidth / 2;
                const offsetY = viewportHeight / 2;

                const bgCursorX = offsetX - bgPosX;
                const bgCursorY = offsetY - bgPosY;

                const bgRatioX = bgCursorX / bgWidth;
                const bgRatioY = bgCursorY / bgHeight;

                bgWidth += bgWidth * zoomStep;
                bgHeight += bgHeight * zoomStep;

                bgPosX = offsetX - (bgWidth * bgRatioX);
                bgPosY = offsetY - (bgHeight * bgRatioY);

                updateBgStyle();
            };
            (win.document.getElementById(POPOUTIMAGE_PLUS_ID) as HTMLElement).addEventListener("click", plus);

            function keyDownUpEventHandler(ev: KeyboardEvent, _keyDown: boolean) {
                // altKey: ev.altKey,
                // code: ev.code,
                // ctrlKey: ev.ctrlKey,
                // key: ev.key,
                // metaKey: ev.metaKey,
                // shiftKey: ev.shiftKey,

                let handled = false;
                if (ev.keyCode === 37) { // left
                    handled = true;
                    panLeft(ev.ctrlKey);
                } else if (ev.keyCode === 39) { // right
                    handled = true;
                    panRight(ev.ctrlKey);
                } else if (ev.keyCode === 38) { // up
                    handled = true;
                    panUp(ev.ctrlKey);
                } else if (ev.keyCode === 40) { // down
                    handled = true;
                    panDown(ev.ctrlKey);
                } else if (ev.ctrlKey && ev.code === "Minus") {
                    handled = true;
                    minus();
                } else if (ev.ctrlKey && ev.code === "Plus") {
                    handled = true;
                    plus();
                } else if (ev.ctrlKey && (ev.code === "Digit0" || ev.code === "Digit1" || ev.code === "Backspace" || ev.code === "Equal")) {
                    handled = true;
                    reset();
                }
                if (handled) {
                    ev.preventDefault();
                    ev.stopPropagation();
                }
            }
            (win.document.getElementById(POPOUTIMAGE_CONTAINER_ID) as HTMLElement).addEventListener("keydown", (ev: KeyboardEvent) => {
                keyDownUpEventHandler(ev, true);
            }, {
                capture: true,
                once: false,
                passive: false,
            });
            // (win.document.getElementById(POPOUTIMAGE_CONTAINER_ID) as HTMLElement).addEventListener("keyup", (ev: KeyboardEvent) => {
            //     keyDownUpEventHandler(ev, false);
            // }, {
            //     capture: true,
            //     once: false,
            //     passive: false,
            // });
        }
        init();
        // if (img.complete) {
        //     init();
        // }
        // img.addEventListener("load", init);
    };

    // const documant = win.document || element.ownerDocument as Document;
    // if (!documant.documentElement
    //     || documant.documentElement.classList.contains(ROOT_CLASS_NO_POPOUTIMAGES)
    // ) {
    //     return false;
    // }

    // const isSVG = href_src.startsWith("<svg");
    if (isSVGFragment) {
        // href_src = href_src.replace(/[\r\n]/g, " ").replace(/\s\s+/g, " ").trim();
        href_src = "data:image/svg+xml;base64," + Buffer.from(href_src).toString("base64");
    }

    const onloadhandler = "onload=\"javascript: " +
        "window.wheelzoom(this);" +
        "return; \"";

    // tslint:disable-next-line:max-line-length
    const htmltxt = `
<div
    class="${CSS_CLASS_NO_FOCUS_OUTLINE}"
    tabindex="0"
    autofocus="autofocus"
    id="${POPOUTIMAGE_CONTAINER_ID}"
    >
    <img
        class="${POPOUTIMAGE_CONTAINER_ID}"
        ${onloadhandler}
        src="${href_src}"
    />
    <div id="${POPOUTIMAGE_CONTROLS_ID}">
    <button id="${POPOUTIMAGE_MINUS_ID}">-</button>
    <button id="${POPOUTIMAGE_RESET_ID}" title="0">O</button>
    <button id="${POPOUTIMAGE_PLUS_ID}">+</button>
    </div>
    <button id="${POPOUTIMAGE_CLOSE_ID}">X</button>
</div>`;

    // ${win.document.documentElement.classList.contains(ROOT_CLASS_FIXED_LAYOUT) ?
    //     "style=\"transform-origin: 0px 0px;transform: scale(var(--r2_fxl_scale));\"" :
    //     ""}

    const val = ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable();

    // HACKY!
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // if (!(win as any).readiumClosePopupDialogs) {
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     (win as any).readiumClosePopupDialogs = () => { closePopupDialogs(win.document); };
    // }

    function onDialogClosed(_thiz: PopupDialog, el: HTMLOrSVGElement | null) {
        win.READIUM2.ignorekeyDownUpEvents = false;

        if (el) {
            focusScrollRaw(el, true, true, undefined);
        } else {
            ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable(val);
        }

        setTimeout(() => {
            pop.dialog.remove();
        }, 50);
    }
    const pop = new PopupDialog(element.ownerDocument as Document, htmltxt, onDialogClosed, TTS_POPUP_DIALOG_CLASS, false);
    pop.show(element);
}
