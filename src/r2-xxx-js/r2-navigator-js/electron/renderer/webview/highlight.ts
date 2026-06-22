// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as crypto from "crypto";
import debounce from "debounce";
import { ipcRenderer } from "electron";

import {
    IEventPayload_R2_EVENT_HIGHLIGHT_CLICK, R2_EVENT_HIGHLIGHT_CLICK,
} from "../../common/events";
import {
    HighlightDrawTypeStrikethrough, HighlightDrawTypeUnderline, HighlightDrawTypeOutline, IColor, IHighlight,
    IHighlightDefinition,
    HighlightDrawTypeBackground,
    HighlightDrawTypeOpacityMask,
    HighlightDrawTypeOpacityMaskRuler,
    HighlightDrawTypeMarginBookmark,
    ITextPopup,
} from "../../common/highlight";
import { appendCSSInline, isPaginated } from "../../common/readium-css-inject";
import { ISelectionInfo } from "../../common/selection";
import { VERBOSE, IRectSimple, getClientRectsNoOverlap, getBoundingRect, IRect, getTextClientRects, DOMRectListToArray } from "../common/rect-utils";
import { getScrollingElement, isVerticalWritingMode, isTwoPageSpread } from "./readium-css";
import { convertRangeInfo } from "./selection";
import { ReadiumElectronWebviewWindow } from "./state";

import { CLASS_HIGHLIGHT_CONTOUR, CLASS_HIGHLIGHT_CONTOUR_MARGIN, ID_HIGHLIGHTS_CONTAINER, CLASS_HIGHLIGHT_CONTAINER, CLASS_HIGHLIGHT_CURSOR2, CLASS_HIGHLIGHT_COMMON, CLASS_HIGHLIGHT_MARGIN, CLASS_HIGHLIGHT_HOVER, CLASS_HIGHLIGHT_BEHIND, CLASS_HIGHLIGHT_COMMON_SVG, CLASS_HIGHLIGHT_MASK, CLASS_HIGHLIGHT_SVG, ID_HIGHLIGHTS_FLOATING } from "../../common/styles";

import { isRTL } from "./readium-css";

import {
Polygon,
Box,
BooleanOperations,
Point,
Face,
Segment,
Vector,
Arc,
ORIENTATION,
CCW, // true
CW, // false
Utils,
Edge,
// PolygonEdge,
} from "@flatten-js/core";
const { unify, subtract } = BooleanOperations;

import { computePosition, flip, shift, offset as offsetFloat, arrow } from "@floating-ui/dom";

const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).DEBUG_RECTS = IS_DEV && VERBOSE;

export const ENABLE_FLOATING_UI = true;
export const ENABLE_CSS_HIGHLIGHTS = true && !!CSS.highlights;
export const ENABLE_PAGEBREAK_MARGIN_TEXT_EXPERIMENT = false;

let lastMouseDownX = -1;
let lastMouseDownY = -1;
let bodyEventListenersSet = false;
let _highlightsContainer: HTMLElement | undefined;
// let _highlightsFloatingUI: HTMLDivElement | undefined;
// let _highlightsFloatingUI_ARROW: HTMLDivElement | undefined;
// let _highlightsFloatingUI_TEXT: HTMLDivElement | undefined;
// let _highlightsFloatingUI_: SVGElement | undefined;
let _timeoutMouseMove: number | undefined;
const TIMEOUT_MOUSE_MS = 200;

const cleanupPolygon = (polygonAccumulator: Polygon, off: number) => {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DEBUG_RECTS = (window as any).DEBUG_RECTS;

    const minLength = Math.abs(off) + 1;
    let nSegments = 0;
    let nArcs = 0;
    let total = 0;
    if (DEBUG_RECTS) {
        console.log("--====}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}");
    }
    for (const e of polygonAccumulator.edges) {
        const edge = e as Edge;
        if (edge.isSegment) {
            nSegments++;
            const segment = edge.shape as Segment;
            const l = segment.length;
            if (Utils.LE(l, minLength)) {
                total++;
                if (DEBUG_RECTS) {
                    console.log("--POLYGON SEGMENT small LENGTH: " + l + "(" + off + ")");
                }
            } else {
                if (DEBUG_RECTS) {
                    console.log("--POLYGON SEGMENT ok LENGTH: " + l + "(" + off + ")");
                }
            }
        } else if (edge.isArc) {
            nArcs++;
            if (DEBUG_RECTS) {
                console.log("--POLYGON ARC");
            }
        }
    }
    if (DEBUG_RECTS) {
        console.log("--====");
        console.log("--==== POLYGON SEGMENT small TOTAL 1: " + total);
        console.log("--==== POLYGON SEGMENT small SEGMENTS 1: " + nSegments);
        console.log("--==== POLYGON SEGMENT small ARCS 1: " + nArcs);
    }
    total = 0;
    nSegments = 0;
    nArcs = 0;
    if (DEBUG_RECTS) {
        console.log("--====}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}");
    }
    for (const f of polygonAccumulator.faces) {
        const face = f as Face;
        for (const e of face.edges) {
            const edge = e as Edge;
            if (edge.isSegment) {
                nSegments++;
                const segment = edge.shape as Segment;
                const l = segment.length;
                if (Utils.LE(l, minLength)) {
                    total++;
                    if (DEBUG_RECTS) {
                        console.log("--POLYGON SEGMENT small LENGTH: " + l + "(" + off + ")");
                    }
                } else {
                    if (DEBUG_RECTS) {
                        console.log("--POLYGON SEGMENT ok LENGTH: " + l + "(" + off + ")");
                    }
                }
            } else if (edge.isArc) {
                nArcs++;
                if (DEBUG_RECTS) {
                    console.log("--POLYGON ARC");
                }
            }
        }
    }
    if (DEBUG_RECTS) {
        console.log("--====");
        console.log("--==== POLYGON SEGMENT small TOTAL 2: " + total);
        console.log("--==== POLYGON SEGMENT small SEGMENTS 2: " + nSegments);
        console.log("--==== POLYGON SEGMENT small ARCS 2: " + nArcs);
    }
    total = 0;
    nSegments = 0;
    nArcs = 0;
    if (DEBUG_RECTS) {
        console.log("--====}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}");
    }
    for (const f of polygonAccumulator.faces) {
        const face = f as Face;
        let edge = face.first;
        while (edge) {
            if (edge.isSegment) {
                nSegments++;
                const segment = edge.shape as Segment;
                const l = segment.length;
                if (Utils.LE(l, minLength)) {
                    total++;
                    if (DEBUG_RECTS) {
                        console.log("--POLYGON SEGMENT small LENGTH: " + l + "(" + off + ")");
                    }
                } else {
                    if (DEBUG_RECTS) {
                        console.log("--POLYGON SEGMENT ok LENGTH: " + l + "(" + off + ")");
                    }
                }
            } else if (edge.isArc) {
                nArcs++;
                if (DEBUG_RECTS) {
                    console.log("--POLYGON ARC");
                }
            }
            if (edge == face.last) {
                break;
            }
            edge = edge.next;
        }
    }
    if (DEBUG_RECTS) {
        console.log("--====");
        console.log("--==== POLYGON SEGMENT small TOTAL 3: " + total);
        console.log("--==== POLYGON SEGMENT small SEGMENTS 3: " + nSegments);
        console.log("--==== POLYGON SEGMENT small ARCS 3: " + nArcs);

        console.log("--====}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}");
    }

    const faces: Face[] = Array.from(polygonAccumulator.faces);
    for (const f of faces) {
        const face = f as Face;
        if (DEBUG_RECTS) {
            console.log("~~~~ POLY FACE");
        }

        const edges = Array.from(face.edges);
        const edgeShapes = edges.map((edge) => edge.shape);
        let chainedEdgeShapes: Array<Segment | Arc> = [];

        while (edgeShapes.length) {
            if (DEBUG_RECTS) {
                console.log("~~~~ POLY EDGE SHAPE");
            }

            if (!chainedEdgeShapes.length) {
                const last = edgeShapes.pop()!;
                chainedEdgeShapes.push(last);
                continue;
            }

            // peek not pop
            const lastInChain = chainedEdgeShapes[chainedEdgeShapes.length - 1];

            const lastInChainStartPoint = (lastInChain as Arc).breakToFunctional ? (lastInChain as Arc).start : (lastInChain as Segment).start;

            const lastInChainEndPoint = (lastInChain as Arc).breakToFunctional ? (lastInChain as Arc).end : (lastInChain as Segment).end;

            const shapesBefore: Array<Segment | Arc> = [];
            const shapesAfter: Array<Segment | Arc> = [];
            for (const edgeShape of edgeShapes) {

                const edgeShapeStartPoint = (edgeShape as Arc).breakToFunctional ? (edgeShape as Arc).start : (edgeShape as Segment).start;

                const edgeShapeEndPoint = (edgeShape as Arc).breakToFunctional ? (edgeShape as Arc).end : (edgeShape as Segment).end;

                if (Utils.EQ(lastInChainStartPoint.x, edgeShapeEndPoint.x) && Utils.EQ(lastInChainStartPoint.y, edgeShapeEndPoint.y)) {
                    shapesBefore.push(edgeShape);
                }

                if (Utils.EQ(lastInChainEndPoint.x, edgeShapeStartPoint.x) && Utils.EQ(lastInChainEndPoint.y, edgeShapeStartPoint.y)) {
                    shapesAfter.push(edgeShape);
                }
            }

            // FAIL, should be a closed shape
            //  || shapesBefore.length === 0
            if (shapesBefore.length > 1 || shapesAfter.length > 1 || shapesAfter.length === 0) {
                if (DEBUG_RECTS) {
                    console.log("~~~~ POLY SHAPES BEFORE/AFTER ABORT: " + shapesBefore.length + " ... " + shapesAfter.length);
                }

                chainedEdgeShapes = [];
                // chainedEdgeShapes = edges.map((edge) => edge.shape);
                break;
            }

            const startPoint = (shapesAfter[0] as Arc).breakToFunctional ? (shapesAfter[0] as Arc).start : (shapesAfter[0] as Segment).start;
            const endPoint = (shapesAfter[0] as Arc).breakToFunctional ? (shapesAfter[0] as Arc).end : (shapesAfter[0] as Segment).end;
            if (DEBUG_RECTS) {
                console.log("*** SEGMENT/ARC --- START: (" + startPoint.x + ", " + startPoint.y + ") END: (" + endPoint.x + ", " + endPoint.y + ")");
            }

            edgeShapes.splice(edgeShapes.indexOf(shapesAfter[0]), 1);
            chainedEdgeShapes.push(shapesAfter[0]);

            if (chainedEdgeShapes.length === edges.length) {

                // const edgeShapeStartPoint = (shapesAfter[0] as Arc).breakToFunctional ? (shapesAfter[0] as Arc).start : (shapesAfter[0] as Segment).start;

                const edgeShapeEndPoint = (shapesAfter[0] as Arc).breakToFunctional ? (shapesAfter[0] as Arc).end : (shapesAfter[0] as Segment).end;

                const firstInChainStartPoint = (chainedEdgeShapes[0] as Arc).breakToFunctional ? (chainedEdgeShapes[0] as Arc).start : (chainedEdgeShapes[0] as Segment).start;

                // const firstInChainEndPoint = (chainedEdgeShapes[0] as Arc).breakToFunctional ? (chainedEdgeShapes[0] as Arc).end : (chainedEdgeShapes[0] as Segment).end;

                // FAIL, should be a closed shape
                if (!Utils.EQ(firstInChainStartPoint.x, edgeShapeEndPoint.x) || !Utils.EQ(firstInChainStartPoint.y, edgeShapeEndPoint.y)) {
                    if (DEBUG_RECTS) {
                        console.log("~~~~ POLY SHAPES TAIL/HEAD ABORT");
                    }

                    chainedEdgeShapes = [];
                    // chainedEdgeShapes = edges.map((edge) => edge.shape);
                    break;
                }
            }
        }
        // if (chainedEdgeShapes.length !== edges.length) {
        //     chainedEdgeShapes = edges.map((edge) => edge.shape);
        // }

        let previousSegment: Segment | undefined;
        let previousSmallSegment: Segment | undefined;
        const newEdgeShapes: Array<Segment | Arc> = [];
        let hasChanged = false;

        // guaranteed chain loop
        for (const edgeShape of chainedEdgeShapes) {
            if (!(edgeShape as Arc).breakToFunctional) {
                const segment = edgeShape as Segment;

                const l = segment.length;

                if (DEBUG_RECTS) {
                    console.log("--POLYGON SLOPES: " + previousSegment?.slope + " vs. " + segment.slope);
                }
                if (previousSegment && Utils.EQ(previousSegment.slope, segment.slope)) {
                    if (DEBUG_RECTS) {
                        console.log("--POLYGON SLOPE EQUAL ... merge :)");
                    }
                    hasChanged = true;
                    newEdgeShapes.pop();
                    const seg = new Segment(new Point(previousSegment.start.x, previousSegment.start.y), new Point(segment.end.x, segment.end.y));
                    newEdgeShapes.push(seg);
                    previousSmallSegment = undefined;
                    previousSegment = seg;

                    if (chainedEdgeShapes.indexOf(edgeShape) === chainedEdgeShapes.length - 1 && !(newEdgeShapes[0] as Arc).breakToFunctional && Utils.EQ((newEdgeShapes[0] as Segment).slope, seg.slope)) {
                        if (DEBUG_RECTS) {
                            console.log("--POLYGON SLOPE EQUAL (tail/head link) 1... merge :)");
                        }
                        hasChanged = true;
                        newEdgeShapes.splice(0, 1);
                        const seg2 = new Segment(new Point(newEdgeShapes[0].start.x, newEdgeShapes[0].start.y), new Point(seg.end.x, seg.end.y));
                        newEdgeShapes.push(seg2);
                        previousSmallSegment = undefined;
                        previousSegment = seg2;
                    }
                } else if (newEdgeShapes.length && chainedEdgeShapes.indexOf(edgeShape) === chainedEdgeShapes.length - 1 && !(newEdgeShapes[0] as Arc).breakToFunctional && Utils.EQ((newEdgeShapes[0] as Segment).slope, segment.slope)) {
                    if (DEBUG_RECTS) {
                        console.log("--POLYGON SLOPE EQUAL (tail/head link) 2... merge :)");
                    }
                    hasChanged = true;
                    newEdgeShapes.splice(0, 1);
                    const seg = new Segment(new Point(newEdgeShapes[0].start.x, newEdgeShapes[0].start.y), new Point(segment.end.x, segment.end.y));
                    newEdgeShapes.push(seg);
                    previousSmallSegment = undefined;
                    previousSegment = seg;
                } else if (Utils.LE(l, minLength)) {
                    if (DEBUG_RECTS) {
                        console.log("--POLYGON SEGMENT small LENGTH: " + l + "(" + off + ")");
                    }

                    if (previousSmallSegment) {
                        if (DEBUG_RECTS) {
                            console.log("-->>>> POLYGON SEGMENT small will merge :) ...");
                        }
                        hasChanged = true;
                        newEdgeShapes.pop();
                        const seg = new Segment(new Point(previousSmallSegment.start.x, previousSmallSegment.start.y), new Point(segment.end.x, segment.end.y));
                        newEdgeShapes.push(seg);
                        previousSmallSegment = undefined;
                        previousSegment = seg;
                    } else if (newEdgeShapes.length && chainedEdgeShapes.indexOf(edgeShape) === chainedEdgeShapes.length - 1 && !(newEdgeShapes[0] as Arc).breakToFunctional && Utils.LE((newEdgeShapes[0] as Segment).length, minLength)) {
                        if (DEBUG_RECTS) {
                            console.log("-->>>> POLYGON SEGMENT small (tail/head link) will merge :) ...");
                        }
                        hasChanged = true;
                        newEdgeShapes.splice(0, 1);
                        const seg = new Segment(new Point(newEdgeShapes[0].start.x, newEdgeShapes[0].start.y), new Point(segment.end.x, segment.end.y));
                        newEdgeShapes.push(seg);
                        previousSmallSegment = undefined;
                        previousSegment = seg;
                    } else {
                        newEdgeShapes.push(segment);
                        previousSmallSegment = segment;
                        previousSegment = segment;
                    }
                } else {
                    if (DEBUG_RECTS) {
                        console.log("--POLYGON SEGMENT ok LENGTH: " + l + "(" + off + ")");
                    }

                    previousSmallSegment = undefined;
                    newEdgeShapes.push(segment);
                    previousSegment = segment;
                }
            } else {
                if (DEBUG_RECTS) {
                    console.log("--POLYGON ARC");
                }
                previousSmallSegment = undefined;
                previousSegment = undefined;
                newEdgeShapes.push(edgeShape as Arc);
            }
        }

        if (hasChanged) {
            if (DEBUG_RECTS) {
                console.log("-->>>> POLYGON face changed :)");
            }
            polygonAccumulator.deleteFace(face);
            polygonAccumulator.addFace(newEdgeShapes);
            // polygonAccumulator.recreateFaces();
        }
    }
};

const addEdgePoints = (polygon: Polygon, offset: number) => {

    const boxes: Box[] = [];
    for (const f of polygon.faces) {
        const face = f as Face;
        for (const edge of face.edges) {
            if (edge.isSegment) {
                const segment = edge.shape as Segment;
                const bStart = new Box(segment.start.x - offset, segment.start.y - offset, segment.start.x + offset * 2, segment.start.y + offset * 2);
                boxes.push(bStart);
                const bEnd = new Box(segment.end.x - offset, segment.end.y - offset, segment.end.x + offset * 2, segment.end.y + offset * 2);
                boxes.push(bEnd);
            } else {
                const arc = edge.shape as Arc;
                const bStart = new Box(arc.start.x - offset, arc.start.y - offset, arc.start.x + offset * 2, arc.start.y + offset * 2);
                boxes.push(bStart);
                const bEnd = new Box(arc.end.x - offset, arc.end.y - offset, arc.end.x + offset * 2, arc.end.y + offset * 2);
                boxes.push(bEnd);
            }
        }
    }
    for (const box of boxes) {
        polygon.addFace(box);
    }
};

const BASE_ORIENTATION = ORIENTATION.CCW; // -1
// const BASE_ORIENTATION_INVERSE = ORIENTATION.CW; // 1

const USE_SEGMENT_JOINS_NOT_ARCS = false;
// import offset from "@flatten-js/polygon-offset";
// Number((x).toPrecision(12))
// https://github.com/alexbol99/flatten-offset/issues/17#issuecomment-1949934684
function arcSE(center: Point, start: Point, end: Point, counterClockwise: boolean): Arc {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DEBUG_RECTS = (window as any).DEBUG_RECTS;

    const startAngle = Number((new Vector(center, start).slope).toPrecision(12));
    let endAngle = Number((new Vector(center, end).slope).toPrecision(12));

    if (Utils.EQ(startAngle, endAngle)) {
        if (DEBUG_RECTS) {
            console.log("--POLYGON ARC ORIENTATION CCW/CW inverse");
        }
        endAngle += 2 * Math.PI;
        counterClockwise = !counterClockwise;
    }

    const r = Number((new Vector(center, start).length).toPrecision(12));

    return new Arc(center, r, startAngle, endAngle, counterClockwise); // default is CCW / true
}

function offset_(polygon: Polygon, off: number, useSegmentJoinsNotArcs: boolean) {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DEBUG_RECTS = (window as any).DEBUG_RECTS;

    const postponeFinalUnify = off > 0; // Utils.GT(off, 0);
    let polygonAccumulator = postponeFinalUnify ? undefined : polygon.clone();

    for (const f of polygon.faces) {
        const face = f as Face;
        for (const edge of face.edges) {
            if (edge.isSegment) {
                const polygonEdge = new Polygon();

                const segment = edge.shape as Segment;

                const v_seg = new Vector(segment.end.x - segment.start.x, segment.end.y - segment.start.y);
                const v_seg_unit = v_seg.normalize();

                // console.log("--POLYGON SEGMENT LENGTH: " + v_seg.length);

                const absOffset = Math.abs(off);
                const v_left = v_seg_unit.rotate90CCW().multiply(absOffset);
                const v_right = v_seg_unit.rotate90CW().multiply(absOffset);

                const seg_left = segment.translate(v_left).reverse();
                const seg_right = segment.translate(v_right);

                const seg_left_ = new Segment(new Point(Number((seg_left.start.x).toPrecision(12)), Number((seg_left.start.y).toPrecision(12))), new Point(Number((seg_left.end.x).toPrecision(12)), Number((seg_left.end.y).toPrecision(12))));

                const seg_right_ = new Segment(new Point(Number((seg_right.start.x).toPrecision(12)), Number((seg_right.start.y).toPrecision(12))), new Point(Number((seg_right.end.x).toPrecision(12)), Number((seg_right.end.y).toPrecision(12))));

                const orientation = BASE_ORIENTATION === ORIENTATION.CCW ? CCW : CW;
                const cap1 = arcSE(segment.start, seg_left_.end, seg_right_.start, orientation);
                const cap2 = arcSE(segment.end, seg_right_.end, seg_left_.start, orientation);

                const cap1_ =
                    useSegmentJoinsNotArcs
                    ?
                    new Segment(seg_left_.end, seg_right_.start)
                    :
                    cap1;
                    // new Arc(new Point(Number((cap1.center.x).toPrecision(12)), Number((cap1.center.y).toPrecision(12))), Number((cap1.r).toPrecision(12)), Number((cap1.startAngle).toPrecision(12)), Number((cap1.endAngle).toPrecision(12)), cap1.counterClockwise)
                const cap2_ =
                    useSegmentJoinsNotArcs
                    ?
                    new Segment(seg_right_.end, seg_left_.start)
                    :
                    cap2;
                    // new Arc(new Point(Number((cap2.center.x).toPrecision(12)), Number((cap2.center.y).toPrecision(12))), Number((cap2.r).toPrecision(12)), Number((cap2.startAngle).toPrecision(12)), Number((cap2.endAngle).toPrecision(12)), cap2.counterClockwise)

                const face = polygonEdge.addFace([
                    seg_left_,
                    cap1_,
                    seg_right_,
                    cap2_,
                ]);
                if (face.orientation() !== BASE_ORIENTATION) {
                    if (DEBUG_RECTS) {
                        console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 1");
                    }
                    face.reverse();
                }

                // console.log("--POLYGON FACE AREA: " + face.area());

                if (!(polygonAccumulator || polygonEdge).faces.size) {

                    if (DEBUG_RECTS) {
                        console.log("--################# POLYGON BEFORE unify/substract HAS NO FACES!! " + (polygonAccumulator || polygonEdge).faces.size);
                    }
                }

                if (off > 0) { // Utils.GT(off, 0)
                    polygonAccumulator = polygonAccumulator ? unify(polygonAccumulator, polygonEdge) : polygonEdge;
                } else {
                    polygonAccumulator = polygonAccumulator ? subtract(polygonAccumulator, polygonEdge) : polygonEdge;
                }

                if (!(polygonAccumulator || polygonEdge).faces.size) {
                    if (DEBUG_RECTS) {
                        console.log("--################# POLYGON AFTER unify/substract HAS NO FACES!! " + (polygonAccumulator || polygonEdge).faces.size);
                    }

                    if (!useSegmentJoinsNotArcs) {
                        if (DEBUG_RECTS) {
                            console.log("--##### POLYGON AFTER unify/substract try again without arc, only segment joiners ...");
                        }
                        return offset_(polygon, off, true);
                    }
                } else {
                    if (DEBUG_RECTS) {
                        console.log("--################# POLYGON AFTER unify/substract FACES: " + (polygonAccumulator || polygonEdge).edges.size + " /// " + (polygonAccumulator || polygonEdge).faces.size);
                    }
                }

                for (const f of polygonAccumulator.faces) {
                    const face = f as Face;
                    if (face.edges.length < 4) {
                        if (DEBUG_RECTS) {
                            console.log("-------- POLYGON FACE EDGES not at least 4??!");
                        }
                        if (!useSegmentJoinsNotArcs) {
                            if (DEBUG_RECTS) {
                                console.log("--##### POLYGON AFTER unify/substract try again without arc, only segment joiners ...");
                            }
                            return offset_(polygon, off, true);
                        }
                    }

                    if (face.orientation() !== BASE_ORIENTATION) {
                        if (DEBUG_RECTS) {
                            console.log("-------- POLYGON FACE ORIENTATION");
                        }
                        // face.reverse();
                    }
                }
            } else {
                // offsetEdge = offsetArc(segment, w);
                console.log("!!!!!!!! POLYGON ARC??!");
                // process.exit(0);
                return polygon;
            }
        }
    }

    Array.from((polygonAccumulator ? polygonAccumulator : polygon).faces).forEach((face: Face) => {
        if (face.orientation() !== BASE_ORIENTATION) {
            if (DEBUG_RECTS) {
                console.log("--HIGH WEBVIEW-- removing polygon orientation face / inner hole (offset poly 1))");
            }
            if (polygonAccumulator) {
                polygonAccumulator.deleteFace(face);
                // face.reverse();
            }
        }
    });

    if (polygonAccumulator && postponeFinalUnify) {
        polygonAccumulator = unify(polygonAccumulator, polygon);
    }

    Array.from((polygonAccumulator ? polygonAccumulator : polygon).faces).forEach((face: Face) => {
        if (face.orientation() !== BASE_ORIENTATION) {
            if (DEBUG_RECTS) {
                console.log("--HIGH WEBVIEW-- removing polygon orientation face / inner hole (offset poly 2))");
            }
            if (polygonAccumulator) {
                polygonAccumulator.deleteFace(face);
                // face.reverse();
            }
        }
    });

    if (polygonAccumulator) {
        if (!polygonAccumulator.faces.size) {
            if (DEBUG_RECTS) {
                console.log("--################# POLYGON INTERMEDIARY HAS NO FACES!! " + polygonAccumulator.faces.size);
            }
        }

        cleanupPolygon(polygonAccumulator, off);
    }

    let resPoly = polygonAccumulator ? polygonAccumulator : polygon;

    if (!resPoly.faces.size) {
        if (DEBUG_RECTS) {
            console.log("--################# POLYGON INTERMEDIARY HAS NO FACES!! " + resPoly.faces.size);
        }
        if (polygonAccumulator) {
            if (DEBUG_RECTS) {
                console.log("--################# FALLBACK TO SINGLE FACE POLY (BEFORE SUBSTRACT/UNIFY): " + polygon.faces.size);
            }
            resPoly = polygon;
        }
    }

    return resPoly;
}

function offset(originaPolygon: Polygon, off: number, useSegmentJoinsNotArcs: boolean = USE_SEGMENT_JOINS_NOT_ARCS): Polygon {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DEBUG_RECTS = (window as any).DEBUG_RECTS;

    off = Number((off).toPrecision(12));

    if (Utils.EQ_0(off)) {
        return originaPolygon;
    }

    const singleFacePolygons: Polygon[] = [];
    for (const f of originaPolygon.faces) {
        const face = f as Face;
        const poly = new Polygon();
        poly.addFace(face.edges.map((edge) => edge.shape));
        singleFacePolygons.push(poly);
    }

    const singlePolygon = new Polygon();

    for (const polygon of singleFacePolygons) {
        const resPoly = offset_(polygon, off, useSegmentJoinsNotArcs);

        for (const f of resPoly.faces) {
            const face = f as Face;
            singlePolygon.addFace(face.edges.map(((edge) => edge.shape)));
        }
    }

    if (!singlePolygon.faces.size) {
        if (DEBUG_RECTS) {
            console.log("--##### POLYGON OFFSET HAS NO FACES!! " + singlePolygon.faces.size);
        }

        if (!useSegmentJoinsNotArcs) {
            if (DEBUG_RECTS) {
                console.log("--##### POLYGON OFFSET try again without arc, only segment joiners ...");
            }
            return offset(originaPolygon, off, true);
        }
    }

    return singlePolygon;
}

// https://chromium.googlesource.com/devtools/devtools-frontend/+/refs/heads/main/front_end/core/common/ColorUtils.ts
//     const rgb = Math.round(0xffffff * Math.random());
//     // tslint:disable-next-line:no-bitwise
//     const r = rgb >> 16;
//     // tslint:disable-next-line:no-bitwise
//     const g = rgb >> 8 & 255;
//     // tslint:disable-next-line:no-bitwise
//     const b = rgb & 255;
// rgb(${r}, ${g}, ${b});

const DEFAULT_BACKGROUND_COLOR: IColor = {
    blue: 0,
    green: 0,
    red: 255,
};

const _highlights: IHighlight[] = [];

// TODO: super hacky!! (separation of concerns)
export const HIGHLIGHT_GROUP_TTS = "tts";
export const HIGHLIGHT_GROUP_PAGEBREAK = "pagebreak";

let _drawMargin: boolean | string[] = false;
const drawMargin = (h: IHighlight) => {
    if (h.group === HIGHLIGHT_GROUP_TTS) {
        return false;
    }

    if (h.drawType === HighlightDrawTypeOpacityMask || h.drawType === HighlightDrawTypeOpacityMaskRuler || h.drawType === HighlightDrawTypeMarginBookmark) {
        return true;
    }

    if (h.group === HIGHLIGHT_GROUP_PAGEBREAK) {
        return true;
    }
    if (Array.isArray(_drawMargin)) {
        if (h.group) {
            return _drawMargin.includes(h.group);
        }
        return false;
    }
    return _drawMargin;
};
export const setDrawMargin = (win: ReadiumElectronWebviewWindow, drawMargin: boolean | string[]) => {
    _drawMargin = drawMargin;
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- _drawMargin: " + JSON.stringify(_drawMargin, null, 4));
    }
    recreateAllHighlightsRaw(win);
};

interface IWithRect {
    rect: IRectSimple;
    scale: number;
    // xOffset: number;
    // yOffset: number;
}
interface IHTMLDivElementWithRect extends HTMLDivElement, IWithRect {
}

interface IWithPolygon {
    polygon: Polygon;
}
const SVG_XML_NAMESPACE = "http://www.w3.org/2000/svg";
// interface ISVGRectElementWithRect extends SVGRectElement, IWithRect {
// }
// interface ISVGLineElementWithRect extends SVGLineElement, IWithRect {
// }
interface ISVGElementWithPolygon extends SVGSVGElement, IWithPolygon {
}

// interface IDocumentBody extends HTMLElement {
//     _CachedBoundingClientRect: DOMRect | undefined;
//     _CachedMargins: IRect | undefined;
// }
export function getBoundingClientRectOfDocumentBody(win: ReadiumElectronWebviewWindow): DOMRect {
    // TODO: does this need to be cached? (performance, notably during mouse hover)
    return win.document.body.getBoundingClientRect();

    // if (!(win.document.body as IDocumentBody)._CachedBoundingClientRect) {
    //     (win.document.body as IDocumentBody)._CachedBoundingClientRect = win.document.body.getBoundingClientRect();
    // }
    // console.log("_CachedBoundingClientRect",
    //     JSON.stringify((win.document.body as IDocumentBody)._CachedBoundingClientRect));
    // return (win.document.body as IDocumentBody)._CachedBoundingClientRect as DOMRect;
}
// export function invalidateBoundingClientRectOfDocumentBody(win: ReadiumElectronWebviewWindow) {
//     (win.document.body as IDocumentBody)._CachedBoundingClientRect = undefined;
// }
// function getBodyMargin(win: ReadiumElectronWebviewWindow): IRect {
//     const bodyStyle = win.getComputedStyle(win.document.body);
//     if (!(win.document.body as IDocumentBody)._CachedMargins) {
//         (win.document.body as IDocumentBody)._CachedMargins = {
//             bottom: parseInt(bodyStyle.marginBottom, 10),
//             height: 0,
//             left: parseInt(bodyStyle.marginLeft, 10),
//             right: parseInt(bodyStyle.marginRight, 10),
//             top: parseInt(bodyStyle.marginTop, 10),
//             width: 0,
//         };
//     }
//     console.log("_CachedMargins",
//         JSON.stringify((win.document.body as IDocumentBody)._CachedMargins));
//     return (win.document.body as IDocumentBody)._CachedMargins as IRect;
// }

function processMouseEvent(win: ReadiumElectronWebviewWindow, ev: MouseEvent) {

    if (_timeoutMouseMove) {
        clearTimeout(_timeoutMouseMove);
        _timeoutMouseMove = undefined;
    }

    // const highlightsContainer = documant.getElementById(`${ID_HIGHLIGHTS_CONTAINER}`);
    if (!_highlightsContainer) {
        return;
    }

    const isMouseMove = ev.type === "mousemove";
    if (isMouseMove) {
        // no hit testing during user selection drag
        if (ev.buttons > 0) {
            return;
        }

        if (!_highlights.length) {
            return;
        }
    }

    const documant = win.document;
    const scrollElement = getScrollingElement(documant);

    // relative to fixed window top-left corner
    // (unlike pageX/Y which is relative to top-left rendered content area, subject to scrolling)
    const x = ev.clientX;
    const y = ev.clientY;

    const paginated = isPaginated(documant);

    // COSTLY! TODO: cache DOMRect
    const bodyRect = getBoundingClientRectOfDocumentBody(win);

    const xOffset = paginated ? (-scrollElement.scrollLeft) : bodyRect.left;
    const yOffset = paginated ? (-scrollElement.scrollTop) : bodyRect.top;

    // const scale = 1 / ((win.READIUM2 && win.READIUM2.isFixedLayout) ? win.READIUM2.fxlViewportScale : 1);
    const scale = 1;

    let hit = false;
    let foundHighlight: IHighlight | undefined;
    let foundElement: IHTMLDivElementWithRect | undefined;
    // for (const highlight of _highlights) {
    for (let i = _highlights.length - 1; i >= 0; i--) {
        const highlight = _highlights[i];
        const doDrawMargin = drawMargin(highlight);

        let highlightParent = documant.getElementById(`${highlight.id}`);
        if (!highlightParent) { // ??!!
            highlightParent = _highlightsContainer.querySelector(`#${highlight.id}`); // .${CLASS_HIGHLIGHT_CONTAINER}
        }
        if (!highlightParent) { // what?
            continue;
        }

        let highlightFragment = highlightParent.firstElementChild;
        while (highlightFragment) {
            if (highlightFragment.namespaceURI === SVG_XML_NAMESPACE) {

                const svg = highlightFragment as ISVGElementWithPolygon;
                hit = (!doDrawMargin || svg.classList.contains(CLASS_HIGHLIGHT_CONTOUR_MARGIN)) && svg.polygon.contains(new Point((x - xOffset) * scale, (y - yOffset) * scale));
                if (hit) {
                    break;
                }
            }

            highlightFragment = highlightFragment.nextElementSibling;
        }

        if (hit) {
            foundHighlight = highlight;
            foundElement = highlightParent as IHTMLDivElementWithRect;
            break;
        }
    }

    let highlightContainer = _highlightsContainer.firstElementChild;
    while (highlightContainer) {
        if (!foundElement || foundElement !== highlightContainer) {
            highlightContainer.classList.remove(CLASS_HIGHLIGHT_HOVER);
        }

        // const id = highlightContainer.id || highlightContainer.getAttribute("id");
        // const highlight = id ? _highlights.find((h) => h.id === id) : undefined;
        // const drawUnderline = highlight?.drawType === HighlightDrawTypeUnderline;
        // const drawStrikeThrough = highlight?.drawType === HighlightDrawTypeStrikethrough;
        // const doDrawMargin = highlight ? drawMargin(highlight) : false;

        highlightContainer = highlightContainer.nextElementSibling;
    }

    if (!hit) { // !foundHighlight || !foundElement
        const _highlightsFloatingUI = win.document.getElementById(ID_HIGHLIGHTS_FLOATING);
        if (_highlightsFloatingUI && _highlightsFloatingUI.style.display !== "none") {
            _highlightsFloatingUI.style.display = "none";
        }
        // if (_highlightsFloatingUI_) {
        //     _highlightsFloatingUI_.style.display = "none";
        // }

        // documant.documentElement.classList.remove(CLASS_HIGHLIGHT_CURSOR1);
        documant.documentElement.classList.remove(CLASS_HIGHLIGHT_CURSOR2);
        return;
    }

    // we're not checking foundHighlight.group !== HIGHLIGHT_GROUP_TTS because foundHighlight.pointerInteraction does the job
    if (foundElement && foundHighlight && foundHighlight.pointerInteraction) { // && !drawMargin(foundHighlight)

        if (isMouseMove) {
            foundElement.classList.add(CLASS_HIGHLIGHT_HOVER);

            // const doDrawMargin = drawMargin(foundHighlight);
            // documant.documentElement.classList.add(doDrawMargin ? CLASS_HIGHLIGHT_CURSOR1 : CLASS_HIGHLIGHT_CURSOR2);
            if (foundHighlight.group !== HIGHLIGHT_GROUP_PAGEBREAK) {
                documant.documentElement.classList.add(CLASS_HIGHLIGHT_CURSOR2);
            }

            const text = foundHighlight.textPopup?.text ? foundHighlight.textPopup.text : undefined;
            if (text && _highlightsContainer) {

                // if (_timeoutMouseMove) {
                //     clearTimeout(_timeoutMouseMove);
                //     _timeoutMouseMove = undefined;
                // }
                _timeoutMouseMove = win.setTimeout(() => {
                    _timeoutMouseMove = undefined;
                    // win.requestAnimationFrame(() => {
                    if (!_highlightsContainer) {
                        return;
                    }

                const _highlightsFloatingUI = win.document.getElementById(ID_HIGHLIGHTS_FLOATING);
                if (!_highlightsFloatingUI) {
                    return;
                }
                const _highlightsFloatingUI_ARROW = _highlightsFloatingUI.firstElementChild as HTMLDivElement | null;
                if (!_highlightsFloatingUI_ARROW) {
                    return;
                }
                const _highlightsFloatingUI_TEXT = _highlightsFloatingUI_ARROW.nextElementSibling as HTMLDivElement | null;
                if (!_highlightsFloatingUI_TEXT) {
                    return;
                }

                const doDrawArrow = foundHighlight.drawType !== HighlightDrawTypeMarginBookmark;
                _highlightsFloatingUI_ARROW.style.display = doDrawArrow ? "block" : "none";

                const dir = foundHighlight.textPopup?.dir ? foundHighlight.textPopup.dir : "ltr";
                const lang = foundHighlight.textPopup?.lang ? foundHighlight.textPopup.lang : "en";

                // const inverseZoom = computeInverseZoom(bodyComputedStyle, rootComputedStyle);
                // const zoom = _highlightsContainer.style.zoom ?
                //     parseFloat(_highlightsContainer.style.zoom) :
                //     1;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const zoom = (foundElement as any).__inverseZoom || 1;

                if (dir) {
                    _highlightsFloatingUI_TEXT.setAttribute("dir", dir);
                } else {
                    _highlightsFloatingUI_TEXT.removeAttribute("dir");
                }

                if (lang) {
                    _highlightsFloatingUI_TEXT.setAttribute("lang", lang);
                    _highlightsFloatingUI_TEXT.setAttributeNS("http://www.w3.org/XML/1998/", "lang", lang);
                } else {
                    _highlightsFloatingUI_TEXT.removeAttribute("lang");
                    _highlightsFloatingUI_TEXT.removeAttributeNS("http://www.w3.org/XML/1998/", "lang");
                }

                _highlightsFloatingUI_TEXT.style.writingMode = "horizontal-tb";
                // _highlightsFloatingUI_TEXT.setAttribute("style", "writing-mode:horizontal-tb");

                // _highlightsFloatingUI_TEXT.innerHTML = text;
                _highlightsFloatingUI_TEXT.textContent = text;

                if (!ENABLE_FLOATING_UI) {
                    const xx = (x - xOffset) * scale;
                    const yy = (y - yOffset) * scale;
                    // if (_timeoutMouseMove) {
                    //     clearTimeout(_timeoutMouseMove);
                    //     _timeoutMouseMove = undefined;
                    // }
                    // _timeoutMouseMove = win.setTimeout(() => {
                    //     _timeoutMouseMove = undefined;
                    //     if (_highlightsFloatingUI) {
                            Object.assign(_highlightsFloatingUI.style, {
                                display: "block",
                                left: `${xx * zoom}px`,
                                top: `${yy * zoom}px`,
                            });
                    //     }
                    // }, TIMEOUT_MOUSE_MS);
                } else {
                    // win.requestAnimationFrame(() => {
                    // if (!_highlightsFloatingUI || !_highlightsContainer) {
                    //     return;
                    // }

                    // necessary inside timeout() no idea why (tried different methods to trigger layout, offsetWidth/Height are zero)
                    Object.assign(_highlightsFloatingUI.style, {
                        display: "block",
                        left: "0px",
                        top: "-999999px",
                        opacity: "0",
                    });

                    const doDrawMargin = drawMargin(foundHighlight);

                    let anchor: Element | null = null;

                    // anchor = foundElement.querySelector("svg.R2_CLASS_HIGHLIGHT_CONTOUR > path");
                    const all = foundElement.querySelectorAll("svg.R2_CLASS_HIGHLIGHT_CONTOUR > path");
                    // console.log("querySelectorAll -------- ", all?.length);
                    if (all?.length > 0) {
                        anchor = all[all?.length - 1];
                    }
                    if (!anchor && doDrawMargin) {
                        anchor = foundElement.querySelector("svg.R2_CLASS_HIGHLIGHT_CONTOUR_MARGIN > path");
                    }
                    if (anchor) {
                        // const floatingUIMiddleware = {
                        //     name: "floatingUIMiddleware",
                        //     fn({ x: fuix, y: fuiy }) {
                        //         // rects.reference.x *= zoom;
                        //         // rects.reference.y *= zoom;
                        //         // rects.reference.width *= zoom;
                        //         // rects.reference.height *= zoom;

                        //         // rects.floating.x *= zoom;
                        //         // rects.floating.y *= zoom;
                        //         // rects.floating.width *= zoom;
                        //         // rects.floating.height *= zoom;

                        //         // rects.reference.x /= zoom;
                        //         // rects.reference.y /= zoom;
                        //         // rects.reference.width /= zoom;
                        //         // rects.reference.height /= zoom;

                        //         // rects.floating.x /= zoom;
                        //         // rects.floating.y /= zoom;
                        //         // rects.floating.width /= zoom;
                        //         // rects.floating.height /= zoom;

                        //         // const xx = paginated ? (fuix - xOffset) * zoom : fuix;
                        //         // const yy = paginated ? (fuiy - yOffset) * zoom : fuiy;

                        //         const xx = fuix;
                        //         const yy = fuiy;

                        //         // console.log(" -------- ");
                        //         // console.log("zoom", zoom);
                        //         // console.log("x, y", x, y);
                        //         // console.log("fuix, fuiy", fuix, fuiy);
                        //         // console.log("xx, yy", xx, yy);
                        //         // console.log("rects.reference", rects.reference.x, rects.reference.y, rects.reference.width, rects.reference.height);
                        //         // console.log("rects.floating", rects.floating.x, rects.floating.y, rects.floating.width, rects.floating.height);
                        //         // console.log("bodyRect.left", bodyRect.left);
                        //         // console.log("bodyRect.top", bodyRect.top);
                        //         // console.log("xOffset", xOffset);
                        //         // console.log("yOffset", yOffset);
                        //         // console.log(" -------- ");

                        //         return {
                        //             x: xx,
                        //             y: yy,
                        //         };
                        //     },
                        // } satisfies Middleware;

                        const paginated = isPaginated(documant);
                        const virtualElement =
                        {
                            getBoundingClientRect() {
                                // const bb = anchor.getBoundingClientRect();
                                // return {
                                //     width: bb.width / z,
                                //     height: bb.height / z,
                                //     x: bb.x / z,
                                //     y: bb.y / z,
                                //     top: bb.top / z,
                                //     left: bb.left / z,
                                //     right: bb.right / z,
                                //     bottom: bb.bottom / z,
                                // };
                                // return {
                                //     width: bb.width * z,
                                //     height: bb.height * z,
                                //     x: bb.x * z,
                                //     y: bb.y * z,
                                //     top: bb.top * z,
                                //     left: bb.left * z,
                                //     right: bb.right * z,
                                //     bottom: bb.bottom * z,
                                // };
                                // return {
                                //     width: bb.width,
                                //     height: bb.height,
                                //     x: bb.x,
                                //     y: bb.y,
                                //     top: bb.top,
                                //     left: bb.left,
                                //     right: bb.right,
                                //     bottom: bb.bottom,
                                // };
                                return {
                                    width: 0,
                                    height: 0,
                                    x: x,
                                    y: y,
                                    top: y,
                                    left: x,
                                    right: x,
                                    bottom: y,
                                };
                                // return {
                                //     width: 0,
                                //     height: 0,
                                //     x: x / z,
                                //     y: y / z,
                                //     top: y / z,
                                //     left: x / z,
                                //     right: x / z,
                                //     bottom: y / z,
                                // };
                                // return {
                                //     width: 0,
                                //     height: 0,
                                //     x: x * z,
                                //     y: y * z,
                                //     top: y * z,
                                //     left: x * z,
                                //     right: x * z,
                                //     bottom: y * z,
                                // };

                                // const xx = (x - xOffset) * scale;
                                // const yy = (y - yOffset) * scale;
                                // // const xx = (x / z - xOffset) * scale;
                                // // const yy = (y / z - yOffset) * scale;
                                // return {
                                //     width: 0,
                                //     height: 0,
                                //     x: xx,
                                //     y: yy,
                                //     top: yy,
                                //     left: xx,
                                //     right: xx,
                                //     bottom: yy,
                                // };
                            },
                            // getClientRects
                            // contextElement: win.document.body,
                            // contextElement: _highlightsContainer,
                        };

                        let _highlightsFloatingUI_: SVGElement | HTMLElement | undefined;
                        if (paginated) {
                            // void _highlightsContainer.offsetWidth; // trigger layout, otherwise max-content not resolved inside timeout!
                            const css = win.getComputedStyle(_highlightsFloatingUI);
                            // console.log("cssText", css.cssText);
                            // console.log("width/height", css.width, css.height);
                            let width = parseFloat(css.width) || 0;
                            let height = parseFloat(css.height) || 0;
                            const offsetWidth = _highlightsFloatingUI.offsetWidth;
                            const offsetHeight = _highlightsFloatingUI.offsetHeight;
                            // console.log("offsetWidth/offsetHeight", offsetWidth, offsetHeight);
                            // if (!offsetWidth || !offsetHeight) {
                            //     console.log("RETRY...");
                            //     // win.requestAnimationFrame(() => {
                            //         // if (!_timeoutMouseMove) {
                            //             // console.log("RETRY:");
                            //             processMouseEvent(win, ev);
                            //         // }
                            //     // });
                            //     return;
                            // }
                            const shouldFallback = Math.round(width) !== offsetWidth || Math.round(height) !== offsetHeight;
                            if (shouldFallback) {
                                width = offsetWidth;
                                height = offsetHeight;
                            }

                            _highlightsFloatingUI_ = documant.createElementNS(SVG_XML_NAMESPACE, "svg") as SVGElement;
                            // _highlightsFloatingUI_ = win.document.createElement("div");

                            _highlightsFloatingUI_.setAttribute("id", ID_HIGHLIGHTS_FLOATING + "_");

                            // Object.assign(_highlightsFloatingUI_.style, _highlightsFloatingUI.style);
                            // _highlightsFloatingUI_.style.cssText = css.cssText;

                            // for (const k of Object.getOwnPropertyNames(css)) {
                            //     try {
                            //         // @ts-expect-error index
                            //         _highlightsFloatingUI_.style[k] = css[k];
                            //         // @--ts-expect-error index
                            //         // console.log("CSS OK", k, css[k]);
                            //     } catch (_err) {
                            //         // @---ts-expect-error index
                            //         // console.log("CSS ERR", err, k, css[k]);
                            //     }
                            // }
                            // console.log("zoom", zoom);
                            Object.assign(_highlightsFloatingUI_.style, {
                                width: (width / zoom) + "px",
                                height: (height / zoom) + "px",
                                // display: "none",
                            });
                            // _highlightsFloatingUI_.style.width = (width / zoom) + "px";
                            // _highlightsFloatingUI_.style.height = (height / zoom) + "px";
                            // console.log("_highlightsFloatingUI_.style.width", _highlightsFloatingUI_.style.width);
                            // console.log("_highlightsFloatingUI_.style.height", _highlightsFloatingUI_.style.height);

                            // _highlightsFloatingUI_.setAttribute("width", width+"");
                            // _highlightsFloatingUI_.setAttribute("height", height+"");

                            _highlightsContainer.append(_highlightsFloatingUI_);
                            // void _highlightsContainer.offsetWidth; // trigger layout, otherwise max-content not resolved inside timeout!

                            // const cssx = win.getComputedStyle(_highlightsFloatingUI_);
                            // console.log("cssxText", cssx.cssText);
                            // console.log("width/height", cssx.width, cssx.height);
                        }

                        const arrowLen = doDrawArrow ? _highlightsFloatingUI_ARROW.offsetWidth : 0;
                        const floatingOffset = doDrawArrow ? (Math.sqrt(2 * arrowLen ** 2) / 2) : 0;

                        // const { x: fuix, y: fuiy } = await
                        computePosition(anchor || virtualElement, paginated ? _highlightsFloatingUI_! as unknown as HTMLElement : _highlightsFloatingUI, {
                            strategy: paginated ? "fixed" : "absolute",
                            // strategy: "absolute",
                            placement: "bottom",
                            // inline({x, y})
                            middleware:
                                [
                                    // floatingUIMiddleware,
                                    offsetFloat(floatingOffset),
                                    flip(),
                                    shift({ padding: 4 }),
                                    doDrawArrow ? arrow({padding: 8, element: _highlightsFloatingUI_ARROW}) : undefined,
                                ].filter((v) => !!v),
                                // paginated ?
                                // [floatingUIMiddleware, offsetFloat(floatingOffset), flip(), shift({ padding: 4 }), arrow({padding: 0, element: _highlightsFloatingUI_ARROW})] :
                                // [floatingUIMiddleware, offsetFloat(floatingOffset), flip(), shift({ padding: 4 }), arrow({padding: 0, element: _highlightsFloatingUI_ARROW})],
                        })
                        // ;
                        .then(({ x: fuix, y: fuiy, middlewareData, placement }) => {
                            if (doDrawArrow && middlewareData.arrow && _highlightsFloatingUI_ARROW) {
                                const side = placement.split("-")[0];
                                const staticSide = {
                                    top: "bottom",
                                    right: "left",
                                    bottom: "top",
                                    left: "right",
                                }[side];
                                console.log("middlewareData.arrow", middlewareData.arrow.x, middlewareData.arrow.y);
                                const {x: xarrow, y: yarrow} = middlewareData.arrow;
                                if (xarrow != null || yarrow != null) { // NOT DOUBLE EQUAL! (not just null, undefined too)

                                    // const xxxarrow = xarrow != null ? (paginated ? (xarrow - xOffset) * zoom : xarrow) : null;
                                    // const yyyarrow = yarrow != null ? (paginated ? (yarrow - yOffset) * zoom : yarrow) : null;
                                    // Object.assign(_highlightsFloatingUI_ARROW.style, {
                                    //     left: xxxarrow != null ? `${xxxarrow}px` : undefined,
                                    //     top: yyyarrow != null ?  `${yyyarrow}px` : undefined,
                                    // });

                                    Object.assign(_highlightsFloatingUI_ARROW.style, {
                                        left: xarrow != null ? `${xarrow}px` : "",
                                        top: yarrow != null ?  `${yarrow}px` : "",
                                        right: "",
                                        bottom: "",
                                        [staticSide!]: `${-arrowLen / 2}px`,
                                        transform: staticSide === "top" ? "rotate(45deg)" : "rotate(225deg)",
                                    });
                                }
                            }

                            // const xx = x / z;
                            // const yy = y / z;
                            // const xx = x * z;
                            // const yy = y * z;

                            // const xOffset = paginated ? (-scrollElement.scrollLeft) : bodyRect.left;
                            // const yOffset = paginated ? (-scrollElement.scrollTop) : bodyRect.top;

                            const xx = paginated ? (fuix - xOffset) * zoom : fuix;
                            const yy = paginated ? (fuiy - yOffset) * zoom : fuiy;

                            // const xx = fuix;
                            // const yy = fuiy;

                            // const xx = paginated ? (x - xOffset) : x;
                            // const yy = paginated ? (y - yOffset) : y;
                            // const xx = paginated || win.READIUM2.isFixedLayout ?
                            //     (x - xOffset * zoom) * scale :
                            //     x;
                            // const yy = paginated || win.READIUM2.isFixedLayout ?
                            //     (y - yOffset * zoom) * scale :
                            //     y;

                            // console.log(" >>>> ");
                            // console.log("fuix, fuiy", fuix, fuiy);
                            // console.log("xx, yy", xx, yy);
                            // console.log(" >>>> ");

                            // if (_timeoutMouseMove) {
                            //     clearTimeout(_timeoutMouseMove);
                            //     _timeoutMouseMove = undefined;
                            // }
                            // _timeoutMouseMove = win.setTimeout(() => {
                            //     _timeoutMouseMove = undefined;
                            //     win.requestAnimationFrame(() => {
                            if (_highlightsFloatingUI) {
                                Object.assign(_highlightsFloatingUI.style, {
                                    display: "block",
                                    left: `${xx}px`,
                                    top: `${yy}px`,
                                    opacity: "1",
                                    // zoom: "1",
                                });
                            }
                            //     });
                            // }, TIMEOUT_MOUSE_MS);

                            // if (_highlightsFloatingUI_) {
                            //     Object.assign(_highlightsFloatingUI_.style, {
                            //         display: "block",
                            //         left: `${xx}px`,
                            //         top: `${yy}px`,
                            //     });
                            // }

                            if (_highlightsFloatingUI_) { // implies paginated
                                _highlightsFloatingUI_.remove();
                            }
                        });
                    } else {
                        const xx = (x - xOffset) * scale;
                        const yy = (y - yOffset) * scale;

                        // if (_timeoutMouseMove) {
                        //     clearTimeout(_timeoutMouseMove);
                        //     _timeoutMouseMove = undefined;
                        // }
                        // _timeoutMouseMove = win.setTimeout(() => {
                        //     _timeoutMouseMove = undefined;
                            // if (_highlightsFloatingUI) {
                                Object.assign(_highlightsFloatingUI.style, {
                                    display: "block",
                                    left: `${xx * zoom}px`,
                                    top: `${yy * zoom}px`,
                                    opacity: "1",
                                });
                            // }
                        // }, TIMEOUT_MOUSE_MS);
                    }
                    // });
                }

                // });
                }, TIMEOUT_MOUSE_MS);
            }
        } else if ((ev.type === "mouseup" || ev.type === "click") && foundHighlight.group !== HIGHLIGHT_GROUP_PAGEBREAK) {
            // documant.documentElement.classList.remove(CLASS_HIGHLIGHT_CURSOR1);
            documant.documentElement.classList.remove(CLASS_HIGHLIGHT_CURSOR2);

            const _highlightsFloatingUI = win.document.getElementById(ID_HIGHLIGHTS_FLOATING);
            if (_highlightsFloatingUI && _highlightsFloatingUI.style.display !== "none") {
                _highlightsFloatingUI.style.display = "none";
            }

            ev.preventDefault();
            ev.stopPropagation();

            const payload: IEventPayload_R2_EVENT_HIGHLIGHT_CLICK = {
                highlight: foundHighlight,
                event: {
                    type: ev.type,
                    button: ev.button,
                    alt: ev.altKey,
                    shift: ev.shiftKey,
                    ctrl: ev.ctrlKey,
                    meta: ev.metaKey,
                    x: ev.clientX,
                    y: ev.clientY,
                },
            };
            ipcRenderer.sendToHost(R2_EVENT_HIGHLIGHT_CLICK, payload);
        }
    } else {
        const _highlightsFloatingUI = win.document.getElementById(ID_HIGHLIGHTS_FLOATING);
        if (_highlightsFloatingUI && _highlightsFloatingUI.style.display !== "none") {
            _highlightsFloatingUI.style.display = "none";
        }
    }
}

const computeInverseZoom = (bodyComputedStyle: CSSStyleDeclaration, rootComputedStyle: CSSStyleDeclaration): number => {
    let zoomStr = rootComputedStyle.zoom;
    // console.log("rootComputedStyle.zoom", rootComputedStyle.zoom);
    if (!zoomStr || zoomStr === "1") {
        zoomStr = bodyComputedStyle.zoom;
        // console.log("bodyComputedStyle.zoom", bodyComputedStyle.zoom);
    }
    if (zoomStr) {
        const zoomFactor = parseFloat(zoomStr);
        // console.log("zoomFactor", zoomFactor);
        if (zoomFactor !== 0) {
            const inverseZoom = 1 / zoomFactor;
            // console.log("inverseZoom", inverseZoom);
            return inverseZoom;
        }
    }
    return 1;
};

function ensureHighlightsContainer(win: ReadiumElectronWebviewWindow, _bodyComputedStyle: CSSStyleDeclaration, _rootComputedStyle: CSSStyleDeclaration): HTMLElement {
    const documant = win.document;

    if (!_highlightsContainer) {

        // Note that legacy ResizeSensor sets body position to "relative" (default static).
        // Also note that ReadiumCSS default to (via stylesheet :root):
        // documant.documentElement.style.position = "relative";
        // see styles.js (static CSS injection):
        // documant.documentElement.style.setProperty("height", "100vh", "important");
        // documant.body.style.position = "relative";
        // documant.body.style.setProperty("position", "relative", "important");
        // documant.body.style.height = "inherit";
        // https://github.com/edrlab/thorium-reader/issues/1658

        if (!bodyEventListenersSet) {
            bodyEventListenersSet = true;

            // reminder: mouseenter/mouseleave do not bubble, so no event delegation
            // documant.body.addEventListener("click", (ev: MouseEvent) => {
            //     processMouseEvent(win, ev);
            // }, false);
            documant.body.addEventListener("mousedown", (ev: MouseEvent) => {
                lastMouseDownX = ev.clientX;
                lastMouseDownY = ev.clientY;
            }, false);
            documant.body.addEventListener("mouseup", (ev: MouseEvent) => {
                if ((Math.abs(lastMouseDownX - ev.clientX) < 3) &&
                    (Math.abs(lastMouseDownY - ev.clientY) < 3)) {
                    processMouseEvent(win, ev);
                }
            }, false);
            documant.body.addEventListener("mousemove", (ev: MouseEvent) => {

                // if (_highlightsFloatingUI && _highlightsFloatingUI.style.display !== "none") {
                //     _highlightsFloatingUI.style.display = "none";
                // }

                // if (_timeoutMouseMove) {
                //     clearTimeout(_timeoutMouseMove);
                //     _timeoutMouseMove = undefined;
                // }
                // _timeoutMouseMove = win.setTimeout(() => {
                //     _timeoutMouseMove = undefined;
                    processMouseEvent(win, ev);
                // }, TIMEOUT_MOUSE_MS);

            }, false);
        }

        const _highlightsContainer_ = documant.createElement("div");
        _highlightsContainer_.setAttribute("aria-hidden", "true");
        _highlightsContainer_.setAttribute("id", ID_HIGHLIGHTS_CONTAINER);
        _highlightsContainer_.setAttribute("class", CLASS_HIGHLIGHT_COMMON);
        _highlightsContainer_.setAttribute("style",
            // auto fails in some FXL! (Anna's_Day_of_Gratitude_ePUB3_Audio)
            `width: ${win.READIUM2.isFixedLayout ? "-webkit-fill-available" : "auto"} !important; ` +
            `height: ${win.READIUM2.isFixedLayout ? "-webkit-fill-available" : "auto"} !important; `);

        const _highlightsFloatingUI = documant.createElement("div");
        _highlightsFloatingUI.setAttribute("id", ID_HIGHLIGHTS_FLOATING);

        const _highlightsFloatingUI_ARROW = documant.createElement("div");
        // _highlightsFloatingUI_ARROW.style.position = "absolute";
        _highlightsFloatingUI.append(_highlightsFloatingUI_ARROW);

        const _highlightsFloatingUI_TEXT = documant.createElement("div");
        _highlightsFloatingUI.append(_highlightsFloatingUI_TEXT);

        _highlightsContainer_.append(_highlightsFloatingUI);

        documant.body.append(_highlightsContainer_);

        _highlightsContainer = _highlightsContainer_;

        // _highlightsFloatingUI_ = documant.createElementNS(SVG_XML_NAMESPACE, "svg") as SVGElement;
        // // _highlightsFloatingUI_ = win.document.createElement("svg");
        // _highlightsFloatingUI_.setAttribute("id", ID_HIGHLIGHTS_FLOATING + "_");
        // _highlightsContainer.append(_highlightsFloatingUI_);
    }

    // const inverseZoom = computeInverseZoom(bodyComputedStyle, rootComputedStyle);
    // if (_highlightsFloatingUI_) {
    //     _highlightsFloatingUI_.style.zoom = `${1/inverseZoom}`;
    // }

    // console.log("_highlightsContainer.style.zoom BEFORE", _highlightsContainer.style.zoom);
    // const inverseZoom = computeInverseZoom(bodyComputedStyle, rootComputedStyle);
    // _highlightsContainer.style.zoom = `${inverseZoom}`;
    // console.log("_highlightsContainer.style.zoom AFTER", _highlightsContainer.style.zoom);
    return _highlightsContainer;
}

export function hideAllhighlights(_documant: Document) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- hideAllhighlights: " + _highlights.length);
    }

    if (ENABLE_CSS_HIGHLIGHTS) {
        CSS.highlights.clear();
    }

    if (_highlightsContainer) {
        _highlightsContainer.remove();
        _highlightsContainer = undefined;
        // ensureHighlightsContainer(documant); LAZY
    }
}

export function destroyAllhighlights(documant: Document) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- destroyAllhighlights: " + _highlights.length);
    }
    hideAllhighlights(documant);
    _highlights.splice(0, _highlights.length);
}

export function destroyHighlight(documant: Document, id: string) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- destroyHighlight: " + id + " ... " + _highlights.length);
    }
    let i = -1;
    const highlight = _highlights.find((h, j) => {
        i = j;
        return h.id === id;
    });
    if (highlight && i >= 0 && i < _highlights.length) {
        _highlights.splice(i, 1);
    }

    const highlightContainer = documant.getElementById(id);
    if (highlightContainer) {
        highlightContainer.remove();
    }

    if (ENABLE_CSS_HIGHLIGHTS && highlight && highlight.rangeCssHighlight) {
        const [_strRGB, cssHighlightID] = computeCssHighlightRGBID(highlight);

        const cssHighlight = CSS.highlights.get(cssHighlightID);
        if (cssHighlight && cssHighlight.has(highlight.rangeCssHighlight)) {
            cssHighlight.delete(highlight.rangeCssHighlight);
        }
    }
}

export function destroyHighlightsGroup(documant: Document, group: string) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- destroyHighlightsGroup: " + group + " ... " + _highlights.length);
    }
    while (true) {
        let i = -1;
        const highlight = _highlights.find((h, j) => {
            i = j;
            return h.group === group;
        });
        if (highlight) {
            if (i >= 0 && i < _highlights.length) {
                _highlights.splice(i, 1);
            }

            const highlightContainer = documant.getElementById(highlight.id);
            if (highlightContainer) {
                highlightContainer.remove();
            }

            if (ENABLE_CSS_HIGHLIGHTS && highlight.rangeCssHighlight) {
                const [_strRGB, cssHighlightID] = computeCssHighlightRGBID(highlight);

                const cssHighlight = CSS.highlights.get(cssHighlightID);
                if (cssHighlight && cssHighlight.has(highlight.rangeCssHighlight)) {
                    cssHighlight.delete(highlight.rangeCssHighlight);
                }
            }
        } else {
            break;
        }
    }
}

export function recreateAllHighlightsRaw(win: ReadiumElectronWebviewWindow, highlights?: IHighlight[]) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- recreateAllHighlightsRaw: " + _highlights.length + " ==> " + highlights?.length);
    }

    const documant = win.document;

    if (highlights?.length) {
        if (_highlights.length) {
            if (IS_DEV) {
                console.log("--HIGH WEBVIEW-- recreateAllHighlightsRaw DESTROY OLD BEFORE RESTORE BACKUP: " + _highlights.length + " ==> " + highlights.length);
            }
            destroyAllhighlights(documant);
        }
        if (IS_DEV) {
            console.log("--HIGH WEBVIEW-- recreateAllHighlightsRaw RESTORE BACKUP: " + _highlights.length + " ==> " + highlights.length);
        }
        _highlights.push(...highlights);
    }

    if (!_highlights.length) {
        return;
    }

    if (!documant.body) {
        if (IS_DEV) {
            console.log("--HIGH WEBVIEW-- NO BODY?! (retrying...): " + _highlights.length);
        }
        recreateAllHighlightsDebounced(win);
        return;
    }

    hideAllhighlights(documant);

    const bodyRect = getBoundingClientRectOfDocumentBody(win);
    const rootComputedStyle = win.getComputedStyle(documant.documentElement);
    const bodyComputedStyle = win.getComputedStyle(documant.body);

    const docFrag = documant.createDocumentFragment();
    for (const highlight of _highlights) {

        const r = adjustRangeInfo(win, highlight.range, highlight.selectionInfo);
        if (r) {
            highlight.range = r;
        } else if (r === null) {
            // NOOP
        } else if (typeof r === "undefined") {
            continue;
        }

        let div: HTMLDivElement | null | undefined;
        try {
            div = createHighlightDom(win, highlight, bodyRect, bodyComputedStyle, rootComputedStyle);
        } catch (err) {
            console.log("createHighlightDom ERROR:");
            console.log(err);
        }
        if (div) {
            // if (IS_DEV) {
            //     console.log("--HIGH WEBVIEW-- createHighlightDom DIV done: " + _highlights.length);
            // }
            docFrag.append(div);
        }
    }
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- createHighlightDom DONE: " + _highlights.length);
    }
    const highlightsContainer = ensureHighlightsContainer(win, bodyComputedStyle, rootComputedStyle);
    highlightsContainer.append(docFrag);
}

export const recreateAllHighlightsDebounced = debounce((win: ReadiumElectronWebviewWindow) => {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- recreateAllHighlightsDebounced: " + _highlights.length);
    }
    recreateAllHighlightsRaw(win);
}, 500);

export function recreateAllHighlights(win: ReadiumElectronWebviewWindow) {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- recreateAllHighlights: " + _highlights.length);
    }
    hideAllhighlights(win.document);
    recreateAllHighlightsDebounced(win);
}

export function createHighlights(
    win: ReadiumElectronWebviewWindow,
    highDefs: IHighlightDefinition[],
    pointerInteraction: boolean): Array<IHighlight | null> {
    if (IS_DEV) {
        console.log("--HIGH WEBVIEW-- createHighlights: " + highDefs.length + " ... " + _highlights.length);
    }

    const documant = win.document;
    const highlights: Array<IHighlight | null> = [];

    const bodyRect = getBoundingClientRectOfDocumentBody(win);
    const rootComputedStyle = win.getComputedStyle(documant.documentElement);
    const bodyComputedStyle = win.getComputedStyle(documant.body);

    const docFrag = documant.createDocumentFragment();
    for (const highDef of highDefs) {
        if (!highDef.selectionInfo && !highDef.range) {
            highlights.push(null);
            continue;
        }
        const hh = createHighlight(
            win,
            highDef.selectionInfo,
            highDef.range,
            highDef.color,
            pointerInteraction,
            highDef.drawType,
            highDef.expand,
            highDef.group,
            highDef.marginText,
            highDef.textPopup,
            bodyRect,
            bodyComputedStyle,
            rootComputedStyle);
        if (hh) {
            highlights.push(hh[0]);
            if (hh[1]) {
                docFrag.append(hh[1]);
            }
        }
    }

    const highlightsContainer = ensureHighlightsContainer(win, bodyComputedStyle, rootComputedStyle);
    highlightsContainer.append(docFrag);

    return highlights;
}

const computeCFI = (node: Node): string | undefined => {

    if (node.nodeType !== Node.ELEMENT_NODE) {
        if (node.parentNode) {
            return computeCFI(node.parentNode);
        }
        return undefined;
    }

    // TODO: unlike preload.ts, no checkBlacklisted()
    // // fast path: static cache
    // // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // if ((node as any).__r2Cfi) {
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     return (node as any).__r2Cfi;
    // }

    let cfi = "";

    let currentElement = node as Element;
    while (currentElement.parentNode && currentElement.parentNode.nodeType === Node.ELEMENT_NODE) {
        const currentElementParentChildren = (currentElement.parentNode as Element).children;
        let currentElementIndex = -1;
        for (let i = 0; i < currentElementParentChildren.length; i++) {
            if (currentElement === currentElementParentChildren[i]) {
                currentElementIndex = i;
                break;
            }
        }
        if (currentElementIndex >= 0) {
            const cfiIndex = (currentElementIndex + 1) * 2;
            cfi = cfiIndex +
                (currentElement.id ? ("[" + currentElement.id + "]") : "") +
                (cfi.length ? ("/" + cfi) : "");
        }
        currentElement = currentElement.parentNode as Element;
    }

    // // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // (node as any).__r2Cfi = "/" + cfi;
    // // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // return (node as any).__r2Cfi;
    return "/" + cfi;
};

const adjustRangeInfo = (win: ReadiumElectronWebviewWindow, range: Range | undefined, selectionInfo: ISelectionInfo | undefined): Range | null | undefined => {

    if ((!range || !range.startContainer) && // IPC object destroy??
        selectionInfo &&
        selectionInfo.rangeInfo.startContainerElementCssSelector === selectionInfo.rangeInfo.endContainerElementCssSelector &&
        selectionInfo.rangeInfo.startContainerChildTextNodeIndex === -1 &&
        selectionInfo.rangeInfo.startOffset === -1 &&
        selectionInfo.rangeInfo.endOffset === -1) {

        console.log("createHighlight EMPTY selectionInfo", JSON.stringify(selectionInfo, null, 4));

        const el = win.document.querySelector(selectionInfo.rangeInfo.startContainerElementCssSelector);
        if (el) {
            console.log("createHighlight EMPTY selectionInfo: ELEMENT match", selectionInfo.rangeInfo.startContainerElementCssSelector);

            // temporarilySelectElementToExtractVisibleRange(win, el);

            // selectionInfo.rangeInfo = {
            //     startContainerElementCssSelector: selectionInfo.rangeInfo.startContainerElementCssSelector,
            //     startContainerElementCFI: undefined,
            //     startContainerElementXPath: undefined,
            //     startContainerChildTextNodeIndex: -1,
            //     startOffset: 0,
            //     endContainerElementCssSelector: selectionInfo.rangeInfo.startContainerElementCssSelector,
            //     endContainerElementCFI: undefined,
            //     endContainerElementXPath: undefined,
            //     endContainerChildTextNodeIndex: -1,
            //     endOffset: 0,
            //     cfi: undefined,
            // };

            let _firstTextNode: Node | undefined;
            // let _firstTextNodeIndex: number | undefined;
            // let _lastTextNode: Node | undefined;
            // let _lastTextNodeIndex: number | undefined;
            const scanTextNodes = (elem: Element) => {
                const lower = elem.tagName.toLowerCase();
                if (elem.getAttribute("id") === ID_HIGHLIGHTS_CONTAINER ||
                    lower === "audio" || lower === "img" || lower === "script" || lower === "noscript") {
                    return;
                }
                for (let i = 0; i < elem.childNodes.length; i++) {
                    const childNode = elem.childNodes[i];
                    if (childNode.nodeType === 1) { // Node.ELEMENT_NODE
                        if (!_firstTextNode) {
                            scanTextNodes(childNode as Element);
                        }
                    } else if (childNode.nodeType === 3 && (childNode.nodeValue?.length || 0) > 0) { // Node.TEXT_NODE
                        let text = childNode.nodeValue?.replace(/\s\s+/g, " ");
                        if (text) {
                            text = text.trim();
                        }
                        if (text && !_firstTextNode) {
                            _firstTextNode = childNode;
                            // _firstTextNodeIndex = i;
                        }
                        // _lastTextNode = childNode;
                        // _lastTextNodeIndex = i;
                    }
                }
            };
            scanTextNodes(el);
            if (_firstTextNode) {
                console.log("createHighlight EMPTY selectionInfo: FIRST TEXT NODE found", _firstTextNode.nodeValue);

                range = new Range(); // document.createRange()
                range.selectNodeContents(_firstTextNode);
                range.setStart(range.startContainer, range.startOffset);
                range.setEnd(range.endContainer, range.startOffset + 1); // range.endOffset
                return range;

                // selectionInfo.rangeInfo = {
                //     startContainerElementCssSelector: selectionInfo.rangeInfo.startContainerElementCssSelector,
                //     startContainerElementCFI: undefined,
                //     startContainerElementXPath: undefined,
                //     startContainerChildTextNodeIndex: _firstTextNodeIndex!,
                //     startOffset: 0,
                //     endContainerElementCssSelector: selectionInfo.rangeInfo.startContainerElementCssSelector,
                //     endContainerElementCFI: undefined,
                //     endContainerElementXPath: undefined,
                //     endContainerChildTextNodeIndex: _firstTextNodeIndex!,
                //     endOffset: 1,
                //     cfi: undefined,
                // };
            } else {
                if (el === win.document.documentElement || el === win.document.body) {
                    console.log("createHighlight EMPTY selectionInfo: FIRST TEXT NODE not found, fallback ELEMENT inside HTML BODY", el.nodeName);

                    let _firstLeafElement: Element | undefined;
                    const scanElementNodes = (elem: Element) => {
                        for (let i = 0; i < elem.childNodes.length; i++) {
                            const childNode = elem.childNodes[i];
                            if (childNode.nodeType === 1) { // Node.ELEMENT_NODE
                                if (!_firstLeafElement && !(childNode as Element).childNodes.length) {
                                    _firstLeafElement = childNode as Element;
                                }
                                if (!_firstLeafElement) {
                                    scanElementNodes(childNode as Element);
                                }
                            }
                        }
                    };
                    scanElementNodes(el);

                    range = new Range(); // document.createRange()
                    if (!win && _firstLeafElement) {
                        console.log("createHighlight EMPTY selectionInfo: fallback ELEMENT first leaf: ", _firstLeafElement.nodeName);
                        range.selectNode(_firstLeafElement);
                    } else {
                        console.log("createHighlight EMPTY selectionInfo: fallback fail: ", el.nodeName);
                        range.selectNodeContents(el);
                    }
                    return range;
                } else {
                    console.log("createHighlight EMPTY selectionInfo: FIRST TEXT NODE not found, fallback ELEMENT", el.nodeName);

                    range = new Range(); // document.createRange()
                    range.selectNode(el);
                    return range;
                }
            }
            // if (_firstTextNode && _lastTextNode) {
            //     selectionInfo.rangeInfo = {
            //         startContainerElementCssSelector: selectionInfo.rangeInfo.startContainerElementCssSelector,
            //         startContainerElementCFI: undefined,
            //         startContainerElementXPath: undefined,
            //         startContainerChildTextNodeIndex: _firstTextNodeIndex!,
            //         startOffset: 0,
            //         endContainerElementCssSelector: selectionInfo.rangeInfo.startContainerElementCssSelector,
            //         endContainerElementCFI: undefined,
            //         endContainerElementXPath: undefined,
            //         endContainerChildTextNodeIndex: _lastTextNodeIndex!,
            //         // endOffset: (_lastTextNode.nodeValue?.length || 1) - 1,
            //         endOffset: _lastTextNode.nodeValue?.length || 0,
            //         cfi: undefined,
            //     };
            // }

            // console.log("createHighlight selectionInfo.rangeInfo", JSON.stringify(selectionInfo.rangeInfo, null, 4));

            // const rangeInfo = convertRange(range, getCssSelector, computeElementCFI, computeElementXPath)
            // selectionInfo.rangeInfo = rangeInfo;
        } else {
            console.log("createHighlight EMPTY selectionInfo: ELEMENT NOT match", selectionInfo.rangeInfo.startContainerElementCssSelector);
            return undefined;
        }
    }

    return null;
};

export function createHighlight(
    win: ReadiumElectronWebviewWindow,
    selectionInfo: ISelectionInfo | undefined,
    range: Range | undefined,
    color: IColor | undefined,
    pointerInteraction: boolean,
    drawType: number | undefined,
    expand: number | undefined,
    group: string | undefined,
    marginText: string | undefined,
    textPopup: ITextPopup | undefined,
    bodyRect: DOMRect,
    bodyComputedStyle: CSSStyleDeclaration,
    rootComputedStyle: CSSStyleDeclaration): [IHighlight, HTMLDivElement | null] | undefined {

    // tslint:disable-next-line:no-string-literal
    // console.log("Chromium: " + process.versions["chrome"]);

    // range = range ? range : selectionInfo ? convertRangeInfo(win.document, selectionInfo.rangeInfo) : undefined;

    const r = adjustRangeInfo(win, range, selectionInfo);
    if (r) {
        range = r;
    } else if (r === null) {
        // NOOP
    } else if (typeof r === "undefined") {
        return undefined;
    }

    const uniqueStr = selectionInfo ? `${selectionInfo.rangeInfo.startContainerElementCssSelector}${selectionInfo.rangeInfo.startContainerChildTextNodeIndex}${selectionInfo.rangeInfo.startOffset}${selectionInfo.rangeInfo.endContainerElementCssSelector}${selectionInfo.rangeInfo.endContainerChildTextNodeIndex}${selectionInfo.rangeInfo.endOffset}` : range ? `${range.startOffset}-${range.endOffset}-${computeCFI(range.startContainer)}-${computeCFI(range.endContainer)}` : "_RANGE_"; // ${selectionInfo.rangeInfo.cfi} useless

    // console.log("RANGE uniqueStr: " + uniqueStr + " (( " + range?.toString());

    // const unique = Buffer.from(JSON.stringify(selectionInfo.rangeInfo, null, "")).toString("base64");
    // const unique = Buffer.from(uniqueStr).toString("base64");
    // const id = "R2_HIGHLIGHT_" + unique.replace(/\+/, "_").replace(/=/, "-").replace(/\//, ".");
    const checkSum = crypto.createHash("sha1"); // sha256 slow
    checkSum.update(uniqueStr);
    const shaHex = checkSum.digest("hex");
    const idBase = "R2_HIGHLIGHT_" + shaHex;
    let id = idBase;
    let idIdx = 0;
    while (
        _highlights.find((h) => h.id === id) ||
        win.document.getElementById(id)) {

        if (IS_DEV) {
            console.log("HIGHLIGHT ID already exists, increment: " + uniqueStr + " ==> " + id);
        }
        id = `${idBase}_${idIdx++}`;
    }

    const highlight: IHighlight = {
        color: color ? color : DEFAULT_BACKGROUND_COLOR,
        drawType,
        expand,
        id,
        pointerInteraction,
        selectionInfo,
        range,
        group,
        marginText,
        textPopup,
    };
    _highlights.push(highlight);

    let div: HTMLDivElement | null | undefined;
    try {
        div = createHighlightDom(win, highlight, bodyRect, bodyComputedStyle, rootComputedStyle);
    } catch (err) {
        console.log("createHighlightDom ERROR:");
        console.log(err);
    }

    return [highlight, div || null];
}

const computeCssHighlightRGBID = (highlight: IHighlight) => {
    // const drawBackground = !highlight.drawType || highlight.drawType === HighlightDrawTypeBackground;
    const drawUnderline = highlight.drawType === HighlightDrawTypeUnderline;
    const drawStrikeThrough = highlight.drawType === HighlightDrawTypeStrikethrough;
    // const drawOutline = highlight.drawType === HighlightDrawTypeOutline;

    const strRGB = `R${highlight.color.red}G${highlight.color.green}B${highlight.color.blue}${drawUnderline ? "_" : drawStrikeThrough ? "__" : ""}`;
    const cssHighlightID = `highlight_${strRGB}`;
    return [ strRGB, cssHighlightID ];
};

const calcRGB = (rgb: number) => {
    return (rgb <= 0.03928) ? rgb / 12.92 : ((rgb + 0.055) / 1.055) ** 2.4;
};
const computeHighContrastForegroundColourForBackground = (color: IColor) => {
    let foregroundColour = "#ffffff";
    const red = calcRGB(color.red);
    const green = calcRGB(color.green);
    const blue = calcRGB(color.blue);
    // sRGB Luma (ITU Rec. 709) https://en.wikipedia.org/wiki/Rec._709
    const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    const pickBlack = (luminance + 0.05) / 0.05;
    const pickWhite = 1.05 / (luminance + 0.05);
    if (pickBlack > pickWhite) {
        foregroundColour = "#000000";
    }
    return foregroundColour;
};

const JAPANESE_RUBY_TO_SKIP = ["rt", "rp"];
function createHighlightDom(
    win: ReadiumElectronWebviewWindow,
    highlight: IHighlight,
    bodyRect: DOMRect,
    bodyComputedStyle: CSSStyleDeclaration,
    rootComputedStyle: CSSStyleDeclaration): HTMLDivElement | null {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DEBUG_RECTS = (window as any).DEBUG_RECTS;

    const documant = win.document;
    const scrollElement = getScrollingElement(documant);

    const range = highlight.range ? highlight.range : highlight.selectionInfo ? convertRangeInfo(documant, highlight.selectionInfo.rangeInfo) : undefined;
    if (!range) {
        return null;
    }

    // win.READIUM2 && win.READIUM2.isFixedLayout
    let rangeHasSVG = false;
    let parent: Node | null = range.startContainer;
    while (parent) {
        if (parent.nodeType === Node.ELEMENT_NODE) {
            const ns = (parent as Element).namespaceURI;
            if (ns && ns.includes("svg")) {
                rangeHasSVG = true;
                break;
            }
        }
        parent = parent.parentNode;
    }
    if (!rangeHasSVG) {
        parent = range.endContainer;
        while (parent) {
            if (parent.nodeType === Node.ELEMENT_NODE) {
                const ns = (parent as Element).namespaceURI;
                if (ns && ns.includes("svg")) {
                    rangeHasSVG = true;
                    break;
                }
            }
            parent = parent.parentNode;
        }
    }
    // highlight.rangeHasSVG = rangeHasSVG;

    const drawBackground = !highlight.drawType || highlight.drawType === HighlightDrawTypeBackground;
    const drawUnderline = highlight.drawType === HighlightDrawTypeUnderline;
    const drawStrikeThrough = highlight.drawType === HighlightDrawTypeStrikethrough;
    const drawOutline = highlight.drawType === HighlightDrawTypeOutline;
    const drawOpacityMask = highlight.drawType === HighlightDrawTypeOpacityMask;
    const drawOpacityMaskRuler = highlight.drawType === HighlightDrawTypeOpacityMaskRuler;
    const drawMarginBookmark = highlight.drawType === HighlightDrawTypeMarginBookmark;

    const paginated = isPaginated(documant);

    const rtl = isRTL();
    const isVWM = isVerticalWritingMode();

    const doDrawMargin = drawMargin(highlight);

    const inverseZoom = computeInverseZoom(bodyComputedStyle, rootComputedStyle);

    const underlineThickness = 3 / inverseZoom;
    const strikeThroughLineThickness = 3 / inverseZoom;

    if (ENABLE_CSS_HIGHLIGHTS && !doDrawMargin && !rangeHasSVG && (drawBackground || (drawUnderline && !isVWM) || (drawStrikeThrough && !isVWM))) {
        highlight.rangeCssHighlight = range;

        const [strRGB, cssHighlightID] = computeCssHighlightRGBID(highlight);
        const styleElement = win.document.getElementById("Readium2-" + strRGB);
        if (!styleElement) {
            const foregroundColour = computeHighContrastForegroundColourForBackground(highlight.color);

            // window.CSS.registerProperty({
            //     name: `--${strRGB}`,
            //     syntax: "<color>",
            //     inherits: true,
            //     initialValue: "transparent",
            // });
            appendCSSInline(win.document, strRGB,
                drawUnderline || drawStrikeThrough
?
// -webkit-text-stroke-color: rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue});
// -webkit-text-fill-color: rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue});
// -webkit-text-stroke-width: ${drawUnderline ? underlineThickness : drawStrikeThrough ? strikeThroughLineThickness : underlineThickness}px;

//text-decoration-thickness: ${drawUnderline ? underlineThickness : drawStrikeThrough ? strikeThroughLineThickness : underlineThickness}px;
`
::highlight(${cssHighlightID}) {
    text-decoration-color: rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue});
    text-decoration-style: solid;
    text-decoration-thickness: ${0.16 / inverseZoom}em;
    text-decoration-line: ${drawUnderline ? "underline" : "line-through"};
}
`
:
// :root > body#body, :root[style] > body#body { background-color: magenta !important; }

// @property --${strRGB} {
// syntax: "<color>";
// inherits: true;
// initial-value: transparent;
// }

// would prefer to use CSS properties but worked in Electron 30, broke in 31 and 32!
// :root { --${strRGB}: rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}); }

// text-decoration
// text-shadow
// -webkit-text-stroke-color
// -webkit-text-fill-color
// -webkit-text-stroke-width
`
::highlight(${cssHighlightID}) {
    background-color: rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue});
    color: ${foregroundColour};
}
@supports (color: contrast-color(red)) {

    ::highlight(${cssHighlightID}) {
        background-color: rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue});

        color: contrast-color(rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}));
        text-shadow: none;
    }
}
`);

// https://github.com/edrlab/thorium-reader/issues/2586
/*
https://lea.verou.me/blog/2024/contrast-color
https://blackorwhite.lloydk.ca
*/
/*
::highlight(${cssHighlightID}) {
    background-color: rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue});

    color: white;
    text-shadow: 0 0 .05em black, 0 0 .05em black, 0 0 .05em black, 0 0 .05em black;
}

@supports (color: oklch(from red l c h)) {

    ::highlight(${cssHighlightID}) {
        background-color: rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue});

        color: oklch(from rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}) clamp(0, (0.7 / l - 1) * infinity, 1) c h);

        text-shadow: none;
    }
}

@supports (color: oklch(from color-mix(in oklch, red, tan) l c h)) {

    ::highlight(${cssHighlightID}) {
        background-color: rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue});

        color: color(from rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue}) xyz-d65 clamp(0, (0.36 / y - 1) * infinity, 1) clamp(0, (0.36 / y - 1) * infinity, 1) clamp(0, (0.36 / y - 1) * infinity, 1));

        text-shadow: none;
    }
}
*/
        }

        let cssHighlight = CSS.highlights.get(cssHighlightID);
        if (!cssHighlight) {
            cssHighlight = new Highlight();
            CSS.highlights.set(cssHighlightID, cssHighlight);
        }

        cssHighlight.add(highlight.rangeCssHighlight);
    }

    // checkRangeFix(documant);

    // const highlightsContainer = ensureHighlightsContainer(win);

    const highlightParent = documant.createElement("div") as IHTMLDivElementWithRect;
    highlightParent.setAttribute("id", highlight.id);
    highlightParent.setAttribute("class", `${CLASS_HIGHLIGHT_CONTAINER} ${CLASS_HIGHLIGHT_COMMON}`);
    highlightParent.setAttribute("data-type", `${highlight.drawType || HighlightDrawTypeBackground}`);
    if (highlight.group) {
        highlightParent.setAttribute("data-group", highlight.group);
    }
    if (doDrawMargin) {
        // highlightParent.setAttribute("data-margin", "true");
        highlightParent.classList.add(CLASS_HIGHLIGHT_MARGIN);
    }

    // highlightParent.dataset.zoom
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (highlightParent as any).__inverseZoom = inverseZoom;

    // const styleAttr = win.document.documentElement.getAttribute("style");
    // const isNight = styleAttr ? styleAttr.indexOf("readium-night-on") > 0 : false;
    // const isSepia = styleAttr ? styleAttr.indexOf("readium-sepia-on") > 0 : false;

    // export const HighlightDrawTypeBackground = 0;
    // export const HighlightDrawTypeUnderline = 1;
    // export const HighlightDrawTypeStrikethrough = 2;
    // export const HighlightDrawTypeOutline = 3;
    if (drawBackground) {
        // highlightParent.style.setProperty(
        //     "mix-blend-mode",
        //     // isNight ? "hard-light" :
        //     "multiply",
        //     "important");
        // highlightParent.style.setProperty(
        //     "z-index",
        //     "-1");
        highlightParent.classList.add(CLASS_HIGHLIGHT_BEHIND);
    }
    if (
        // !doDrawMargin &&
        (drawOpacityMask || drawOpacityMaskRuler)
    ) {
        highlightParent.classList.add(CLASS_HIGHLIGHT_MASK);
    }

    // TTS solid background highlights don't need SVG polygons,
    // no mouse cursor hit testing, just CSS highlights rendering
    if (
        !highlight.pointerInteraction &&
        (
            highlight.rangeCssHighlight
            // ||
            // (drawOpacityMask && highlight.group === HIGHLIGHT_GROUP_TTS)
        )
    ) {
        return highlightParent;
    }

    // const docStyle = (documant.defaultView as Window).getComputedStyle(documant.documentElement);
    // const bodyStyle = (documant.defaultView as Window).getComputedStyle(documant.body);
    // const marginLeft = bodyStyle.getPropertyValue("margin-left");
    // console.log("marginLeft: " + marginLeft);
    // const marginTop = bodyStyle.getPropertyValue("margin-top");
    // console.log("marginTop: " + marginTop);

    // console.log("==== bodyRect:");
    // console.log("width: " + bodyRect.width);
    // console.log("height: " + bodyRect.height);
    // console.log("top: " + bodyRect.top);
    // console.log("bottom: " + bodyRect.bottom);
    // console.log("left: " + bodyRect.left);
    // console.log("right: " + bodyRect.right);

    // const xOffset = paginated ? (bodyRect.left - parseInt(marginLeft, 10)) : bodyRect.left;
    // const yOffset = paginated ? (bodyRect.top - parseInt(marginTop, 10)) : bodyRect.top;

    const xOffset = paginated ? (-scrollElement.scrollLeft) : bodyRect.left;
    const yOffset = paginated ? (-scrollElement.scrollTop) : bodyRect.top;

    // const scale = 1 / ((win.READIUM2 && win.READIUM2.isFixedLayout) ? win.READIUM2.fxlViewportScale : 1);
    const scale = 1;

    // console.log("scrollElement.scrollLeft: " + scrollElement.scrollLeft);
    // console.log("scrollElement.scrollTop: " + scrollElement.scrollTop);

    const doNotMergeHorizontallyAlignedRects = drawUnderline || drawStrikeThrough;

    let clientRects: IRect[] | undefined;

    const rangeClientRects = DOMRectListToArray(range.getClientRects());

    if (doNotMergeHorizontallyAlignedRects) {
        // non-solid highlight (underline or strikethrough), cannot merge and reduce/simplify client rectangles much due to importance of line-level decoration (must preserve horizontal/vertical line heights)

        // Japanese Ruby ... ugly hack, TODO extract logic elsewhere!? TODO only TTS? (annotations and search could be problematic if only Ruby RT/RP match? ... but search already excludes Ruby, and mouse text selection makes it hard/impossible to select Ruby upperscript, so...)
        // highlight.group === HIGHLIGHT_GROUP_TTS ? JAPANESE_RUBY_TO_SKIP : undefined
        const textClientRects = getTextClientRects(range,
            // highlight.group === HIGHLIGHT_GROUP_TTS ? undefined : JAPANESE_RUBY_TO_SKIP
            JAPANESE_RUBY_TO_SKIP,
        );

        const textReducedClientRects = getClientRectsNoOverlap(textClientRects, true, isVWM, highlight.expand ? highlight.expand : 0);

        clientRects = (DEBUG_RECTS && drawStrikeThrough) ? textClientRects : textReducedClientRects;

        // const rangeReducedClientRects = getClientRectsNoOverlap(rangeClientRects, false, vertical, 0);

        // // const rangeUnionPolygon = rangeReducedClientRects.reduce((previous, current) => unify(previous, new Polygon(new Box(current.left, current.top, current.left + current.width, current.top + current.height))), new Polygon());

        // // Array.from(rangeUnionPolygon.faces).forEach((face: Face) => {
        // //     if (face.orientation() !== BASE_ORIENTATION) {
        // //         if (DEBUG_RECTS) {
        // //             console.log("--HIGH WEBVIEW-- removing polygon orientation face / inner hole (text range))");
        // //         }
        // //         polygonCountourUnionPoly.deleteFace(face);
        // //     }
        // // });

        // const textReducedClientRectsToKeep: IRect[] = [];
        // textReducedClientRectsToKeep.push(...textReducedClientRects);

        // for (const rect of textReducedClientRects) {
        //     console.log("__RECT__ text :: " + `TOP:${rect.top} BOTTOM:${rect.bottom} LEFT:${rect.left} RIGHT:${rect.right} WIDTH:${rect.width} HEIGHT:${rect.height}`);

        //     let intersections: IRect[] | undefined;
        //     for (const rectRange of rangeReducedClientRects) {
        //         console.log("__RECT__ range :: " + `TOP:${rect.top} BOTTOM:${rect.bottom} LEFT:${rect.left} RIGHT:${rect.right} WIDTH:${rect.width} HEIGHT:${rect.height}`);
        //         const rectIntersection = rectIntersect(rect, rectRange);
        //         const hasIntersection = rectIntersection.width > 0 || rectIntersection.height > 0;
        //         if (!hasIntersection) {
        //             console.log("__RECT__ no intersect");
        //             continue;
        //         }
        //         console.log("__RECT__ intersect :: " + `TOP:${rectIntersection.top} BOTTOM:${rectIntersection.bottom} LEFT:${rectIntersection.left} RIGHT:${rectIntersection.right} WIDTH:${rectIntersection.width} HEIGHT:${rectIntersection.height}`);
        //         if (!intersections) {
        //             intersections = [];
        //         }
        //         intersections.push(rectIntersection);
        //     }

        //     if (!intersections?.length) {
        //         console.log("__RECT__ zero intersect, eject rect");
        //         textReducedClientRectsToKeep.splice(textReducedClientRectsToKeep.indexOf(rect), 1);
        //     } else {
        //         const intersectionsBoundingBox = intersections.reduce((previous, current) => {
        //             if (current === previous) {
        //                 return current;
        //             }
        //             return getBoundingRect(previous, current);
        //         }, intersections[0]);

        //         console.log("__RECT__ intersect bounds :: " + `TOP:${intersectionsBoundingBox.top} BOTTOM:${intersectionsBoundingBox.bottom} LEFT:${intersectionsBoundingBox.left} RIGHT:${intersectionsBoundingBox.right} WIDTH:${intersectionsBoundingBox.width} HEIGHT:${intersectionsBoundingBox.height}`);

        //         if (!rectSame(intersectionsBoundingBox, rect, 2)) {
        //             console.log("__RECT__ rect different than intersect bounds, replace");
        //             textReducedClientRectsToKeep.splice(textReducedClientRectsToKeep.indexOf(rect), 1, intersectionsBoundingBox);
        //         }
        //     }

        //     // const rectPolygon = new Polygon(new Box(rect.left, rect.top, rect.left + rect.width, rect.top + rect.height));

        //     // const poly = intersect(rangeUnionPolygon, rectPolygon);
        //     // const b = poly.box; // shortcut, but we could check polygon faces too

        //     // if (rect.left !== b.xmin || rect.top !== b.ymin || rect.right !== b.xmax || rect.bottom !== b.ymax) {
        //     //     console.log("__RECT__ before" + `TOP:${rect.top} BOTTOM:${rect.bottom} LEFT:${rect.left} RIGHT:${rect.right} WIDTH:${rect.width} HEIGHT:${rect.height}`);

        //     //     rect.left = b.xmin;
        //     //     rect.top = b.ymin;
        //     //     rect.right = b.xmax;
        //     //     rect.bottom = b.ymax;
        //     //     rect.width = b.width;
        //     //     rect.height = b.height;

        //     //     console.log("__RECT__ after" + `TOP:${rect.top} BOTTOM:${rect.bottom} LEFT:${rect.left} RIGHT:${rect.right} WIDTH:${rect.width} HEIGHT:${rect.height}`);
        //     // }
        // }

        // console.log("__RECT__ :: " + textClientRects.length + " ===> " + textReducedClientRectsToKeep.length);

        // clientRects = (DEBUG_RECTS && drawStrikeThrough) ? textClientRects : textReducedClientRectsToKeep;
    } else {
        if (drawMarginBookmark &&
            rangeClientRects.length === 2 &&
            Math.floor(rangeClientRects[0].width) === 0 && // rangeClientRects[0].left === rangeClientRects[0].right
            Math.floor(rangeClientRects[1].width) === 0 // rangeClientRects[1].left === rangeClientRects[1].right
        ) {
            // EDGE CASE (literally): click on blank area right hand side of CSS column (for LTR text)
            rangeClientRects[0].width = 2;
            rangeClientRects[0].left -= 1;
            rangeClientRects[0].right += 1;

            rangeClientRects[1].width = 2;
            rangeClientRects[1].left -= 1;
            rangeClientRects[1].right += 1;
        }
        // solid highlight, can merge and reduce/simplify client rectangles as much as possible
        clientRects = getClientRectsNoOverlap(rangeClientRects, false, isVWM, highlight.expand ? highlight.expand : 0);
    }

    // let highlightAreaSVGDocFrag: DocumentFragment | undefined;

    // const rangeBoundingClientRect = range.getBoundingClientRect();

    const gap = 2;
    const gapX = ((drawOutline || drawBackground) ? 4 : 0);

    const boxesNoGapExpanded = [];
    const boxesGapExpanded = [];

    for (const clientRect of clientRects) {

        const rect = {
            height: clientRect.height,
            left: clientRect.left - xOffset,
            top: clientRect.top - yOffset,
            width: clientRect.width,
        };
        const w = rect.width * scale;
        const h = rect.height * scale;
        const x = rect.left * scale;
        const y = rect.top * scale;

        boxesGapExpanded.push(new Box(
            Number((x - gap).toPrecision(12)),
            Number((y - gap).toPrecision(12)),
            Number((x + w + gap).toPrecision(12)),
            Number((y + h + gap).toPrecision(12)),
        ));

        // boxesNoGapExpanded.push(new Box(
        //     Number((x).toPrecision(12)),
        //     Number((y).toPrecision(12)),
        //     Number((x + w).toPrecision(12)),
        //     Number((y + h).toPrecision(12)),
        // ));

        if (drawStrikeThrough) {

            const thickness = DEBUG_RECTS ? (isVWM ? rect.width : rect.height) : strikeThroughLineThickness;
            const ww = (isVWM ? thickness : rect.width) * scale;
            const hh = (isVWM ? rect.height : thickness) * scale;
            const xx =
            (
            isVWM
            ?
            (
                DEBUG_RECTS
                ?
                rect.left
                :
                (rect.left + (rect.width / 2) - (thickness / 2))
            )
            :
            rect.left
            ) * scale;

            const yy =
            (
            isVWM
            ?
            rect.top
            :
            (
                DEBUG_RECTS
                ?
                rect.top
                :
                (rect.top + (rect.height / 2) - (thickness / 2))
            )
            ) * scale;

            boxesNoGapExpanded.push(new Box(
                Number((xx - gapX).toPrecision(12)),
                Number((yy - gapX).toPrecision(12)),
                Number((xx + ww + gapX).toPrecision(12)),
                Number((yy + hh + gapX).toPrecision(12)),
            ));

        } else { // drawStrikeThrough

            const thickness = DEBUG_RECTS ? (isVWM ? rect.width : rect.height) : underlineThickness;
            if (drawUnderline) {
                const ww = (isVWM ? thickness : rect.width) * scale;
                const hh = (isVWM ? rect.height : thickness) * scale;
                const xx =
                (
                isVWM
                ?
                (
                    DEBUG_RECTS
                    ?
                    rect.left
                    :
                    (rect.left - (thickness + thickness / 2))
                )
                :
                rect.left
                ) * scale;

                const yy =
                (
                isVWM
                ?
                rect.top
                :
                (
                    DEBUG_RECTS
                    ?
                    rect.top
                    :
                    (rect.top + rect.height - (thickness / 2))
                )
                ) * scale;

                boxesNoGapExpanded.push(new Box(
                    Number((xx - gapX).toPrecision(12)),
                    Number((yy - gapX).toPrecision(12)),
                    Number((xx + ww + gapX).toPrecision(12)),
                    Number((yy + hh + gapX).toPrecision(12)),
                ));
            } else {
                boxesNoGapExpanded.push(new Box(
                    Number((x - gapX).toPrecision(12)),
                    Number((y - gapX).toPrecision(12)),
                    Number((x + w + gapX).toPrecision(12)),
                    Number((y + h + gapX).toPrecision(12)),
                ));
            }
        }
    }

    const polygonCountourUnionPoly = boxesGapExpanded.reduce((previousPolygon, currentBox) => {
        const p = new Polygon();
        const f = p.addFace(currentBox);
        if (f.orientation() !== BASE_ORIENTATION) {
            console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 2");
            f.reverse();
        }
        return unify(previousPolygon, p);
    }, new Polygon());

    Array.from(polygonCountourUnionPoly.faces).forEach((face: Face) => {
        if (face.orientation() !== BASE_ORIENTATION) {
            if (DEBUG_RECTS) {
                console.log("--HIGH WEBVIEW-- removing polygon orientation face / inner hole (contour))");
            }
            polygonCountourUnionPoly.deleteFace(face);
        }
    });
    cleanupPolygon(polygonCountourUnionPoly, gap);

    const bodyPaddingLeft = parseInt(bodyComputedStyle.paddingLeft, 10) / inverseZoom;
    const bodyPaddingRight = parseInt(bodyComputedStyle.paddingRight, 10) / inverseZoom;
    const bodyWidth = parseInt(bodyComputedStyle.width, 10) / inverseZoom;
    const bodyHeight = parseInt(bodyComputedStyle.height, 10) / inverseZoom;
    const paginatedTwo = paginated && isTwoPageSpread();
    const paginatedWidth = scrollElement.clientWidth / (paginatedTwo ? 2 : 1);
    const paginatedGap = (paginatedWidth - bodyWidth) / 2;
    const paginatedOffset = paginatedGap + bodyPaddingLeft;

    const useFastBoundingRect = true; // we never union-join the polygons, instead we group possible rectangle bounding boxes together to allow fragmentation across page boundaries
    if (drawOpacityMask || drawOpacityMaskRuler) {
        let boundingRectMaskBase: IRect | IRect[] | undefined;
        const polygonMaskBaseRects: IRect[] = [];

        const bodyRect_: IRect = {
            left:
                win.READIUM2.isFixedLayout
                ?
                0
                :
                (
                rtl
                ?
                (
                    paginated
                    ?
                    -(paginatedGap + paginatedGap + bodyRect.width - (paginatedWidth * (paginatedTwo ? 2 : 1)))
                    :
                    0
                )
                :
                (
                paginated
                ?
                0 // - paginatedGap
                :
                0
                )
                )
            ,
            top: win.READIUM2.isFixedLayout ? 0 : rtl ? 0 : 0,
            width:
                win.READIUM2.isFixedLayout
                ?
                bodyRect.width * scale
                :
                (
                rtl
                ?
                (
                paginated
                ?
                bodyRect.width + paginatedGap + paginatedGap
                :
                bodyRect.width
                )
                :
                (
                paginated
                ?
                bodyRect.width + paginatedGap + paginatedGap
                :
                bodyRect.width
                )
                )
            ,
            height:
                win.READIUM2.isFixedLayout
                ?
                bodyRect.height * scale
                :
                bodyRect.height
            ,
            right: 0,
            bottom: 0,
        };
        bodyRect_.right = bodyRect_.left + bodyRect_.width;
        bodyRect_.bottom = bodyRect_.top + bodyRect_.height;

        boundingRectMaskBase = boundingRectMaskBase ? getBoundingRect(boundingRectMaskBase as IRect, bodyRect_) : bodyRect_;

        polygonMaskBaseRects.push(bodyRect_);

        let polygonMaskBaseUnionPoly: Polygon | undefined;
        if (paginated) {
            const tolerance = 1;
            const groups: Array<{
                x: number,
                boxes: IRect[],
            }> = [];
            for (const r of polygonMaskBaseRects) {
                const group = groups.find((g) => {
                    return !(r.left < (g.x - tolerance) || r.left > (g.x + tolerance));
                });

                if (!group) {
                    groups.push({
                        x: r.left,
                        boxes: [r],
                    });
                } else {
                    group.boxes?.push(r);
                }
            }

            // console.log("XX RECTS: " + polygonMaskBaseRects.length);
            // console.log(JSON.stringify(polygonMaskBaseRects, null, 4));
            // console.log("XX GROUPS: " + groups.length);
            // groups.forEach((g) => console.log(JSON.stringify(g.boxes, null, 4)));

            boundingRectMaskBase = groups.map<IRect>((g) => {
                return g.boxes.reduce((prev, cur) => {
                    if (prev === cur) {
                        return cur;
                    }
                    return getBoundingRect(prev, cur);
                }, g.boxes[0]);
            });
            if (boundingRectMaskBase.length === 1) {
                boundingRectMaskBase = boundingRectMaskBase[0];
            }
        }

        if (useFastBoundingRect) {
            if (boundingRectMaskBase) {
                polygonMaskBaseUnionPoly = new Polygon();
                if (Array.isArray(boundingRectMaskBase)) {
                    for (const b of boundingRectMaskBase) {
                        const f = polygonMaskBaseUnionPoly.addFace(new Box(b.left, b.top, b.right, b.bottom));
                        if (f.orientation() !== BASE_ORIENTATION) {
                            console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 6");
                            f.reverse();
                        }
                    }
                } else {
                    const f = polygonMaskBaseUnionPoly.addFace(new Box(boundingRectMaskBase.left, boundingRectMaskBase.top, boundingRectMaskBase.right, boundingRectMaskBase.bottom));
                    if (f.orientation() !== BASE_ORIENTATION) {
                        console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 7");
                        f.reverse();
                    }
                }
            } else {
                const poly = new Polygon();
                for (const r of polygonMaskBaseRects) {
                    const f = poly.addFace(new Box(r.left, r.top, r.right, r.bottom));
                    if (f.orientation() !== BASE_ORIENTATION) {
                        console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 8");
                        f.reverse();
                    }
                }
                polygonMaskBaseUnionPoly = new Polygon();
                const f = polygonMaskBaseUnionPoly.addFace(poly.box);
                if (f.orientation() !== BASE_ORIENTATION) {
                    console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 9");
                    f.reverse();
                }
            }
        } else {
            polygonMaskBaseUnionPoly = polygonMaskBaseRects.reduce((previousPolygon, r) => {
                const b = new Box(r.left, r.top, r.right, r.bottom);
                const p = new Polygon();
                const f = p.addFace(b);
                if (f.orientation() !== BASE_ORIENTATION) {
                    console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 10");
                    f.reverse();
                }
                return unify(previousPolygon, p);
            }, new Polygon());

            // Array.from(polygonMaskBaseUnionPoly.faces).forEach((face: Face) => {
            //     if (face.orientation() !== BASE_ORIENTATION) {
            //         if (DEBUG_RECTS) {
            //             console.log("--HIGH WEBVIEW-- removing polygon orientation face / inner hole (margin))");
            //         }
            //         (polygonMaskBaseUnionPoly as Polygon).deleteFace(face);
            //     }
            // });
        }

        if (drawOpacityMaskRuler) {
            try {
                polygonMaskBaseUnionPoly = offset(polygonMaskBaseUnionPoly, 20, true);
            } catch (e) {
                console.log(e);
            }
        }

        // const highlightMaskBaseSVG = documant.createElementNS(SVG_XML_NAMESPACE, "svg") as ISVGElementWithPolygon;
        // highlightMaskBaseSVG.setAttribute("class", `${CLASS_HIGHLIGHT_COMMON} ${CLASS_HIGHLIGHT_SVG}`);
        // highlightMaskBaseSVG.polygon = polygonMaskBaseUnionPoly;

        // const svgPathMaskBase = polygonMaskBaseUnionPoly.scale(inverseZoom, inverseZoom).svg({
        //     // fill: `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})`,
        //     fill: "yellow",
        //     fillRule: "evenodd",
        //     // stroke: "transparent",
        //     // strokeWidth: 0,
        //     // fillOpacity: 1,
        //     stroke: "magenta",
        //     strokeWidth: 6,
        //     fillOpacity: 0.2,
        //     className: undefined,
        //     // r: 4,
        // });
        // highlightMaskBaseSVG.innerHTML = svgPathMaskBase;

        // highlightParent.append(highlightMaskBaseSVG);

        // let polyToDraw = polygonMaskBaseUnionPoly;
        // polyToDraw = subtract(polyToDraw,
        //     paginated ?
        //     polygonCountourUnionPoly.translate(new Vector(-paginatedGap, 0)) :
        //     polygonCountourUnionPoly,
        // );

        let polygonMaskUnionPoly: Polygon | undefined;
        if (drawOpacityMaskRuler) {
            let boundingRectMask: IRect | IRect[] | undefined;
            const polygonMaskRects: IRect[] = [];
            for (const f of polygonCountourUnionPoly.faces) {
                const face = f as Face;
                const b = face.box;

                // const p = new Polygon();
                // const bb = new Box(b.xmin - paginatedGap, b.ymin, b.xmax - paginatedGap, b.ymax);
                // const ff = p.addFace(bb);
                // if (ff.orientation() !== BASE_ORIENTATION) {
                //     console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() xx");
                //     ff.reverse();
                // }
                // polyToDraw = subtract(polyToDraw, p);

                const left =
                    isVWM
                        ?
                        b.xmin
                        :
                        paginated
                            ?
                            (
                                (
                                    rtl
                                        ?
                                        paginatedGap + bodyPaddingLeft
                                        :
                                        paginatedGap + bodyPaddingLeft
                                )
                                + Math.floor(b.xmin / paginatedWidth) * paginatedWidth
                            )
                            : // scroll (!paginated)
                            (
                                rtl
                                    ?
                                    0
                                    :
                                    win.READIUM2.isFixedLayout
                                        ?
                                        0
                                        :
                                        0
                            );
                const top =
                    isVWM
                        ?
                        0
                        :
                        b.ymin
                    ;
                const width =
                    isVWM
                        ?
                        b.width
                        :
                        paginated
                            ?
                            (
                                rtl
                                    ?
                                    bodyWidth - bodyPaddingLeft - bodyPaddingRight
                                    :
                                    bodyWidth - bodyPaddingLeft - bodyPaddingRight
                            )
                            : // !paginated(scroll)
                            bodyWidth
                    ;
                const height =
                    isVWM
                        ?
                        bodyHeight
                        :
                        b.height
                    ;

                const extra = 0;
                // const extra = paginated ? 2 : 0; // useful to union-join small gaps, but here we are able to compute groups of bounding boxes so that in column-paginated mode when crossing over page boundaries there is no gigantic bounding box.

                const r: IRect = {
                    left: left - (isVWM ? extra : 0),
                    top: top - (isVWM ? 0 : extra),
                    right: left + width + (isVWM ? extra : 0),
                    bottom: top + height + (isVWM ? 0 : extra),
                    width: width + extra * 2,
                    height: height + extra * 2,
                };

                boundingRectMask = boundingRectMask ? getBoundingRect(boundingRectMask as IRect, r) : r;

                polygonMaskRects.push(r);
            }

            if (paginated) {
                const tolerance = 1;
                const groups: Array<{
                    x: number,
                    boxes: IRect[],
                }> = [];
                for (const r of polygonMaskRects) {
                    const group = groups.find((g) => {
                        return !(r.left < (g.x - tolerance) || r.left > (g.x + tolerance));
                    });

                    if (!group) {
                        groups.push({
                            x: r.left,
                            boxes: [r],
                        });
                    } else {
                        group.boxes?.push(r);
                    }
                }

                // console.log("XX RECTS: " + polygonMaskRects.length);
                // console.log(JSON.stringify(polygonMaskRects, null, 4));
                // console.log("XX GROUPS: " + groups.length);
                // groups.forEach((g) => console.log(JSON.stringify(g.boxes, null, 4)));

                boundingRectMask = groups.map<IRect>((g) => {
                    return g.boxes.reduce((prev, cur) => {
                        if (prev === cur) {
                            return cur;
                        }
                        return getBoundingRect(prev, cur);
                    }, g.boxes[0]);
                });
                if (boundingRectMask.length === 1) {
                    boundingRectMask = boundingRectMask[0];
                }
            }

            if (useFastBoundingRect) {
                if (boundingRectMask) {
                    polygonMaskUnionPoly = new Polygon();
                    if (Array.isArray(boundingRectMask)) {
                        for (const b of boundingRectMask) {
                            const f = polygonMaskUnionPoly.addFace(new Box(b.left, b.top, b.right, b.bottom));
                            if (f.orientation() !== BASE_ORIENTATION) {
                                console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 6");
                                f.reverse();
                            }
                        }
                    } else {
                        const f = polygonMaskUnionPoly.addFace(new Box(boundingRectMask.left, boundingRectMask.top, boundingRectMask.right, boundingRectMask.bottom));
                        if (f.orientation() !== BASE_ORIENTATION) {
                            console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 7");
                            f.reverse();
                        }
                    }
                } else {
                    const poly = new Polygon();
                    for (const r of polygonMaskRects) {
                        const f = poly.addFace(new Box(r.left, r.top, r.right, r.bottom));
                        if (f.orientation() !== BASE_ORIENTATION) {
                            console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 8");
                            f.reverse();
                        }
                    }
                    polygonMaskUnionPoly = new Polygon();
                    const f = polygonMaskUnionPoly.addFace(poly.box);
                    if (f.orientation() !== BASE_ORIENTATION) {
                        console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 9");
                        f.reverse();
                    }
                }
            } else {
                polygonMaskUnionPoly = polygonMaskRects.reduce((previousPolygon, r) => {
                    const b = new Box(r.left, r.top, r.right, r.bottom);
                    const p = new Polygon();
                    const f = p.addFace(b);
                    if (f.orientation() !== BASE_ORIENTATION) {
                        console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 10");
                        f.reverse();
                    }
                    return unify(previousPolygon, p);
                }, new Polygon());

                // Array.from(polygonMaskUnionPoly.faces).forEach((face: Face) => {
                //     if (face.orientation() !== BASE_ORIENTATION) {
                //         if (DEBUG_RECTS) {
                //             console.log("--HIGH WEBVIEW-- removing polygon orientation face / inner hole (margin))");
                //         }
                //         (polygonMaskUnionPoly as Polygon).deleteFace(face);
                //     }
                // });
            }

            try {
                polygonMaskUnionPoly = offset(polygonMaskUnionPoly, 10, false);
            } catch (e) {
                console.log(e);
            }
        }

        // const polyToDraw = polygonMaskBaseUnionPoly;
        // const polyToDraw = polygonMaskUnionPoly;
        const polyToDraw = polygonMaskUnionPoly ?
            subtract(polygonMaskBaseUnionPoly, polygonMaskUnionPoly) :
            subtract(polygonMaskBaseUnionPoly, polygonCountourUnionPoly);
        // const polyToDraw =
        //     polygonSurface
        //     ?
        //         Array.isArray(polygonSurface)
        //         ?
        //         polygonSurface.reduce((previousPolygon, p) => {
        //             return subtract(previousPolygon, p);
        //         }, polygonMaskBaseUnionPoly)
        //         :
        //         subtract(polygonMaskBaseUnionPoly, polygonSurface)
        //     :
        //     subtract(polygonMaskBaseUnionPoly, polygonMaskUnionPoly)
        //     ;

        const highlightMaskSVG = documant.createElementNS(SVG_XML_NAMESPACE, "svg") as ISVGElementWithPolygon;
        highlightMaskSVG.setAttribute("class", `${CLASS_HIGHLIGHT_COMMON_SVG} ${CLASS_HIGHLIGHT_SVG} ${CLASS_HIGHLIGHT_CONTOUR}`);
        highlightMaskSVG.polygon = polyToDraw;
        // const rgb = Math.round(0xffffff * Math.random());
        // // tslint:disable-next-line:no-bitwise
        // const r = rgb >> 16;
        // // tslint:disable-next-line:no-bitwise
        // const g = rgb >> 8 & 255;
        // // tslint:disable-next-line:no-bitwise
        // const b = rgb & 255;

        let rsBackground = bodyComputedStyle.getPropertyValue("--RS__backgroundColor");
        if (!rsBackground) {
            rsBackground = rootComputedStyle.getPropertyValue("--RS__backgroundColor");
        }
        if (rsBackground === "transparent") {
            rsBackground = "";
        }
        let rsForeground = bodyComputedStyle.getPropertyValue("--RS__textColor");
        if (!rsForeground) {
            rsForeground = rootComputedStyle.getPropertyValue("--RS__textColor");
        }

        const svgPathMask = highlightMaskSVG.polygon.scale(inverseZoom, inverseZoom).svg({
            fillRule: "evenodd",
            // fill: `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})`,
            fill: rsBackground ? rsBackground : "white",
            fillOpacity: 0.9,
            stroke: drawOpacityMaskRuler ? (rsForeground ? rsForeground : "black") : "transparent",
            strokeWidth: drawOpacityMaskRuler ? 1.5 : 0,
            // stroke: `rgb(${r}, ${g}, ${b})`,
            // fill: "silver",
            // fillOpacity: 0.4,
            className: undefined,
            // r: 4,
        });
        highlightMaskSVG.innerHTML = svgPathMask;

        highlightParent.append(highlightMaskSVG);
    }

    // TTS
    if (
        !highlight.pointerInteraction &&
        (
            // highlight.rangeCssHighlight
            // ||
            ((drawOpacityMask || drawOpacityMaskRuler) && highlight.group === HIGHLIGHT_GROUP_TTS)
        )
    ) {
        return highlightParent;
    }

    if (!drawOpacityMask && !drawOpacityMaskRuler && !drawMarginBookmark) {
    let polygonSurface: Polygon | Polygon[] | undefined;
    if (highlight.rangeCssHighlight) {
        polygonSurface = undefined;
    } else if (doNotMergeHorizontallyAlignedRects) {
        const singleSVGPath = !DEBUG_RECTS;
        if (singleSVGPath) {
            polygonSurface = new Polygon();
            for (const box of boxesNoGapExpanded) {
                const f = polygonSurface.addFace(box);
                if (f.orientation() !== BASE_ORIENTATION) {
                    console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 3");
                    f.reverse();
                }
            }
        } else {
            polygonSurface = [];
            for (const box of boxesNoGapExpanded) {
                const poly = new Polygon();
                const f = poly.addFace(box);
                if (f.orientation() !== BASE_ORIENTATION) {
                    console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 4");
                    f.reverse();
                }
                polygonSurface.push(poly);
            }
        }
    } else {
        polygonSurface = boxesNoGapExpanded.reduce((previousPolygon, currentBox) => {
            const p = new Polygon();
            const f = p.addFace(currentBox);
            if (f.orientation() !== BASE_ORIENTATION) {
                console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 5");
                f.reverse();
            }
            return unify(previousPolygon, p);
        }, new Polygon());

        Array.from(polygonSurface.faces).forEach((face: Face) => {
            if (face.orientation() !== BASE_ORIENTATION) {
                if (DEBUG_RECTS) {
                    console.log("--HIGH WEBVIEW-- removing polygon orientation face / inner hole (surface))");
                }
                (polygonSurface as Polygon).deleteFace(face);
            }
        });

        if (drawOutline || drawBackground || drawOpacityMask || drawOpacityMaskRuler) {

            if (DEBUG_RECTS) {
                console.log("--==========--==========--==========--==========--==========--==========");
                console.log("--POLY FACES BEFORE ...");
            }
            for (const f of polygonSurface.faces) {
                const face = f as Face;
                if (DEBUG_RECTS) {
                    console.log("--................--................--................");
                    console.log("--POLY FACE: " + (face.orientation() === ORIENTATION.CCW ? "CCW" : face.orientation() === ORIENTATION.CW ? "CW" : "ORIENTATION.NOT_ORIENTABLE" ));
                }
                for (const edge of face.edges) {
                    if (DEBUG_RECTS) {
                        console.log("--POLY EDGE");
                    }
                    if (edge.isSegment) {
                        if (DEBUG_RECTS) {
                            console.log("--POLY SEGMENT...");
                        }
                        const segment = edge.shape as Segment;
                        const pointStart = segment.start;
                        const pointEnd = segment.end;
                        if (DEBUG_RECTS) {
                            console.log("--POLY SEGMENT START x, y: " + pointStart.x + ", " + pointStart.y);
                            console.log("--POLY SEGMENT END x, y: " + pointEnd.x + ", " + pointEnd.y);
                        }
                    } else if (edge.isArc) {
                        if (DEBUG_RECTS) {
                            console.log("--POLY ARC...");
                        }
                        const arc = edge.shape as Arc;

                        if (DEBUG_RECTS) {
                            console.log("--POLY ARC: " + arc.start.x + ", " + arc.start.y);
                            console.log("--POLY ARC: " + arc.end.x + ", " + arc.end.y);
                            console.log("--POLY ARC: " + arc.length + " / " + arc.sweep);
                            // console.log("--POLY ARC: " + arc.ps.x + ", " + arc.ps.y + " (" + arc.r + ") " + "[" + arc.startAngle + ", " + arc.endAngle + "]");
                        }
                    }
                }
            }

            try {
                polygonSurface = offset(polygonSurface, -(gap + gap/2));
            } catch (e) {
                console.log(e);
            }

            if (DEBUG_RECTS) {
                console.log("--==========--==========--==========--==========--==========--==========");
                console.log("--POLY FACES AFTER ...");
            }
            for (const f of polygonSurface.faces) {
                const face = f as Face;
                if (DEBUG_RECTS) {
                    console.log("--................--................--................");
                    console.log("--POLY FACE: " + (face.orientation() === ORIENTATION.CCW ? "CCW" : face.orientation() === ORIENTATION.CW ? "CW" : "ORIENTATION.NOT_ORIENTABLE" ));
                }

                for (const edge of face.edges) {
                    if (DEBUG_RECTS) {
                        console.log("--POLY EDGE");
                    }
                    if (edge.isSegment) {
                        if (DEBUG_RECTS) {
                            console.log("--POLY SEGMENT...");
                        }
                        const segment = edge.shape as Segment;
                        const pointStart = segment.start;
                        const pointEnd = segment.end;
                        if (DEBUG_RECTS) {
                            console.log("--POLY SEGMENT START x, y: " + pointStart.x + ", " + pointStart.y);
                            console.log("--POLY SEGMENT END x, y: " + pointEnd.x + ", " + pointEnd.y);
                        }
                    } else if (edge.isArc) {
                        if (DEBUG_RECTS) {
                            console.log("--POLY ARC...");
                        }
                        const arc = edge.shape as Arc;

                        if (DEBUG_RECTS) {
                            console.log("--POLY ARC: " + arc.start.x + ", " + arc.start.y);
                            console.log("--POLY ARC: " + arc.end.x + ", " + arc.end.y);
                            console.log("--POLY ARC: " + arc.length + " / " + arc.sweep);
                            // console.log("--POLY ARC: " + arc.ps.x + ", " + arc.ps.y + " (" + arc.r + ") " + "[" + arc.startAngle + ", " + arc.endAngle + "]");
                        }
                    }
                }
            }
        }
    }

    if (DEBUG_RECTS) {
        addEdgePoints(polygonCountourUnionPoly, 1);

        if (!polygonSurface) {
            // noop
        } else if (Array.isArray(polygonSurface)) {
            for (const poly of polygonSurface) {
                addEdgePoints(poly, 1);
            }
        } else {
            addEdgePoints(polygonSurface, 1);
        }
    }

    // const highlightAreaSVGDocFrag = documant.createDocumentFragment();
    // highlightAreaSVGDocFrag.appendChild(highlightAreaSVGRect);
    // const highlightAreaSVGG = documant.createElementNS(SVG_XML_NAMESPACE, "g");
    // highlightAreaSVGG.appendChild(highlightAreaSVGDocFrag);
    const highlightAreaSVG = documant.createElementNS(SVG_XML_NAMESPACE, "svg") as ISVGElementWithPolygon;
    highlightAreaSVG.setAttribute("class", `${CLASS_HIGHLIGHT_COMMON} ${CLASS_HIGHLIGHT_CONTOUR}`);

    // highlightAreaSVG.polygon = polygonSurface;
    highlightAreaSVG.polygon = polygonCountourUnionPoly; // TODO: gap expansion too generous for hit testing?

    const outlineThickness = 2;
    // let usrFontSize = bodyComputedStyle.getPropertyValue("--USER__fontSize");
    // if (usrFontSize) {
    //     usrFontSize = usrFontSize.replace("%", "");
    //     try {
    //         const factor = parseInt(usrFontSize, 10) / 100;
    //         outlineThickness = outlineThickness * factor;
    //     } catch (_e) {
    //         // ignore
    //     }
    // }

    // const styleAttr = win.document.documentElement.getAttribute("style");
    // const isUserFontSize = styleAttr ? styleAttr.indexOf("--USER__fontSize") >= 0 : false;
    // if (isUserFontSize) {
    //     // const docStyle = win.getComputedStyle(win.document.documentElement);
    // }

    // highlightAreaSVG.append((new DOMParser()​​.parseFromString(`<svg xmlns="${SVG_XML_NAMESPACE}">${polys.scale(inverseZoom, inverseZoom).svg()}</svg>`, "image/svg+xml")).firstChild);
    highlightAreaSVG.innerHTML =
    (polygonSurface ?
    (
    Array.isArray(polygonSurface)
    ?
    polygonSurface.reduce((prevSVGPath, currentPolygon) => {
        return prevSVGPath + currentPolygon.scale(inverseZoom, inverseZoom).svg({
            fill: DEBUG_RECTS ? "pink" : (drawOutline || highlight.rangeCssHighlight) ? "transparent" : `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})`,
            fillRule: "evenodd",
            stroke: DEBUG_RECTS ? "magenta" : drawOutline ? `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})` : "transparent",
            strokeWidth: DEBUG_RECTS ? 1 : drawOutline ? outlineThickness : 0,
            fillOpacity: 1,
            className: undefined,
            // r: 4,
        });
    }, "")
    :
    polygonSurface.scale(inverseZoom, inverseZoom).svg({
        fill: DEBUG_RECTS ? "yellow" : (drawOutline || highlight.rangeCssHighlight) ? "transparent" : `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})`,
        fillRule: "evenodd",
        stroke: DEBUG_RECTS ? "green" : drawOutline ? `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})` : "transparent",
        strokeWidth: DEBUG_RECTS ? 1 : drawOutline ? outlineThickness : 0,
        fillOpacity: 1,
        className: undefined,
        // r: 4,
    })
    ) : "")
    +
    polygonCountourUnionPoly.scale(inverseZoom, inverseZoom).svg({
        fill: "transparent",
        fillRule: "evenodd",
        stroke: DEBUG_RECTS ? "red" : "transparent",
        strokeWidth: DEBUG_RECTS ? 1 : 1,
        fillOpacity: 1,
        className: undefined,
        // r: 4,
    })
    ;

    highlightParent.append(highlightAreaSVG);
    }

    if (doDrawMargin && highlight.pointerInteraction) {
        const MARGIN_MARKER_THICKNESS = 14 * (win.READIUM2.isFixedLayout ? 1 : (1/inverseZoom));
        const MARGIN_MARKER_OFFSET = 6 * (win.READIUM2.isFixedLayout ? 1 : (1/inverseZoom));

        let boundingRectCountourMargin: IRect | IRect[] | undefined;
        const polygonCountourMarginRects: IRect[] = [];
        for (const f of polygonCountourUnionPoly.faces) {
            const face = f as Face;

            const b = face.box;
            const left =
                isVWM
                ?
                b.xmin
                :
                paginated
                ?
                (
                    (
                    rtl
                    ?
                    MARGIN_MARKER_OFFSET - paginatedOffset + paginatedWidth
                    :
                    paginatedOffset - MARGIN_MARKER_OFFSET - MARGIN_MARKER_THICKNESS
                    )
                    +
                    Math.floor((b.xmin) / paginatedWidth) * paginatedWidth
                )
                : // !paginated(scroll)
                (
                    rtl
                    ?
                    MARGIN_MARKER_OFFSET + bodyRect.width - bodyPaddingRight
                    :
                    win.READIUM2.isFixedLayout
                    ?
                    MARGIN_MARKER_OFFSET
                    :
                    bodyPaddingLeft - MARGIN_MARKER_THICKNESS - MARGIN_MARKER_OFFSET
                )
            ;
            const top =
                isVWM
                ?
                parseInt(bodyComputedStyle.paddingTop, 10) - MARGIN_MARKER_THICKNESS - MARGIN_MARKER_OFFSET
                :
                b.ymin
            ;
            const width = isVWM ? b.width : MARGIN_MARKER_THICKNESS;
            const height = isVWM ? MARGIN_MARKER_THICKNESS : b.height;

            const extra = 0;
            // const extra = paginated ? 2 : 0; // useful to union-join small gaps, but here we are able to compute groups of bounding boxes so that in column-paginated mode when crossing over page boundaries there is no gigantic bounding box.

            const r: IRect = {
                left: left - (isVWM ? extra : 0),
                top: top - (isVWM ? 0 : extra),
                right: left + width + (isVWM ? extra : 0),
                bottom: top + height + (isVWM ? 0 : extra),
                width: width + extra * 2,
                height: height + extra * 2,
            };

            // console.log("b", JSON.stringify(b, null, 4));
            // console.log("bodyRect", JSON.stringify(bodyRect, null, 4));
            // console.log("inverseZoom", inverseZoom);

            // console.log("bodyPaddingLeft", parseInt(bodyComputedStyle.paddingLeft, 10));
            // console.log("bodyPaddingRight", parseInt(bodyComputedStyle.paddingRight, 10));

            // console.log("bodyWidth", parseInt(bodyComputedStyle.width, 10));
            // console.log("bodyHeight", parseInt(bodyComputedStyle.height, 10));

            // console.log("scrollElement.scrollLeft", scrollElement.scrollLeft);
            // console.log("scrollElement.scrollTop", scrollElement.scrollTop);
            // console.log("scrollElement.clientWidth", scrollElement.clientWidth);
            // console.log("scrollElement.clientHeight", scrollElement.clientHeight);

            boundingRectCountourMargin = boundingRectCountourMargin ? getBoundingRect(boundingRectCountourMargin as IRect, r) : r;

            polygonCountourMarginRects.push(r);
        }

        let polygonMarginUnionPoly: Polygon | undefined;
        if (paginated) {
            const tolerance = 1;
            const groups: Array<{
                x: number,
                boxes: IRect[],
            }> = [];
            for (const r of polygonCountourMarginRects) {
                const group = groups.find((g) => {
                    return !(r.left < (g.x - tolerance) || r.left > (g.x + tolerance));
                });

                if (!group) {
                    groups.push({
                        x: r.left,
                        boxes: [r],
                    });
                } else {
                    group.boxes?.push(r);
                }
            }

            // console.log("XX RECTS: " + polygonCountourMarginRects.length);
            // console.log(JSON.stringify(polygonCountourMarginRects, null, 4));
            // console.log("XX GROUPS: " + groups.length);
            // groups.forEach((g) => console.log(JSON.stringify(g.boxes, null, 4)));

            boundingRectCountourMargin = groups.map<IRect>((g) => {
                return g.boxes.reduce((prev, cur) => {
                    if (prev === cur) {
                        return cur;
                    }
                    return getBoundingRect(prev, cur);
                }, g.boxes[0]);
            });
            if (boundingRectCountourMargin.length === 1) {
                boundingRectCountourMargin = boundingRectCountourMargin[0];
            }
        }

        if (useFastBoundingRect) {
            if (boundingRectCountourMargin) {
                polygonMarginUnionPoly = new Polygon();
                if (Array.isArray(boundingRectCountourMargin)) {
                    for (const b of boundingRectCountourMargin) {
                        const f = polygonMarginUnionPoly.addFace(new Box(b.left, b.top, b.right, b.bottom));
                        if (f.orientation() !== BASE_ORIENTATION) {
                            console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 6");
                            f.reverse();
                        }
                    }
                } else {
                    const f = polygonMarginUnionPoly.addFace(new Box(boundingRectCountourMargin.left, boundingRectCountourMargin.top, boundingRectCountourMargin.right, boundingRectCountourMargin.bottom));
                    if (f.orientation() !== BASE_ORIENTATION) {
                        console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 7");
                        f.reverse();
                    }
                }
            } else {
                const poly = new Polygon();
                for (const r of polygonCountourMarginRects) {
                    const f = poly.addFace(new Box(r.left, r.top, r.right, r.bottom));
                    if (f.orientation() !== BASE_ORIENTATION) {
                        console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 8");
                        f.reverse();
                    }
                }
                polygonMarginUnionPoly = new Polygon();
                // console.log(poly.box.xmin);
                // console.log(poly.box.xmax);
                // console.log(poly.box.height);
                // console.log(poly.box.ymin);
                // console.log(poly.box.ymax);
                // console.log(poly.box.width);
                const f = polygonMarginUnionPoly.addFace(poly.box);
                if (f.orientation() !== BASE_ORIENTATION) {
                    console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 9");
                    f.reverse();
                }
            }
        } else {
            polygonMarginUnionPoly = polygonCountourMarginRects.reduce((previousPolygon, r) => {
                const b = new Box(r.left, r.top, r.right, r.bottom);
                const p = new Polygon();
                const f = p.addFace(b);
                if (f.orientation() !== BASE_ORIENTATION) {
                    console.log("--POLYGON FACE ORIENTATION CCW/CW reverse() 10");
                    f.reverse();
                }
                return unify(previousPolygon, p);
            }, new Polygon());

            // Array.from(polygonMarginUnionPoly.faces).forEach((face: Face) => {
            //     if (face.orientation() !== BASE_ORIENTATION) {
            //         if (DEBUG_RECTS) {
            //             console.log("--HIGH WEBVIEW-- removing polygon orientation face / inner hole (margin))");
            //         }
            //         (polygonMarginUnionPoly as Polygon).deleteFace(face);
            //     }
            // });
        }

        if (drawMarginBookmark) {
            const ratio = 3;
            const delta = MARGIN_MARKER_THICKNESS / ratio;
            const polygonMarginUnionPoly_ = polygonMarginUnionPoly.clone(); // backup
            try {
                const bbox = polygonMarginUnionPoly.box;
                const vec = new Vector(bbox.center, new Point(0, 0));
                polygonMarginUnionPoly = polygonMarginUnionPoly.translate(vec);
                polygonMarginUnionPoly = polygonMarginUnionPoly.scale(1/ratio, 1/ratio);
                polygonMarginUnionPoly = polygonMarginUnionPoly.translate(vec.invert());
                // polygonMarginUnionPoly = offset(polygonMarginUnionPoly, -delta, true);
                polygonMarginUnionPoly = offset(polygonMarginUnionPoly, delta, false);
                const p = new Polygon();
                const triangleInset = MARGIN_MARKER_THICKNESS / 2.5;
                const f = p.addFace([
                    new Segment(new Point(polygonMarginUnionPoly.box.xmin, polygonMarginUnionPoly.box.ymax), new Point(polygonMarginUnionPoly.box.xmax, polygonMarginUnionPoly.box.ymax)),
                    new Segment(new Point(polygonMarginUnionPoly.box.xmax, polygonMarginUnionPoly.box.ymax), new Point(polygonMarginUnionPoly.box.xmin + polygonMarginUnionPoly.box.width / 2, polygonMarginUnionPoly.box.ymax - triangleInset)),
                    new Segment(new Point(polygonMarginUnionPoly.box.xmin + polygonMarginUnionPoly.box.width / 2, polygonMarginUnionPoly.box.ymax - triangleInset), new Point(polygonMarginUnionPoly.box.xmin, polygonMarginUnionPoly.box.ymax)),
                ]);
                if (f.orientation() !== BASE_ORIENTATION) {
                    console.log("--xPOLYGON FACE ORIENTATION CCW/CW reverse() 10");
                    f.reverse();
                }
                polygonMarginUnionPoly = subtract(polygonMarginUnionPoly, p);
            } catch (e) {
                console.log(e);
                polygonMarginUnionPoly = polygonMarginUnionPoly_;
            }
        }

        const highlightMarginSVG = documant.createElementNS(SVG_XML_NAMESPACE, "svg") as ISVGElementWithPolygon;
        highlightMarginSVG.setAttribute("class", `${CLASS_HIGHLIGHT_COMMON} ${CLASS_HIGHLIGHT_CONTOUR_MARGIN}`);
        highlightMarginSVG.polygon = polygonMarginUnionPoly;
        const svgPath = polygonMarginUnionPoly.scale(inverseZoom, inverseZoom).svg({
            fillRule: "evenodd",
            fill: `rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})`,
            stroke: "transparent",
            strokeWidth: 0,
            fillOpacity: 1,
            // fill: "yellow",
            // stroke: "magenta",
            // strokeWidth: 6,
            // fillOpacity: 0.5,
            className: undefined,
            // r: 4,
        });
        if (ENABLE_PAGEBREAK_MARGIN_TEXT_EXPERIMENT) {
            let svg = svgPath;
            highlight.marginText = "Long test 1.";
            if (highlight.marginText) {
                const m = svg.match(/d="\s*M([0-9]+\.?[0-9]*),([0-9]+\.?[0-9]*)/);
                if (m && m[1] && m[2]) {
                    const r2SvgHighlightsTextFilterID = `r2SvgFilterR${highlight.color.red}G${highlight.color.green}B${highlight.color.blue}`;
                    const el = highlightParent.querySelector(`#${r2SvgHighlightsTextFilterID}`); // documant.getElementById(r2SvgHighlightsTextFilterID);
                    const filter = el ? "" : `<defs><filter x="0" y="0" width="1" height="1" id="${r2SvgHighlightsTextFilterID}"><feFlood flood-color="rgb(${highlight.color.red}, ${highlight.color.green}, ${highlight.color.blue})" result="bg" /><feMerge><feMergeNode in="bg"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
                    svg = `${filter}${svgPath}<text x="${m[1]}" y="${m[2]}" class="${CLASS_HIGHLIGHT_CONTOUR_MARGIN}_" font-size="stroke:red; fill: magenta;" filter="url(#${r2SvgHighlightsTextFilterID})">${highlight.marginText}</text>`;
                }
            }
            highlightMarginSVG.innerHTML = svg;
        } else {
            highlightMarginSVG.innerHTML = svgPath;
        }

        highlightParent.append(highlightMarginSVG);
    }

    return highlightParent;
}
