// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as tabbable from "tabbable";
import { ipcRenderer } from "electron";

import { R2_EVENT_MEDIA_OVERLAY_INTERRUPT } from "../../common/events";

import { FOOTNOTES_CONTAINER_CLASS, POPUP_DIALOG_CLASS } from "../../common/styles";

// HTMLDialogElement deprecated in TypeScript DOM type definitions!
export interface IHTMLDialogElementWithPopup extends HTMLDialogElement {
    popDialog: PopupDialog | undefined;
    // close: () => void;
    // showModal: () => void;
}

export function isPopupDialogOpen(documant: Document): boolean {
    return documant.documentElement &&
        documant.documentElement.classList.contains(POPUP_DIALOG_CLASS);
}

export function closePopupDialogs(documant: Document) {
    console.log("...DIALOG close all");

    const dialogs = documant.querySelectorAll(`dialog.${POPUP_DIALOG_CLASS}`);
    dialogs.forEach((dialog) => {
        const dia = dialog as IHTMLDialogElementWithPopup;
        if (dia.popDialog) {
            dia.popDialog.cancelRefocus();
        }
        if (dia.hasAttribute("open") || dia.open) {
            dia.close();
        }
        setTimeout(() => {
            dia.remove();
        }, 50);
    });
}

export function isElementInsidePopupDialog(el: Element): boolean {

    let currentElement = el;

    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
        if (currentElement.tagName && currentElement.classList &&
            currentElement.tagName.toLowerCase() === "dialog" &&
            currentElement.classList.contains(POPUP_DIALOG_CLASS)) {
            return true;
        }
        currentElement = currentElement.parentNode as Element;
    }

    return false;
}

function getFocusables(rootElement: Element): HTMLOrSVGElement[] {
    // const FOCUSABLE_ELEMENTS = [
    //     "a[href]:not([tabindex^=\"-\"]):not([inert])",
    //     "area[href]:not([tabindex^=\"-\"]):not([inert])",
    //     "input:not([disabled]):not([inert])",
    //     "select:not([disabled]):not([inert])",
    //     "textarea:not([disabled]):not([inert])",
    //     "button:not([disabled]):not([inert])",
    //     "iframe:not([tabindex^=\"-\"]):not([inert])",
    //     "audio:not([tabindex^=\"-\"]):not([inert])",
    //     "video:not([tabindex^=\"-\"]):not([inert])",
    //     "[contenteditable]:not([tabindex^=\"-\"]):not([inert])",
    //     "[tabindex]:not([tabindex^=\"-\"]):not([inert])",
    // ];

    // const focusables: HTMLOrSVGElement[] = [];
    // const focusableElements = rootElement.querySelectorAll(FOCUSABLE_ELEMENTS.join(","));
    // focusableElements.forEach((focusableElement) => {

    //     if ((focusableElement as HTMLElement).offsetWidth ||
    //         (focusableElement as HTMLElement).offsetHeight ||
    //         focusableElement.getClientRects().length) {

    //         focusables.push((focusableElement as unknown) as HTMLOrSVGElement); // weird TypeScript!
    //     }
    // });
    // return focusables;

    const tabbables = tabbable.tabbable(rootElement);
    return tabbables;
}
function focusInside(rootElement: Element) {
    const toFocus = rootElement.querySelector("[autofocus]") || getFocusables(rootElement)[0];
    if (toFocus) {
        (toFocus as HTMLOrSVGElement).focus();
    }
}

// interface IEventMap { [key: string]: Array<() => void>; }

let _focusedBeforeDialog: HTMLOrSVGElement | null;

function onKeyUp(this: PopupDialog, ev: KeyboardEvent) {
    // if (!this.shown) {
    //     return;
    // }

    const ESCAPE_KEY = 27;
    if (ev.which === ESCAPE_KEY) {
        if (this.role !== "alertdialog") {
            console.log("...DIALOG ESCAPE ...");
            ev.preventDefault();
            if (this.dialog.hasAttribute("open") || this.dialog.open) {
                this.dialog.close();
            }
            return;
        }
    }
}

function onKeyDown(this: PopupDialog, ev: KeyboardEvent) {
    if (this.doNotTrapKeyboardFocusTabIndexCycling) {
        return;
    }

    const TAB_KEY = 9;
    if (ev.which === TAB_KEY) {

        // if (ev.shiftKey && _focusedBeforeDialog) {
        //     this.focusScroll(_focusedBeforeDialog, false);
        // }

        const focusables = getFocusables(this.dialog);

        const focusedItemIndex = this.documant.activeElement ?
            focusables.indexOf((this.documant.activeElement as unknown) as HTMLOrSVGElement) : // weird TypeScript!
            -1;

        const isLast = focusedItemIndex === focusables.length - 1;
        const isFirst = focusedItemIndex === 0;

        let toFocus: HTMLOrSVGElement | undefined;

        if (ev.shiftKey && isFirst) {
            toFocus = focusables[focusables.length - 1];
        } else if (!ev.shiftKey && isLast) {
            toFocus = focusables[0];
        }

        if (toFocus) {
            ev.preventDefault();
            toFocus.focus();
        }
    }
}

// function onFocus(this: PopupDialog, ev: Event) {
//     // if (!this.shown) {
//     //     return;
//     // }

//     if (!this.dialog.contains(ev.target as Node)) {
//         ev.preventDefault();
//         focusInside(this.dialog);
//     }
// }

export interface IClickXY {
    clickX: number;
    clickY: number;
}

export class PopupDialog {

    public readonly role: string;
    public readonly dialog: IHTMLDialogElementWithPopup;
    public readonly doNotTrapKeyboardFocusTabIndexCycling: boolean;

    public readonly clickCloseXY: IClickXY = {
        clickX: -1,
        clickY: -1,
    };

    private readonly _onKeyUp: () => void;
    private readonly _onKeyDown: () => void;
    // private readonly _onFocus: () => void;

    // private shown: boolean;
    // private listeners: IEventMap;

    constructor(
        public readonly documant: Document,
        outerHTML: string,
        // id: string,
        public readonly onDialogClosed: (thiz: PopupDialog, el: HTMLOrSVGElement | null) => void,
        optionalCssClass?: string,
        doNotTrapKeyboardFocusTabIndexCycling?: boolean) {

        closePopupDialogs(documant);

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const that = this;

        this._onKeyUp = onKeyUp.bind(this);
        this._onKeyDown = onKeyDown.bind(this);
        // this._onFocus = onFocus.bind(this);

        this.doNotTrapKeyboardFocusTabIndexCycling = doNotTrapKeyboardFocusTabIndexCycling ? true : false;

        this.dialog = documant.createElement("dialog") as IHTMLDialogElementWithPopup;
        this.dialog.popDialog = this;

        this.dialog.setAttribute("class", POPUP_DIALOG_CLASS
            + (optionalCssClass ? ` ${optionalCssClass}` : ""));
        this.dialog.setAttribute("id", POPUP_DIALOG_CLASS);
        this.dialog.setAttribute("dir", "ltr");

        // const button = documant.createElement("button");
        // button.setAttribute("aria-label", "close");
        // button.setAttribute("class", FOOTNOTES_CLOSE_BUTTON_CLASS);
        // const txtClose = documant.createTextNode("X");
        // button.appendChild(txtClose);
        // button.addEventListener("click", (_ev: Event) => {
        // if (that.dialog.hasAttribute("open") || that.dialog.open) {
        //     that.dialog.close();
        // }
        // });
        // this.dialog.appendChild(button);

        const namespaces = Array.from(documant.documentElement.attributes).reduce((pv, cv) => {
            if (cv.name.startsWith("xmlns:")) {
                return `${pv} ${cv.name}="${cv.value}"`;
            } else {
                return `${pv}`;
            }
        }, "");

        let toInsert = outerHTML.replace(/>/, ` ${namespaces} >`);
        try {
            this.dialog.insertAdjacentHTML("beforeend", toInsert);
        } catch (err) {
            console.log(err);
            console.log("outerHTML", outerHTML);
            console.log("toInsert", toInsert);

            Array.from(documant.getElementsByTagName("parsererror")).forEach((pe) => {
                if (pe.parentNode) {
                    pe.parentNode.removeChild(pe);
                }
            });

            const parseFullHTML = false;
            try {
                if (parseFullHTML) {
                    toInsert = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" ${namespaces} ><body>${outerHTML}</body></html>`;
                } else {
                    // toInsert = outerHTML.replace(/>/, ` ${namespaces} >`);
                }

                const domparser = new DOMParser()​​;
                const xmlDoc = domparser.parseFromString(
                    toInsert,
                    "application/xhtml+xml");
                const xmlSerializer = new XMLSerializer();
                const xmlStr = xmlSerializer.serializeToString(xmlDoc);
                if (xmlStr.indexOf("parsererror") > 0) {
                    console.log("parsererror", xmlStr);

                    this.dialog.insertAdjacentHTML("beforeend",
                        // tslint:disable-next-line:max-line-length
                        `<pre class="${FOOTNOTES_CONTAINER_CLASS}" stylexx="overflow-y: scroll; position: absolute; top: 0px; right: 0px; left: 0px; bottom: 0px; margin: 0px; padding: 0px;">${outerHTML.replace(/>/g, "&gt;").replace(/</g, "&lt;")}</pre>`);
                } else {
                    const el = parseFullHTML ?
                        // tslint:disable-next-line:max-line-length
                        (xmlDoc.documentElement.firstElementChild as Element).firstElementChild as Element :
                        xmlDoc.documentElement;

                    // const removeXmlStuff = (e: Element) => {
                    //     if (e.parentNode && e.namespaceURI && e.namespaceURI !== "http://www.w3.org/1999/xhtml") {
                    //         e.parentNode.removeChild(e);
                    //         return;
                    //     }
                    //     Array.from(e.attributes).filter((attr) => {
                    //         return attr.namespaceURI && attr.namespaceURI !== "http://www.w3.org/1999/xhtml";
                    //     }).forEach((attr) => {
                    //         if (attr.ownerElement) {
                    //             attr.ownerElement.removeAttributeNode(attr);
                    //         }
                    //     });

                    //     if (!e.childNodes || e.childNodes.length === 0) {
                    //         return;
                    //     }
                    //     // nodelist copy (mutable children)
                    //     Array.from(e.childNodes).filter((n) => {
                    //         return n.nodeType === 1; // Node.ELEMENT_NODE
                    //     }).forEach((elem) => {
                    //         removeXmlStuff(elem as Element);
                    //     });
                    //     // tslint:disable-next-line: prefer-for-of
                    //     // for (let i = 0; i < e.childNodes.length; i++) {
                    //     //     const childNode = e.childNodes[i];
                    //     //     if (childNode.nodeType === 1) { // Node.ELEMENT_NODE
                    //     //         removeXmlStuff(childNode as Element);
                    //     //     }
                    //     // }
                    // };
                    // removeXmlStuff(el); // yep, otherwise Chromium triggers and displays errors!

                    toInsert = xmlSerializer.serializeToString(el);
                    console.log("toInsert", toInsert);

                    this.dialog.insertAdjacentHTML("beforeend", toInsert);
                    // this.dialog.insertAdjacentElement("beforeend", el);
                    // this.dialog.appendChild(el);
                }
            } catch (err) {
                console.log(err);
                console.log("outerHTML", outerHTML);
                console.log("toInsert", toInsert);

                Array.from(documant.getElementsByTagName("parsererror")).forEach((pe) => {
                    if (pe.parentNode) {
                        pe.parentNode.removeChild(pe);
                    }
                });

                try {
                    this.dialog.innerHTML = toInsert;
                    // this.dialog.insertAdjacentHTML("afterbegin", toInsert);
                } catch (err) {
                    console.log(err);
                    console.log("outerHTML", outerHTML);
                    console.log("toInsert", toInsert);

                    Array.from(documant.getElementsByTagName("parsererror")).forEach((pe) => {
                        if (pe.parentNode) {
                            pe.parentNode.removeChild(pe);
                        }
                    });

                    try {
                        this.dialog.insertAdjacentHTML("beforeend", `<pre>${outerHTML}</pre>`);
                    } catch (err) {
                        console.log(err);
                        console.log("outerHTML", outerHTML);
                        console.log("toInsert", toInsert);
                    }
                }
            }
        }

        // const input = documant.createElement("input");
        // input.setAttribute("type", "text");
        // this.dialog.appendChild(input);

        // const butt = documant.createElement("button");
        // butt.appendChild(documant.createTextNode("TEST FOCUS CYCLE"));
        // this.dialog.appendChild(butt);

        // const buttx = documant.createElement("a");
        // buttx.setAttribute("href", "http://domain.org");
        // buttx.appendChild(documant.createTextNode("TEST OTHER"));
        // this.dialog.appendChild(buttx);

        documant.body.appendChild(this.dialog);
        // debug(this.dialog.outerHTML);

        this.dialog.addEventListener("click", (ev) => {
            if (ev.target !== that.dialog) {
                return;
            }
            const rect = that.dialog.getBoundingClientRect();
            const inside = rect.top <= ev.clientY &&
                ev.clientY <= rect.top + rect.height &&
                rect.left <= ev.clientX &&
                ev.clientX <= rect.left + rect.width;
            if (!inside) {
                if (that.dialog.hasAttribute("open") || that.dialog.open) {
                    console.log("...DIALOG CLICK event => close()");
                    that.clickCloseXY.clickX = ev.clientX;
                    that.clickCloseXY.clickY = ev.clientY;
                    that.dialog.close();
                }
            }
        });

        this.dialog.addEventListener("close", (_ev) => {
            console.log("...DIALOG CLOSE event => hide()");
            that.hide();
        });

        this.dialog.addEventListener("open", (_ev) => {
            this.clickCloseXY.clickX = -1;
            this.clickCloseXY.clickY = -1;
        });

        this.documant = this.dialog.ownerDocument as Document;

        this.role = this.dialog.getAttribute("role") || "dialog";

        // this.shown = this.dialog.hasAttribute("open");

        // this.listeners = {};
    }

    // public on(type: string, handler: () => void) {
    //     if (!this.listeners[type]) {
    //         this.listeners[type] = [];
    //     }

    //     this.listeners[type].push(handler);

    //     return this;
    // }

    // public off(type: string, handler: () => void) {
    //     const index = this.listeners[type].indexOf(handler);
    //     if (index >= 0) {
    //         this.listeners[type].splice(index, 1);
    //     }
    //     return this;
    // }

    public show(toRefocus: Element | undefined) {
        console.log("...DIALOG show()");
        this.clickCloseXY.clickX = -1;
        this.clickCloseXY.clickY = -1;

        // if (this.shown) {
        //     return;
        // }
        // this.shown = true;

        // mediaOverlaysInterrupt();
        // const payload: IEventPayload_R2_EVENT_MEDIA_OVERLAY_INTERRUPT = {
        // };
        ipcRenderer.sendToHost(R2_EVENT_MEDIA_OVERLAY_INTERRUPT);

        const el = this.documant.documentElement;
        el.classList.add(POPUP_DIALOG_CLASS);

        if (this.dialog.hasAttribute("open")) {
            return;
        }
        console.log("...DIALOG show() 2");

        _focusedBeforeDialog = toRefocus ?
            toRefocus as HTMLElement :
            (this.documant.activeElement as unknown) as HTMLOrSVGElement; // weird TypeScript

        this.dialog.showModal();

        focusInside(this.dialog);

        // this.documant.body.addEventListener("focus", this._onFocus, true);
        this.documant.body.addEventListener("keyup", this._onKeyUp, true);
        this.documant.body.addEventListener("keydown", this._onKeyDown, true);

        // this.fire("show");
    }

    public cancelRefocus() {
        _focusedBeforeDialog = null;
    }

    public hide() {
        console.log("...DIALOG hide()");

        // if (!this.shown) {
        //     return;
        // }
        // this.shown = false;

        const el = this.documant.documentElement;
        el.classList.remove(POPUP_DIALOG_CLASS);

        // this.documant.body.removeEventListener("focus", this._onFocus, true);
        this.documant.body.removeEventListener("keyup", this._onKeyUp, true);
        this.documant.body.removeEventListener("keydown", this._onKeyDown, true);

        this.onDialogClosed(this, _focusedBeforeDialog);
        _focusedBeforeDialog = null;

        // let the above occur even if not open!
        if (this.dialog.hasAttribute("open") || this.dialog.open) {
            console.log("...DIALOG hide().close()");
            this.dialog.close();
        }

        // this.fire("hide");
    }

    // public destroy() {
    //     this.hide();

    //     // this.fire("destroy");

    //     // this.listeners = {};
    // }

    // private fire(type: string) {
    //     if (!this.listeners[type]) {
    //         return;
    //     }
    //     this.listeners[type].forEach((listener) => {
    //         listener();
    //     });
    // }
}
