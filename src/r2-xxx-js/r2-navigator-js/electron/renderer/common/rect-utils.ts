// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export const VERBOSE = false;
const IS_DEV = VERBOSE &&
    (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
const LOG_PREFIX = "RECTs -- ";

const logRect = (rect: IRect) => {
    const LOG_PREFIX_LOCAL = "logRect ~~ ";

    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + `TOP:${rect.top} BOTTOM:${rect.bottom} LEFT:${rect.left} RIGHT:${rect.right} WIDTH:${rect.width} HEIGHT:${rect.height}`);
    }
};

// interface DOMRect extends DOMRectReadOnly {
//     height: number;
//     width: number;
//     x: number;
//     y: number;
// }
// interface ClientRect {
//     bottom: number;
//     readonly height: number;
//     left: number;
//     right: number;
//     top: number;
//     readonly width: number;
// }
export interface IRectSimple {
    height: number;
    left: number;
    top: number;
    width: number;
}
export interface IRect extends IRectSimple {
    bottom: number;
    right: number;
}

export function DOMRectListToArray(domRects: DOMRectList): IRect[] {
    const rects: IRect[] = [];
    for (const domRect of domRects) {
        rects.push({
            bottom: domRect.bottom,
            height: domRect.height,
            left: domRect.left,
            right: domRect.right,
            top: domRect.top,
            width: domRect.width,
        });
    }
    return rects;
}

export function getTextClientRects(range: Range, elementNamesToSkip?: string[]): IRect[] {
    // return range.getClientRects();

    const doc = range.commonAncestorContainer.ownerDocument;
    if (!doc) {
        return [];
    }

    const iter = doc.createNodeIterator(
        range.commonAncestorContainer,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node: Node) => { // Text -- node.nodeType === Node.TEXT_NODE
                if (node.nodeType === Node.TEXT_NODE && range.intersectsNode(node)) {
                    if (!elementNamesToSkip) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    const parentName = node.parentElement?.nodeName.toLowerCase();
                    if (!parentName || !elementNamesToSkip.includes(parentName)) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
                return NodeFilter.FILTER_REJECT;
            },
        },
    );

    const rects: IRect[] = [];

    while (iter.nextNode()) {
        const r = doc.createRange();
        if (iter.referenceNode.nodeValue && iter.referenceNode === range.startContainer) {
            r.setStart(iter.referenceNode, range.startOffset);

            r.setEnd(iter.referenceNode, iter.referenceNode === range.endContainer ? range.endOffset : iter.referenceNode.nodeValue.length);
        } else if (iter.referenceNode.nodeValue && iter.referenceNode === range.endContainer) {
            r.setStart(iter.referenceNode, 0);

            r.setEnd(iter.referenceNode, range.endOffset);
        } else {
            r.selectNode(iter.referenceNode);
        }


        if (r.collapsed) {
            continue;
        }

        const nodeRects = DOMRectListToArray(r.getClientRects());
        rects.push(...nodeRects);

        // const domRect = r.getBoundingClientRect();
        // rects.push({
        //     bottom: domRect.bottom,
        //     height: domRect.height,
        //     left: domRect.left,
        //     right: domRect.right,
        //     top: domRect.top,
        //     width: domRect.width,
        // });
    }

    // const nextNode = iter.nextNode();
    // if (!nextNode) {
    //     return [];
    // }
    // if (iter.referenceNode?.nodeType !== Node.TEXT_NODE) {
    //     return [];
    // }

    return rects;
}

export function getClientRectsNoOverlap(
    originalRects: IRect[], // not DOMRectList which has [i] and .length, but no iterator for of
    doNotMergeAlignedRects: boolean,
    vertical: boolean,
    expand?: number): IRect[] {
    const LOG_PREFIX_LOCAL = "getClientRectsNoOverlap ~~ ";

    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "original number of rects = " + originalRects.length);
    }

    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "expand = " + expand);
    }
    const ex = expand ? expand : 0;
    if (ex) {
        for (const rect of originalRects) {
            rect.left -= ex;
            rect.top -= ex;
            rect.right += ex;
            rect.bottom += ex;
            rect.width += (2 * ex);
            rect.height += (2 * ex);
        }
    }

    // horizontal boxes
    const rectsLandscapeAspectRatio = originalRects.filter((r) => {
        return r.width >= r.height;
    });
    // vertical boxes
    const rectsPortraitAspectRatio = originalRects.filter((r) => {
        return r.width < r.height;
    });

    // negative value, first less than second (r1 < r2)
    const sortFunc = (r1: IRect, r2: IRect) => {
        const areaR1 = r1.width * r1.height;
        const areaR2 = r2.width * r2.height;
        return areaR1 < areaR2 ? -1 : areaR1 === areaR2 ? 0 : 1;
    };

    // in-place sort
    rectsLandscapeAspectRatio.sort(sortFunc);
    rectsPortraitAspectRatio.sort(sortFunc);

    originalRects = vertical ? rectsPortraitAspectRatio.concat(rectsLandscapeAspectRatio) : rectsLandscapeAspectRatio.concat(rectsPortraitAspectRatio);

    const tolerance = 3;
    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "tolerance = " + tolerance);
    }

    const mergedRects = mergeTouchingRects(originalRects, tolerance, doNotMergeAlignedRects, vertical);
    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "after [mergeTouchingRects], number of rects = " + mergedRects.length);
    }

    const noContainedRects = removeContainedRects(mergedRects, tolerance, doNotMergeAlignedRects, vertical);
    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "after [removeContainedRects], number of rects = " + noContainedRects.length);
    }

    const newRects = replaceOverlapingRects(noContainedRects, doNotMergeAlignedRects, vertical);
    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "after [replaceOverlapingRects], number of rects = " + newRects.length);
    }

    const minArea = 2 * 2;
    for (let j = newRects.length - 1; j >= 0; j--) {
        const rect = newRects[j];
        let bigEnough = (rect.width * rect.height) > minArea;
        if (bigEnough && ex && (rect.width <= ex || rect.height <= ex)) {
            bigEnough = false;
        }
        if (!bigEnough) {
            if (newRects.length > 1) {
                if (IS_DEV) {
                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "removed small");
                }
                newRects.splice(j, 1);
            } else { // newRects.length === 1
                if (IS_DEV) {
                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "removed all smalls, but must keep last small one otherwise array empty!");
                }
                break;
            }
        }
    }

    if (IS_DEV) {
        checkOverlaps(newRects);
    }

    if (IS_DEV) {
        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + `total reduction ${originalRects.length} --> ${newRects.length}`);
        for (const r of newRects) {
            logRect(r);
        }
    }
    return newRects;
}

// https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/lib/rect-helpers.js
// https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/lib/tappable-rects.js
function almostEqual(a: number, b: number, tolerance: number) {
    return Math.abs(a - b) <= tolerance;
}

export function rectIntersect(rect1: IRect, rect2: IRect): IRect {
    const maxLeft = Math.max(rect1.left, rect2.left);
    const minRight = Math.min(rect1.right, rect2.right);
    const maxTop = Math.max(rect1.top, rect2.top);
    const minBottom = Math.min(rect1.bottom, rect2.bottom);
    const rect: IRect = {
        bottom: minBottom,
        height: Math.max(0, minBottom - maxTop),
        left: maxLeft,
        right: minRight,
        top: maxTop,
        width: Math.max(0, minRight - maxLeft),
    };
    return rect;
}

// rect1 - rect2
export function rectSubtract(rect1: IRect, rect2: IRect): IRect[] {

    const rectIntersected = rectIntersect(rect2, rect1);
    if (rectIntersected.height === 0 || rectIntersected.width === 0) {
    // if (rectIntersected.left >= rectIntersected.right || rectIntersected.top >= rectIntersected.bottom) {
        return [rect1];
    }

    const rects: IRect[] = [];

    {
        // left strip
        const rectA: IRect = {
            bottom: rect1.bottom,
            height: 0,
            left: rect1.left,
            right: rectIntersected.left,
            top: rect1.top,
            width: 0,
        };
        rectA.width = rectA.right - rectA.left;
        rectA.height = rectA.bottom - rectA.top;
        if (rectA.height !== 0 && rectA.width !== 0) {
        // if (rectA.left < rectA.right && rectA.top < rectA.bottom) {
            rects.push(rectA);
        }
    }

    {
        // inside strip
        const rectB: IRect = {
            bottom: rectIntersected.top,
            height: 0,
            left: rectIntersected.left,
            right: rectIntersected.right,
            top: rect1.top,
            width: 0,
        };
        rectB.width = rectB.right - rectB.left;
        rectB.height = rectB.bottom - rectB.top;
        if (rectB.height !== 0 && rectB.width !== 0) {
        // if (rectB.left < rectB.right && rectB.top < rectB.bottom) {
            rects.push(rectB);
        }
    }

    {
        // inside strip
        const rectC: IRect = {
            bottom: rect1.bottom,
            height: 0,
            left: rectIntersected.left,
            right: rectIntersected.right,
            top: rectIntersected.bottom,
            width: 0,
        };
        rectC.width = rectC.right - rectC.left;
        rectC.height = rectC.bottom - rectC.top;
        if (rectC.height !== 0 && rectC.width !== 0) {
        // if (rectC.left < rectC.right && rectC.top < rectC.bottom) {
            rects.push(rectC);
        }
    }

    {
        // right strip
        const rectD: IRect = {
            bottom: rect1.bottom,
            height: 0,
            left: rectIntersected.right,
            right: rect1.right,
            top: rect1.top,
            width: 0,
        };
        rectD.width = rectD.right - rectD.left;
        rectD.height = rectD.bottom - rectD.top;
        if (rectD.height !== 0 && rectD.width !== 0) {
        // if (rectD.left < rectD.right && rectD.top < rectD.bottom) {
            rects.push(rectD);
        }
    }

    return rects;
}

export function rectSame(rect1: IRect, rect2: IRect, tolerance: number) {
    return almostEqual(rect1.left, rect2.left, tolerance) &&
        almostEqual(rect1.right, rect2.right, tolerance) &&
        almostEqual(rect1.top, rect2.top, tolerance) &&
        almostEqual(rect1.bottom, rect2.bottom, tolerance); // width and height implied correct
}

export function rectContainsPoint(rect: IRect, x: number, y: number, tolerance: number) {
    return (rect.left < x || almostEqual(rect.left, x, tolerance)) &&
        (rect.right > x || almostEqual(rect.right, x, tolerance)) &&
        (rect.top < y || almostEqual(rect.top, y, tolerance)) &&
        (rect.bottom > y || almostEqual(rect.bottom, y, tolerance));
}

export function rectContains(rect1: IRect, rect2: IRect, tolerance: number) {
    return (
        rectContainsPoint(rect1, rect2.left, rect2.top, tolerance) && // top left corner
        rectContainsPoint(rect1, rect2.right, rect2.top, tolerance) && // top right corner
        rectContainsPoint(rect1, rect2.left, rect2.bottom, tolerance) && // bottom left corner
        rectContainsPoint(rect1, rect2.right, rect2.bottom, tolerance) // bottom right corner
    );
}

export function getBoundingRect(rect1: IRect, rect2: IRect): IRect {
    const left = Math.min(rect1.left, rect2.left);
    const right = Math.max(rect1.right, rect2.right);
    const top = Math.min(rect1.top, rect2.top);
    const bottom = Math.max(rect1.bottom, rect2.bottom);
    return {
        bottom,
        height: bottom - top,
        left,
        right,
        top,
        width: right - left,
    };
}

export function rectsTouchOrOverlap(rect1: IRect, rect2: IRect, tolerance: number) {
    return (
        (rect1.left < rect2.right || (tolerance >= 0 && almostEqual(rect1.left, rect2.right, tolerance))) &&
        (rect2.left < rect1.right || (tolerance >= 0 && almostEqual(rect2.left, rect1.right, tolerance))) &&
        (rect1.top < rect2.bottom || (tolerance >= 0 && almostEqual(rect1.top, rect2.bottom, tolerance))) &&
        (rect2.top < rect1.bottom || (tolerance >= 0 && almostEqual(rect2.top, rect1.bottom, tolerance)))
    );
}

export function mergeTouchingRects(rects: IRect[], tolerance: number, doNotMergeAlignedRects: boolean, vertical: boolean): IRect[] {
    const LOG_PREFIX_LOCAL = "mergeTouchingRects ~~ ";

    for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
            const rect1 = rects[i];
            const rect2 = rects[j];
            if (rect1 === rect2) {
                if (IS_DEV) {
                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "rect1 === rect2 ??!");
                }
                continue;
            }

            // horizontally-stacked lines of characters in vertical flowing text
            // |=================||======================|
            // |        1        ||           2          |
            // |=================||======================|
            const rectsLineUpVertically =
                almostEqual(rect1.top, rect2.top, tolerance) &&
                almostEqual(rect1.bottom, rect2.bottom, tolerance);
            const mergeAllowedForVerticallyLinedUpRects = !doNotMergeAlignedRects || !vertical;

            // vertically-stacked lines of characters in horizontal flowing text
            // |=================|
            // |        1        |
            // |=================|
            // |=================|
            // |                 |
            // |        2        |
            // |                 |
            // |=================|
            const rectsLineUpHorizontally =
                almostEqual(rect1.left, rect2.left, tolerance) &&
                almostEqual(rect1.right, rect2.right, tolerance);
            const mergeAllowedForHorizontallyLinedUpRects = !doNotMergeAlignedRects || vertical;

            const doMerge =
                // do not merge same rects (other containment operation elsewhere)
                (
                (rectsLineUpVertically && !rectsLineUpHorizontally)
                ||
                (!rectsLineUpVertically && rectsLineUpHorizontally)
                )
                &&
                (
                (rectsLineUpHorizontally && mergeAllowedForHorizontallyLinedUpRects)
                ||
                (rectsLineUpVertically && mergeAllowedForVerticallyLinedUpRects)
                )
                &&
                rectsTouchOrOverlap(rect1, rect2, tolerance);

            if (doMerge) {
                const newRects = rects.filter((rect) => {
                    return rect !== rect1 && rect !== rect2;
                });
                const boundingRect = getBoundingRect(rect1, rect2);
                newRects.push(boundingRect);

                if (IS_DEV) {
                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + `merged ${rects.length} ==> ${newRects.length}, VERTICAL ALIGN: ${rectsLineUpVertically} HORIZONTAL ALIGN: ${rectsLineUpHorizontally} (DO NOT MERGE: ${doNotMergeAlignedRects}, VERTICAL: ${vertical}) `);
                    logRect(rect1);
                    console.log("+");
                    logRect(rect2);
                    console.log("=");
                    logRect(boundingRect);
                }
                return mergeTouchingRects(newRects, tolerance, doNotMergeAlignedRects, vertical);
            }
        }
    }

    return rects;
}

export function replaceOverlapingRects(rects: IRect[], doNotMergeAlignedRects: boolean, vertical: boolean): IRect[] {
    const LOG_PREFIX_LOCAL = "replaceOverlapingRects ~~ ";

    if (doNotMergeAlignedRects) {
        return rects;
    }

    for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
            const rect1 = rects[i];
            const rect2 = rects[j];
            if (rect1 === rect2) {
                if (IS_DEV) {
                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "rect1 === rect2 ??!");
                }
                continue;
            }

            if (!rectsTouchOrOverlap(rect1, rect2, -1)) { // negative tolerance for strict overlap test
                continue;
            }

            // horizontally-stacked lines of characters in vertical flowing text
            // |=================||======================|
            // |        1        ||           2          |
            // |=================||======================|
            // const rectsLineUpVertically =
            //     almostEqual(possiblyContainingRect.top, rect.top, tolerance) &&
            //     almostEqual(possiblyContainingRect.bottom, rect.bottom, tolerance);
            // const mergeAllowedForVerticallyLinedUpRects = !doNotMergeAlignedRects || !vertical;

            // vertically-stacked lines of characters in horizontal flowing text
            // |=================|
            // |        1        |
            // |=================|
            // |=================|
            // |                 |
            // |        2        |
            // |                 |
            // |=================|
            // const rectsLineUpHorizontally =
            //     almostEqual(possiblyContainingRect.left, rect.left, tolerance) &&
            //     almostEqual(possiblyContainingRect.right, rect.right, tolerance);
            // const mergeAllowedForHorizontallyLinedUpRects = !doNotMergeAlignedRects || vertical;

            let toAdd: IRect[] = [];
            let toRemove: IRect;
            let toPreserve: IRect;

            let n = 0;

            // rect1 - rect2
            const subtractRects1 = rectSubtract(rect1, rect2); // discard #1, keep #2, add returned rects
            if (subtractRects1.length === 1) {
                n = 1;
                toAdd = subtractRects1;
                toRemove = rect1;
                toPreserve = rect2;
            } else {
                // rect2 - rect1
                const subtractRects2 = rectSubtract(rect2, rect1); // discard #2, keep #1, add returned rects
                if (subtractRects1.length < subtractRects2.length) {
                    n = 2;
                    toAdd = subtractRects1;
                    toRemove = rect1;
                    toPreserve = rect2;
                } else {
                    n = 3;
                    toAdd = subtractRects2;
                    toRemove = rect2;
                    toPreserve = rect1;
                }
            }

            if (IS_DEV) {
                console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + `overlap ${n} ADD: ${toAdd.length}`);
                for (const r of toAdd) {
                    logRect(r);
                }
                console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + `overlap ${n} REMOVE:`);
                logRect(toRemove);
                console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + `overlap ${n} KEEP:`);
                logRect(toPreserve);
            }

            if (IS_DEV) {
                const toCheck = [];
                toCheck.push(toPreserve);
                toCheck.push(...toAdd);
                checkOverlaps(toCheck);
            }

            const newRects = rects.filter((rect) => {
                return rect !== toRemove;
            });
            newRects.push(...toAdd);

            if (IS_DEV) {
                console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + `overlap removed: ${rects.length} ==> ${newRects.length}`);
            }

            return replaceOverlapingRects(newRects, doNotMergeAlignedRects, vertical);
        }
    }

    return rects;
}

export function getRectOverlapX(rect1: IRect, rect2: IRect) {
    return Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
}

export function getRectOverlapY(rect1: IRect, rect2: IRect) {
    return Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
}

export function removeContainedRects(rects: IRect[], tolerance: number, doNotMergeAlignedRects: boolean, vertical: boolean): IRect[] {
    const LOG_PREFIX_LOCAL = "removeContainedRects ~~ ";

    const rectsToKeep = new Set(rects);

    for (const rect of rects) {
        const bigEnough = rect.width > 1 && rect.height > 1;
        if (!bigEnough) {
            if (IS_DEV) {
                console.log(LOG_PREFIX + "removed tiny:");
                logRect(rect);
            }
            rectsToKeep.delete(rect);
            continue;
        }
        for (const possiblyContainingRect of rects) {
            if (rect === possiblyContainingRect) {
                continue;
            }
            if (!rectsToKeep.has(possiblyContainingRect) || !rectsToKeep.has(rect)) {
                continue;
            }
            if (!rectContains(possiblyContainingRect, rect, tolerance)) {
                continue;
            }

            if (doNotMergeAlignedRects) {

                // horizontally-stacked lines of characters in vertical flowing text
                // |=================||======================|
                // |        1        ||           2          |
                // |=================||======================|
                const rectsLineUpVertically =
                    almostEqual(possiblyContainingRect.top, rect.top, tolerance) &&
                    almostEqual(possiblyContainingRect.bottom, rect.bottom, tolerance);
                // const mergeAllowedForVerticallyLinedUpRects = !doNotMergeAlignedRects || !vertical;

                // vertically-stacked lines of characters in horizontal flowing text
                // |=================|
                // |        1        |
                // |=================|
                // |=================|
                // |                 |
                // |        2        |
                // |                 |
                // |=================|
                const rectsLineUpHorizontally =
                    almostEqual(possiblyContainingRect.left, rect.left, tolerance) &&
                    almostEqual(possiblyContainingRect.right, rect.right, tolerance);
                // const mergeAllowedForHorizontallyLinedUpRects = !doNotMergeAlignedRects || vertical;

                if (rectsLineUpVertically && rectsLineUpHorizontally) {
                    // if same rects, definitely eliminate one
                    if (IS_DEV) {
                        console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "[identical] removed container (keep contained):");
                        logRect(possiblyContainingRect);
                        logRect(rect);
                    }
                    rectsToKeep.delete(possiblyContainingRect);
                    // break;
                    continue;
                } else if (rectsLineUpVertically || rectsLineUpHorizontally) {
                    if (rectsLineUpVertically && !vertical || rectsLineUpHorizontally && vertical) {
                        if (IS_DEV) {
                            console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "[aligned] removed contained (keep container):");
                            logRect(rect);
                            logRect(possiblyContainingRect);
                        }
                        rectsToKeep.delete(rect);
                        // break;
                        continue;
                    }

                    continue;
                }
            } else {
                if (IS_DEV) {
                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "[merge yes] removed contained (keep container):");
                    logRect(rect);
                    logRect(possiblyContainingRect);
                }
                rectsToKeep.delete(rect);
            }
            // break;
            continue;
        }
    }

    return Array.from(rectsToKeep);
}

export function checkOverlaps(rects: IRect[]) {
    const LOG_PREFIX_LOCAL = "checkOverlaps ~~ ";

    const stillOverlapingRects: IRect[] = [];

    for (const rect1 of rects) {
        for (const rect2 of rects) {
            if (rect1 === rect2) {
                continue;
            }

            const has1 = stillOverlapingRects.includes(rect1);
            const has2 = stillOverlapingRects.includes(rect2);
            if (!has1 || !has2) {
                if (rectsTouchOrOverlap(rect1, rect2, -1)) { // negative tolerance for strict overlap test

                    if (!has1) {
                        stillOverlapingRects.push(rect1);
                    }
                    if (!has2) {
                        stillOverlapingRects.push(rect2);
                    }

                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "RECT 1:");
                    logRect(rect1);

                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + "RECT 2:");
                    logRect(rect2);

                    const xOverlap = getRectOverlapX(rect1, rect2);
                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + `X overlap: ${xOverlap}`);

                    const yOverlap = getRectOverlapY(rect1, rect2);
                    console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + `Y overlap: ${yOverlap}`);
                }
            }
        }
    }

    if (stillOverlapingRects.length) {
        if (IS_DEV) {
            console.log(LOG_PREFIX + LOG_PREFIX_LOCAL + `still overlaping = ${stillOverlapingRects.length}`);
        }
    }
}

// https://github.com/edg2s/rangefix/blob/master/rangefix.js
// function checkRangeFix(documant: Document) {

//     const p = documant.createElement("p");
//     const span = documant.createElement("span");
//     const t1 = documant.createTextNode("aa");
//     const t2 = documant.createTextNode("aa");
//     const img = documant.createElement("img");
//     img.setAttribute("src", "#null");
//     p.appendChild(t1);
//     p.appendChild(span);
//     span.appendChild(img);
//     span.appendChild(t2);
//     documant.body.appendChild( p );

//     const range = new Range(); // documant.createRange();
//     range.setStart(t1, 1);
//     range.setEnd(span, 0);

//     let getBoundingClientRect = range.getClientRects().length > 1;
//     let getClientRects = getBoundingClientRect;
//     console.log(LOG_PREFIX + "BUG 1: " + getClientRects);

//     if (!getClientRects) {
//         range.setEnd(t2, 1);
//         getBoundingClientRect = range.getClientRects().length === 2;
//         getClientRects = getBoundingClientRect;
//         console.log(LOG_PREFIX + "BUG 2: " + getClientRects);
//     }

//     if (!getBoundingClientRect) {
//         // Safari doesn't return a valid bounding rect for collapsed ranges
//         // Equivalent to range.collapse( true ) which isn't well supported
//         range.setEnd(range.startContainer, range.startOffset);
//         const boundingRect = range.getBoundingClientRect();
//         getBoundingClientRect = boundingRect.top === 0 && boundingRect.left === 0;
//         console.log(LOG_PREFIX + "BUG 3: " + getBoundingClientRect);
//     }

//     documant.body.removeChild(p);
// }

// function getClientRectsFix(range: Range): ClientRect[] | DOMRect[] {

//     const rects: ClientRect[] | DOMRect[] = [];

//     let endContainer: Node | null = range.endContainer;
//     let endOffset: number = range.endOffset;
//     let partialRange = new Range();

//     while (endContainer && endContainer !== range.commonAncestorContainer) {
//         partialRange.setStart(endContainer, 0);
//         partialRange.setEnd(endContainer, endOffset);

//         Array.prototype.push.apply(rects, partialRange.getClientRects());

//         const parentNode: Node | null = endContainer.parentNode;
//         if (parentNode) {
//             endOffset = Array.prototype.indexOf.call(parentNode.childNodes, endContainer);
//         }
//         endContainer = parentNode;
//     }

//     if (endContainer) {
//         partialRange = range.cloneRange();
//         partialRange.setEnd(endContainer, endOffset);
//         Array.prototype.push.apply(rects, partialRange.getClientRects());
//     }

//     return rects;
// }

// function getBoundingClientRectFix(range: Range): ClientRect | DOMRect | undefined {

//     const rects = getClientRectsFix(range);
//     if (rects.length === 0) {
//         return undefined;
//     }

//     const nativeBoundingRect = range.getBoundingClientRect();
//     if (nativeBoundingRect.width === 0 && nativeBoundingRect.height === 0) {
//         return rects[0];
//     }

//     let boundingRect: ClientRect | undefined;

//     for (const rect of rects) {
//         if (!boundingRect) {
//             boundingRect = {
//                 bottom: rect.bottom,
//                 height: rect.bottom - rect.top,
//                 left: rect.left,
//                 right: rect.right,
//                 top: rect.top,
//                 width: rect.right - rect.left,
//             };
//         } else {
//             boundingRect.left = Math.min(boundingRect.left, rect.left);
//             boundingRect.top = Math.min(boundingRect.top, rect.top);
//             boundingRect.right = Math.max(boundingRect.right, rect.right);
//             boundingRect.bottom = Math.max(boundingRect.bottom, rect.bottom);
//             (boundingRect as any).width = boundingRect.right - boundingRect.left;
//             (boundingRect as any).height = boundingRect.bottom - boundingRect.top;
//         }
//     }

//     return boundingRect;
// }
