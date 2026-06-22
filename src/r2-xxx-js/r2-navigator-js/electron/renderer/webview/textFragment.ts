// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TextFragment } from "../../common/selection";

// https://github.com/Treora/text-fragments-ts

// TypeScript port of:
// https://github.com/GoogleChromeLabs/text-fragments-polyfill/tree/abc6ed408b3f20e91d9cbda9977748459f5e3877
// (functionalities removed: timeout  and word-boundary forced alignment)

// https://github.com/GoogleChromeLabs/text-fragments-polyfill/compare/abc6ed408b3f20e91d9cbda9977748459f5e3877...main
// https://github.com/GoogleChromeLabs/text-fragments-polyfill/blob/abc6ed408b3f20e91d9cbda9977748459f5e3877/src/fragment-generation-utils.js#L177
// doGenerateFragmentFromRange() ... but without expandRangeStart/EndToWordBound() etc.
// ... and bug fixes:
// https://github.com/GoogleChromeLabs/text-fragments-polyfill/issues/161
// https://github.com/GoogleChromeLabs/text-fragments-polyfill/issues/162
// https://github.com/GoogleChromeLabs/text-fragments-polyfill/issues/163
// https://github.com/GoogleChromeLabs/text-fragments-polyfill/issues/165
// ...and notably:
// https://github.com/GoogleChromeLabs/text-fragments-polyfill/issues/164

const FORCE_WORD_ALIGNMENT = false;
const USE_SEGMENTER = true;

const TEXT_FRAGMENT_REGEXP = /^(?:(.+?)-,)?(?:(.+?))(?:,([^-]+?))?(?:,-(.+?))?$/;
// :~:text=
export const parseTextFragmentDirective = (textFragment: string) => {
    return {
        prefix: decodeURIComponent(textFragment.replace(TEXT_FRAGMENT_REGEXP, "$1")),
        textStart: decodeURIComponent(textFragment.replace(TEXT_FRAGMENT_REGEXP, "$2")),
        textEnd: decodeURIComponent(textFragment.replace(TEXT_FRAGMENT_REGEXP, "$3")),
        suffix: decodeURIComponent(textFragment.replace(TEXT_FRAGMENT_REGEXP, "$4")),
    };
};

// type ElementWithoutTextContent = Omit<Element, "textContent">;
// type NodeWithoutTextContent = Omit<Element, "textContent">;
// const isElement = (node: NodeWithoutTextContent): node is ElementWithoutTextContent => {
// node instanceof Element --- node instanceof HTMLElement || node instanceof SVGElement
const isElement = (node: Node): node is Element => {
    return node.nodeType === Node.ELEMENT_NODE;
};

const isText = (node: Node): node is Text => {
    return node.nodeType === Node.TEXT_NODE;
};

// const isCharacterData = (node: Node): node is CharacterData => {
//     return (
//         node.nodeType === Node.PROCESSING_INSTRUCTION_NODE ||
//         node.nodeType === Node.COMMENT_NODE ||
//         node.nodeType === Node.TEXT_NODE
//     );
// };

const normalizeString = (str: string): string => {
    return str
        .normalize("NFKD")
        .replace(/\s+/g, " ") // collapse contiguous whitespace into single space
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
};

const BLOCK_ELEMENTS = [
    "ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "BR", "DETAILS",
    "DIALOG", "DD", "DIV", "DL", "DT", "FIELDSET",
    "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "H1", "H2",
    "H3", "H4", "H5", "H6", "HEADER", "HGROUP",
    "HR", "LI", "MAIN", "NAV", "OL", "P",
    "PRE", "SECTION", "TABLE", "UL", "TR", "TH",
    "TD", "COLGROUP", "COL", "CAPTION", "THEAD", "TBODY",
    "TFOOT",
    "SVG",
];

const makeNewSegmenter = (): Intl.Segmenter => {
    const lang = window.document.documentElement.lang || navigator.language;
    return new Intl.Segmenter(lang, { granularity: "word" });
};

// https://github.com/GoogleChromeLabs/text-fragments-polyfill/compare/def94c50993b155fa831038ebd74ba6f4ab299e3...main#diff-683f94c56eefdd33dcd785e073d00a6db63a57b78ec59c33e64ee633bfe2d3bb
// scrollElementIntoView?
// const revealHiddenUntilFoundHierarchy = (elt) => {
//   while (elt) {
//     if (isHiddenUntilFound(elt)) {
//       elt.dispatchEvent(new Event('beforematch'));
//       elt.hidden = '';
//     }
//     elt = elt.parentElement;
//   }
// };

// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/hidden
// https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden
const isHiddenUntilFound = (elt: Element) => {
    // @___ts-expect-error (TypeScript HTMLElement.hidden is incorrectly boolean)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore GO TypeScript checks pass, unfortunately Javascript implementation fail!
    if ((elt as HTMLElement).hidden === "until-found") {
        return true;
    }

    // // Workaround for WebKit. See https://bugs.webkit.org/show_bug.cgi?id=238266
    // const attributes = elt.attributes;
    // if (attributes && attributes["hidden"]) {
    //   const value = attributes["hidden"].value;
    //   if (value === "until-found") {
    //     return true;
    //   }
    // }

    return false;
};

const isNodeVisible = (node: Node): boolean => {
    let elt: Node | null = node;
    while (elt && !isElement(elt)) {
        elt = elt.parentNode;
    }
    if (elt) {
        if (isHiddenUntilFound(elt as Element)) {
            return true;
        }
        const nodeStyle = window.getComputedStyle(elt as Element);
        if (nodeStyle.visibility === "hidden"
            || nodeStyle.display === "none" ||
            parseInt(nodeStyle.height, 10) === 0 && nodeStyle.overflowY !== "visible" ||
            parseInt(nodeStyle.width, 10) === 0 && nodeStyle.overflowX !== "visible" ||
            parseInt(nodeStyle.opacity, 10) === 0) {
            return false;
        }
    }
    return true;
};

const acceptNodeIfVisibleInRange = (node: Node, range: Range | undefined): typeof NodeFilter.FILTER_REJECT | typeof NodeFilter.FILTER_ACCEPT | typeof NodeFilter.FILTER_SKIP => {
    if (range && !range.intersectsNode(node))
        return NodeFilter.FILTER_REJECT;

    return isNodeVisible(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
};

const forwardTraverse = (walker: TreeWalker, finishedSubtrees: Set<Node>): Node | null => {

    if (!finishedSubtrees.has(walker.currentNode)) {
        const firstChild = walker.firstChild();
        if (firstChild) {
            return firstChild;
        }
    }

    const nextSibling = walker.nextSibling();
    if (nextSibling) {
        return nextSibling;
    }

    const parent = walker.parentNode();

    if (parent) {
        finishedSubtrees.add(parent);
    }

    return parent;
};

export const convertTextFragmentToRanges = (textFragment: TextFragment, documant: Document): Range[] => {

    const findTextInRange = (query: string, range: Range) => {

        const findRangeFromNodeList = (query: string, range: Range, textNodes: Text[], _segmenter: Intl.Segmenter | undefined): Range | undefined => {

            const getTextContent = (nodes: Text[], startOffset: number, endOffset: number | undefined): string => {
                let str = "";
                if (!nodes[0].textContent) {
                    return str;
                }
                if (nodes.length === 1) {
                    str = nodes[0].textContent.substring(startOffset, endOffset);
                } else {
                    str = nodes[0].textContent.substring(startOffset) +
                        nodes.slice(1, -1).reduce((s, n) => s + (n.textContent || ""), "") +
                        (nodes.slice(-1)[0].textContent?.substring(0, endOffset) || "");
                }
                return str.replace(/\s+/g, " "); // collapse contiguous whitespace into single space
                // return str.replace(/[\t\n\r ]+/g, " ");
            };

            const getBoundaryPointAtIndex = (index: number, textNodes: Text[], isEnd: boolean): { node: Node, offset: number } | undefined => {
                let counted = 0;
                let normalizedData: string | undefined;
                for (let i = 0; i < textNodes.length; i++) {
                    const node = textNodes[i];
                    const nodeData = node.textContent || "";
                    if (!normalizedData) {
                        normalizedData = normalizeString(nodeData);
                    }
                    let nodeEnd = counted + normalizedData.length;
                    if (isEnd) {
                        nodeEnd += 1;
                    }
                    if (nodeEnd > index) {
                        const normalizedOffset = index - counted;
                        let denormalizedOffset = Math.min(index - counted, nodeData.length);

                        const targetSubstring = isEnd ?
                            normalizedData.substring(0, normalizedOffset) :
                            normalizedData.substring(normalizedOffset);

                        let candidateSubstring = isEnd ?
                            normalizeString(nodeData.substring(0, denormalizedOffset)) :
                            normalizeString(nodeData.substring(denormalizedOffset));

                        const direction = (isEnd ? -1 : 1) *
                            (targetSubstring.length > candidateSubstring.length ? -1 : 1);

                        while (denormalizedOffset >= 0 &&
                            denormalizedOffset <= nodeData.length) {
                            if (candidateSubstring.length === targetSubstring.length) {
                                return { node: node, offset: denormalizedOffset };
                            }

                            denormalizedOffset += direction;

                            candidateSubstring = isEnd ?
                                normalizeString(nodeData.substring(0, denormalizedOffset)) :
                                normalizeString(nodeData.substring(denormalizedOffset));
                        }
                    }
                    counted += normalizedData.length;

                    if (i + 1 < textNodes.length) {
                        const str = textNodes[i + 1].textContent;
                        const nextNormalizedData = str ? normalizeString(str) : "";
                        if (normalizedData.slice(-1) === " " &&
                            nextNormalizedData.slice(0, 1) === " ") {
                            counted -= 1;
                        }
                        normalizedData = nextNormalizedData;
                    }
                }
                return undefined;
            };

            if (!textNodes.length) {
                return undefined;
            }

            const startOffset = textNodes[0] === range.startContainer ? range.startOffset : 0;
            const data = normalizeString(getTextContent(textNodes, startOffset, undefined));
            const normalizedQuery = normalizeString(query);
            let searchStart = 0;

            let start: ReturnType<typeof getBoundaryPointAtIndex> | undefined;
            let end: ReturnType<typeof getBoundaryPointAtIndex> | undefined;
            while (searchStart < data.length) {
                const matchIndex = data.indexOf(normalizedQuery, searchStart);
                if (matchIndex === -1) {
                    return undefined;
                }

                // if (!FORCE_WORD_ALIGNMENT || isWordBounded(data, matchIndex, normalizedQuery.length, segmenter)) {
                //     start = getBoundaryPointAtIndex(matchIndex, textNodes, false);
                //     end = getBoundaryPointAtIndex(matchIndex + normalizedQuery.length, textNodes, true);
                // }
                const normalizedStartOffset = normalizeString(textNodes[0].data.slice(0, startOffset)).length;
                start = getBoundaryPointAtIndex(normalizedStartOffset + matchIndex, textNodes, false);

                end = getBoundaryPointAtIndex(normalizedStartOffset + matchIndex + normalizedQuery.length, textNodes, true);

                if (start && end) {
                    const documant = start.node.ownerDocument || window.document;
                    const foundRange = documant.createRange();
                    foundRange.setStart(start.node, start.offset);
                    foundRange.setEnd(end.node, end.offset);

                    if (range.compareBoundaryPoints(Range.START_TO_START, foundRange) <= 0 &&
                        range.compareBoundaryPoints(Range.END_TO_END, foundRange) >= 0) {
                        return foundRange;
                    }
                }
                searchStart = matchIndex + 1;
            }
            return undefined;
        };

        const getAllTextNodes = (root: Node, range: Range): Array<Array<Text>> => {

            function* getElementsIn(root: Node, filter: (node: Node) => number): Generator<Node> {
                const treeWalker = (root.ownerDocument || window.document).createTreeWalker(
                    root,
                    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
                    { acceptNode: filter },
                );

                const finishedSubtrees = new Set<Node>();
                while (forwardTraverse(treeWalker, finishedSubtrees)) {
                    yield treeWalker.currentNode;
                }
            };

            // const blocks: Text[][] = [];
            const blocks: Array<Array<Text>> = [];
            let tmp: Text[] = [];

            const nodes = Array.from(
                getElementsIn(
                    root,
                    (node) => {
                        return acceptNodeIfVisibleInRange(node, range);
                    }),
            );

            for (const node of nodes) {
                if (isText(node)) {
                    tmp.push(node);
                } else if (
                    isElement(node) &&
                    BLOCK_ELEMENTS.includes(node.tagName.toUpperCase()) &&
                    tmp.length > 0) {

                    blocks.push(tmp);
                    tmp = [];
                }
            }
            if (tmp.length > 0) {
                blocks.push(tmp);
            }

            return blocks;
        };

        const textNodeLists = getAllTextNodes(range.commonAncestorContainer, range);
        const segmenter = USE_SEGMENTER ? makeNewSegmenter() : undefined;

        for (const list of textNodeLists) {
            const found = findRangeFromNodeList(query, range, list, segmenter);
            if (found) {
                return found;
            }
        }
        return undefined;
    };

    const makeTextNodeWalker = (range: Range): TreeWalker => {

        const acceptTextNodeIfVisibleInRange = (node: Node, range: Range): typeof NodeFilter.FILTER_REJECT | typeof NodeFilter.FILTER_ACCEPT | typeof NodeFilter.FILTER_SKIP => {
            if (!range.intersectsNode(node))
                return NodeFilter.FILTER_REJECT;

            if (!isNodeVisible(node)) {
                return NodeFilter.FILTER_REJECT;
            }

            return isText(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        };

        const walker = (range.commonAncestorContainer.ownerDocument || window.document).createTreeWalker(
            range.commonAncestorContainer,
            NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
            (node) => {
                return acceptTextNodeIfVisibleInRange(node, range);
            },
        );

        return walker;
    };

    const advanceRangeStartToNonWhitespace = (range: Range) => {
        const walker = makeTextNodeWalker(range);

        let node = walker.nextNode() as Text | null;
        while (!range.collapsed && node) {
            if (node !== range.startContainer) {
                range.setStart(node, 0);
            }

            if (node.textContent !== null && node.textContent.length > range.startOffset) {
                const firstChar = node.textContent[range.startOffset];
                if (!firstChar.match(/\s/)) {
                    return;
                }
            }

            try {
                range.setStart(node, range.startOffset + 1);
            } catch (_err) {
                node = walker.nextNode() as Text | null;
                if (!node) {
                    range.collapse();
                } else {
                    range.setStart(node, 0);
                }
            }
        }
    };

    const CheckSuffixResult = {
        NO_SUFFIX_MATCH: 0,
        SUFFIX_MATCH: 1,
        MISPLACED_SUFFIX: 2,
    };
    const checkSuffix = (suffix: string, potentialMatch: Range, searchRange: Range, documant: Document) => {
        const suffixRange = documant.createRange();
        suffixRange.setStart(potentialMatch.endContainer, potentialMatch.endOffset);
        suffixRange.setEnd(searchRange.endContainer, searchRange.endOffset);
        advanceRangeStartToNonWhitespace(suffixRange);

        const suffixMatch = findTextInRange(suffix, suffixRange);

        if (!suffixMatch) {
            return CheckSuffixResult.NO_SUFFIX_MATCH;
        }

        if (suffixMatch.compareBoundaryPoints(Range.START_TO_START, suffixRange) !== 0) {
            return CheckSuffixResult.MISPLACED_SUFFIX;
        }

        return CheckSuffixResult.SUFFIX_MATCH;
    };

    const advanceRangeStartPastOffset = (range: Range, node: Node, offset: number) => {
        try {
            range.setStart(node, offset + 1);
        } catch (_err) {
            range.setStartAfter(node);
        }
    };

    const results = [];

    const searchRange = documant.createRange();
    searchRange.selectNodeContents(documant.body);

    while (!searchRange.collapsed && results.length < 2) {
        let potentialMatch;
        if (textFragment.prefix) {
            const prefixMatch = findTextInRange(textFragment.prefix, searchRange);
            if (!prefixMatch) {
                break;
            }

            advanceRangeStartPastOffset(searchRange, prefixMatch.startContainer, prefixMatch.startOffset);

            const matchRange = documant.createRange();
            matchRange.setStart(prefixMatch.endContainer, prefixMatch.endOffset);
            matchRange.setEnd(searchRange.endContainer, searchRange.endOffset);

            advanceRangeStartToNonWhitespace(matchRange);
            if (matchRange.collapsed) {
                break;
            }

            potentialMatch = findTextInRange(textFragment.textStart, matchRange);

            if (!potentialMatch) {
                break;
            }

            if (potentialMatch.compareBoundaryPoints(
                Range.START_TO_START,
                matchRange,
            ) !== 0) {
                continue;
            }
        } else {
            potentialMatch = findTextInRange(textFragment.textStart, searchRange);
            if (!potentialMatch) {
                break;
            }
            advanceRangeStartPastOffset(searchRange, potentialMatch.startContainer, potentialMatch.startOffset);
        }

        if (textFragment.textEnd) {
            const textEndRange = documant.createRange();
            textEndRange.setStart(potentialMatch.endContainer, potentialMatch.endOffset);
            textEndRange.setEnd(searchRange.endContainer, searchRange.endOffset);

            let matchFound = false;

            while (!textEndRange.collapsed && results.length < 2) {
                const textEndMatch = findTextInRange(textFragment.textEnd, textEndRange);
                if (!textEndMatch) {
                    break;
                }

                advanceRangeStartPastOffset(textEndRange, textEndMatch.startContainer, textEndMatch.startOffset);

                potentialMatch.setEnd(textEndMatch.endContainer, textEndMatch.endOffset);

                if (textFragment.suffix) {
                    const suffixResult = checkSuffix(textFragment.suffix, potentialMatch, searchRange, documant);
                    if (suffixResult === CheckSuffixResult.NO_SUFFIX_MATCH) {
                        break;
                    } else if (suffixResult === CheckSuffixResult.SUFFIX_MATCH) {
                        matchFound = true;
                        results.push(potentialMatch.cloneRange());
                        continue;
                    } else if (suffixResult === CheckSuffixResult.MISPLACED_SUFFIX) {
                        continue;
                    }
                } else {
                    matchFound = true;
                    results.push(potentialMatch.cloneRange());
                }
            }
            if (!matchFound) {
                break;
            }

        } else if (textFragment.suffix) {
            const suffixResult = checkSuffix(textFragment.suffix, potentialMatch, searchRange, documant);
            if (suffixResult === CheckSuffixResult.NO_SUFFIX_MATCH) {
                break;
            } else if (suffixResult === CheckSuffixResult.SUFFIX_MATCH) {
                results.push(potentialMatch.cloneRange());
                advanceRangeStartPastOffset(searchRange, searchRange.startContainer, searchRange.startOffset);
                continue;
            } else if (suffixResult === CheckSuffixResult.MISPLACED_SUFFIX) {
                continue;
            }
        } else {
            results.push(potentialMatch.cloneRange());
        }
    }
    return results;
};

export const convertRangeToTextFragment = (range: Range): TextFragment | undefined => {

    const BOUNDARY_CHARS = /[\t-\r -#%-\*,-\/:;\?@\[-\]_\{\}\x85\xA0\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u1680\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2000-\u200A\u2010-\u2029\u202F-\u2043\u2045-\u2051\u2053-\u205F\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E44\u3000-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD807[\uDC41-\uDC45\uDC70\uDC71]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/u;

    const NON_BOUNDARY_CHARS = /[^\t-\r -#%-\*,-\/:;\?@\[-\]_\{\}\x85\xA0\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u1680\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2000-\u200A\u2010-\u2029\u202F-\u2043\u2045-\u2051\u2053-\u205F\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E44\u3000-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD807[\uDC41-\uDC45\uDC70\uDC71]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/u;

    const isBlock = (node: Node): node is Element => {
        if (!isElement(node)) {
            return false;
        }
        const tagName = node.tagName.toUpperCase();
        return BLOCK_ELEMENTS.includes(tagName) || tagName === "HTML" || tagName === "BODY";
    };

    const reverseString = (str: string): string => {
        return [...(str || "")].reverse().join("");
    };

    type NodeTextContent = {
        textContent: string;
    }
    const BlockTextAccumulator = class {
        public searchRange: Range;
        public isForwardTraversal: boolean;
        public textFound: boolean;
        public textNodes: NodeTextContent[];
        public textInBlock: string | null;
        constructor(searchRange: Range, isForwardTraversal: boolean) {
            this.searchRange = searchRange;
            this.isForwardTraversal = isForwardTraversal;
            this.textFound = false;
            this.textNodes = [];
            this.textInBlock = null;
        }
        finish() {
            if (this.textFound) {
                if (!this.isForwardTraversal) {
                    this.textNodes.reverse();
                }

                this.textInBlock = this.textNodes.map(textNode => textNode.textContent).join("");
                // TODO: preserve interspersed whitespace
                // const lBeforeTrim = this.textInBlock.length;
                this.textInBlock = this.textInBlock.trim();
                // if (lBeforeTrim > 0 && this.textInBlock.length === 0) {
                //     this.textInBlock = " "; // preserved collapsed whitespaces
                // }
            } else {
                this.textNodes = [];
            }
        }
        appendNode(node: Node) {
            if (this.textInBlock !== null) {
                return;
            }

            if (isBlock(node)) {
                this.finish();
                return;
            }

            if (!isText(node)) {
                return;
            }

            // nodeToInsert.textContent.trim() !== ""
            // nodeToInsert.textContent.trim().length !== 0
            const nodeToInsert = this.getNodeIntersectionWithRange(node);

            if (nodeToInsert) { // nodeToInsert.textContent guaranteed non-null
                this.textFound = true;
                this.textNodes.push(nodeToInsert);
            }
        }

        getNodeIntersectionWithRange(node: Text): NodeTextContent | undefined {
            let startOffset = null;
            let endOffset = null;

            if (node === this.searchRange.startContainer &&
                this.searchRange.startOffset !== 0) {
                startOffset = this.searchRange.startOffset;
            }

            if (node === this.searchRange.endContainer &&
                (!node.textContent || this.searchRange.endOffset !== node.textContent.length)) {
                endOffset = this.searchRange.endOffset;
            }

            if (node.textContent) {
                let str = node.textContent;
                let changed = false;
                if (startOffset !== null || endOffset !== null) {
                    str = node.textContent.substring(startOffset ?? 0, endOffset ?? node.textContent.length);
                    changed = true;
                }

                // TODO: preserve interspersed whitespace
                // const nodeIsFirst = node === node.parentNode?.firstChild;
                // const nodeIsLast = node === node.parentNode?.lastChild;
                // if (!changed && !str.trim().length && !nodeIsFirst && !nodeIsLast) {
                //     str = " "; // collapse contiguous whitespace into single space
                //     changed = true;
                // }

                return changed ? { textContent: str } : node as NodeTextContent;
            }

            return undefined;
        }
    };

    const WORDS_TO_ADD_SUBSEQUENT_ITERATIONS = 1;
    const WORDS_TO_ADD_FIRST_ITERATION = 3;
    const MIN_LENGTH_WITHOUT_CONTEXT = 20;
    const ITERATIONS_BEFORE_ADDING_CONTEXT = 1;
    const FragmentFactoryMode = {
        ALL_PARTS: 1,
        SHARED_START_AND_END: 2,
        CONTEXT_ONLY: 3,
    };
    const FragmentFactory = class {

        public mode: typeof FragmentFactoryMode[keyof typeof FragmentFactoryMode] | undefined;

        public exactTextMatch: string | undefined;

        public startSegments: Intl.Segments | undefined;
        public endSegments: Intl.Segments | undefined;
        public sharedSegments: Intl.Segments | undefined;
        public prefixSegments: Intl.Segments | undefined;
        public suffixSegments: Intl.Segments | undefined;

        public startOffset: number | null;
        public endOffset: number | null;
        public prefixOffset: number | null;
        public suffixOffset: number | null;

        public prefixSearchSpace: string;
        public backwardsPrefixSearchSpace: string;

        public suffixSearchSpace: string;
        // public backwardsSuffixSearchSpace: string;

        public sharedSearchSpace: string;
        public backwardsSharedSearchSpace: string;

        public startSearchSpace: string;
        // public backwardsStartSearchSpace: string;

        public endSearchSpace: string;
        public backwardsEndSearchSpace: string;

        public numIterations: number;

        constructor() {
            this.startOffset = null;
            this.endOffset = null;
            this.prefixOffset = null;
            this.suffixOffset = null;

            this.prefixSearchSpace = "";
            this.backwardsPrefixSearchSpace = "";

            this.suffixSearchSpace = "";
            // this.backwardsSuffixSearchSpace = "";

            this.sharedSearchSpace = "";
            this.backwardsSharedSearchSpace = "";

            this.startSearchSpace = "";
            // this.backwardsStartSearchSpace = "";

            this.endSearchSpace = "";
            this.backwardsEndSearchSpace = "";

            this.numIterations = 0;
        }

        tryToMakeUniqueFragment() {
            let fragment: TextFragment | undefined;
            if (this.mode === FragmentFactoryMode.CONTEXT_ONLY) {
                if (!this.exactTextMatch) {
                    return undefined;
                }
                fragment = { textStart: this.exactTextMatch };
            } else {
                if (this.startOffset === null || this.endOffset === null) {
                    return undefined;
                }
                fragment = {
                    textStart: this.getStartSearchSpace().substring(0, this.startOffset).trim(),
                    textEnd: this.getEndSearchSpace().substring(this.endOffset).trim(),
                };
            }
            if (this.prefixOffset !== null) {
                const prefix = this.prefixSearchSpace.substring(this.prefixOffset).trim();
                if (prefix) {
                    fragment.prefix = prefix;
                }
            }
            if (this.suffixOffset) {
                const suffix = this.suffixSearchSpace.substring(0, this.suffixOffset).trim();
                if (suffix) {
                    fragment.suffix = suffix;
                }
            }
            return isUniquelyIdentifying(fragment) ? fragment : undefined;
        }

        embiggen() {
            let canExpandRange = true;

            if (this.mode === FragmentFactoryMode.SHARED_START_AND_END) {

                if (this.startOffset !== null && this.endOffset !== null && this.startOffset >= this.endOffset) {
                    canExpandRange = false;
                }
            } else if (this.mode === FragmentFactoryMode.ALL_PARTS) {
                if (this.startOffset === this.getStartSearchSpace().length &&
                    this.backwardsEndOffset() === this.getEndSearchSpace().length) {
                    canExpandRange = false;
                }
            } else if (this.mode === FragmentFactoryMode.CONTEXT_ONLY) {
                canExpandRange = false;
            }

            if (canExpandRange) {
                const desiredIterations = this.getNumberOfRangeWordsToAdd();
                if (this.startOffset !== null && this.startOffset < this.getStartSearchSpace().length) {
                    let i = 0;
                    if (this.getStartSegments()) {
                        while (i < desiredIterations &&
                            this.startOffset < this.getStartSearchSpace().length) {
                            this.startOffset = this.getNextOffsetForwards(
                                this.getStartSegments(),
                                this.startOffset,
                                this.getStartSearchSpace());
                            i++;
                        }
                    } else {
                        let oldStartOffset = this.startOffset;
                        do {
                            const newStartOffset: number = this.getStartSearchSpace().substring(this.startOffset + 1).search(BOUNDARY_CHARS);
                            if (newStartOffset === -1) {
                                this.startOffset = this.getStartSearchSpace().length;
                            } else {
                                this.startOffset = this.startOffset + 1 + newStartOffset;
                            }

                            if (this.startOffset !== null &&
                                this.getStartSearchSpace().substring(oldStartOffset, this.startOffset).search(NON_BOUNDARY_CHARS) !== -1) {
                                oldStartOffset = this.startOffset;
                                i++;
                            }
                        } while (this.startOffset !== null && this.startOffset < this.getStartSearchSpace().length && i < desiredIterations);
                    }

                    if (this.startOffset !== null && this.endOffset !== null && this.mode === FragmentFactoryMode.SHARED_START_AND_END) {
                        this.startOffset = Math.min(this.startOffset, this.endOffset);
                    }
                }

                if (this.backwardsEndOffset() < this.getEndSearchSpace().length) {
                    let i = 0;
                    if (this.getEndSegments()) {
                        while (this.endOffset !== null && i < desiredIterations && this.endOffset > 0) {
                            this.endOffset = this.getNextOffsetBackwards(this.getEndSegments(), this.endOffset);
                            i++;
                        }
                    } else {
                        let oldBackwardsEndOffset = this.backwardsEndOffset();
                        do {
                            const newBackwardsOffset = this.getBackwardsEndSearchSpace().substring(this.backwardsEndOffset() + 1).search(BOUNDARY_CHARS);
                            if (newBackwardsOffset === -1) {
                                this.setBackwardsEndOffset(this.getEndSearchSpace().length);
                            } else {
                                this.setBackwardsEndOffset(this.backwardsEndOffset() + 1 + newBackwardsOffset);
                            }

                            if (this.getBackwardsEndSearchSpace().substring(oldBackwardsEndOffset, this.backwardsEndOffset()).search(NON_BOUNDARY_CHARS) !== -1) {
                                oldBackwardsEndOffset = this.backwardsEndOffset();
                                i++;
                            }
                        } while (this.backwardsEndOffset() < this.getEndSearchSpace().length && i < desiredIterations);
                    }
                    if (this.startOffset !== null && this.endOffset !== null && this.mode === FragmentFactoryMode.SHARED_START_AND_END) {
                        this.endOffset = Math.max(this.startOffset, this.endOffset);
                    }
                }
            }

            let canExpandContext = false;
            if (!canExpandRange ||
                (this.startOffset !== null &&
                    ((this.startOffset + this.backwardsEndOffset()) < MIN_LENGTH_WITHOUT_CONTEXT)) ||
                this.numIterations >= ITERATIONS_BEFORE_ADDING_CONTEXT) {

                if ((this.backwardsPrefixOffset() !== null && this.backwardsPrefixOffset() !== this.prefixSearchSpace.length) ||
                    (this.suffixOffset !== null && this.suffixOffset !== this.suffixSearchSpace.length)) {

                    canExpandContext = true;
                }
            }

            if (canExpandContext) {
                const desiredIterations = this.getNumberOfContextWordsToAdd();
                if ((this.backwardsPrefixOffset() || 0) < this.prefixSearchSpace.length) {
                    let i = 0;
                    if (this.prefixSegments) {
                        while (this.prefixOffset !== null && i < desiredIterations && this.prefixOffset > 0) {
                            this.prefixOffset = this.getNextOffsetBackwards(this.prefixSegments, this.prefixOffset);
                            i++;
                        }
                    } else {
                        let oldBackwardsPrefixOffset = this.backwardsPrefixOffset();
                        do {
                            const newBackwardsPrefixOffset = this.backwardsPrefixSearchSpace.substring((this.backwardsPrefixOffset() || 0) + 1).search(BOUNDARY_CHARS);
                            if (newBackwardsPrefixOffset === -1) {
                                this.setBackwardsPrefixOffset(this.backwardsPrefixSearchSpace.length);
                            } else {
                                this.setBackwardsPrefixOffset((this.backwardsPrefixOffset() || 0) + 1 + newBackwardsPrefixOffset);
                            }
                            if (this.backwardsPrefixSearchSpace.substring(oldBackwardsPrefixOffset || 0, this.backwardsPrefixOffset() || 0).search(NON_BOUNDARY_CHARS) !== -1) {
                                oldBackwardsPrefixOffset = this.backwardsPrefixOffset();
                                i++;
                            }
                        } while ((this.backwardsPrefixOffset() || 0) < this.prefixSearchSpace.length &&
                            i < desiredIterations);
                    }
                }
                if (this.suffixOffset !== null && this.suffixOffset < this.suffixSearchSpace.length) {
                    let i = 0;
                    if (this.suffixSegments) {
                        while (this.suffixOffset !== null &&
                            i < desiredIterations &&
                            this.suffixOffset < this.suffixSearchSpace.length) {
                            this.suffixOffset = this.getNextOffsetForwards(
                                this.suffixSegments,
                                this.suffixOffset,
                                this.suffixSearchSpace);
                            i++;
                        }
                    } else {
                        let oldSuffixOffset = this.suffixOffset;
                        do {
                            const newSuffixOffset: number = this.suffixSearchSpace.substring(this.suffixOffset + 1).search(BOUNDARY_CHARS);
                            if (newSuffixOffset === -1) {
                                this.suffixOffset = this.suffixSearchSpace.length;
                            } else {
                                this.suffixOffset = this.suffixOffset + 1 + newSuffixOffset;
                            }

                            if (this.suffixOffset !== null &&
                                this.suffixSearchSpace.substring(oldSuffixOffset, this.suffixOffset).search(NON_BOUNDARY_CHARS) !== -1) {
                                oldSuffixOffset = this.suffixOffset;
                                i++;
                            }
                        } while (this.suffixOffset !== null &&
                        this.suffixOffset < this.suffixSearchSpace.length &&
                            i < desiredIterations);
                    }
                }
            }
            this.numIterations++;

            return canExpandRange || canExpandContext;
        }

        setStartAndEndSearchSpace(startSearchSpace: string, endSearchSpace: string) {
            this.startSearchSpace = startSearchSpace;
            // this.backwardsStartSearchSpace = reverseString(startSearchSpace);

            this.endSearchSpace = endSearchSpace;
            this.backwardsEndSearchSpace = reverseString(endSearchSpace);

            this.startOffset = 0;
            this.endOffset = endSearchSpace.length;

            this.mode = FragmentFactoryMode.ALL_PARTS;
        }

        setSharedSearchSpace(sharedSearchSpace: string) {
            this.sharedSearchSpace = sharedSearchSpace;
            this.backwardsSharedSearchSpace = reverseString(sharedSearchSpace);

            this.startOffset = 0;
            this.endOffset = sharedSearchSpace.length;

            this.mode = FragmentFactoryMode.SHARED_START_AND_END;
        }

        setExactTextMatch(exactTextMatch: string) {
            this.exactTextMatch = exactTextMatch;

            this.mode = FragmentFactoryMode.CONTEXT_ONLY;
        }

        setPrefixAndSuffixSearchSpace(prefixSearchSpace: string | undefined, suffixSearchSpace: string | undefined) {
            if (prefixSearchSpace) {
                this.prefixSearchSpace = prefixSearchSpace;
                this.backwardsPrefixSearchSpace = reverseString(prefixSearchSpace);

                this.prefixOffset = prefixSearchSpace.length;
            }

            if (suffixSearchSpace) {
                this.suffixSearchSpace = suffixSearchSpace;
                // this.backwardsSuffixSearchSpace = reverseString(suffixSearchSpace);

                this.suffixOffset = 0;
            }
        }

        useSegmenter(segmenter: Intl.Segmenter) {
            if (this.mode === FragmentFactoryMode.ALL_PARTS) {
                this.startSegments = segmenter.segment(this.startSearchSpace);
                this.endSegments = segmenter.segment(this.endSearchSpace);
            } else if (this.mode === FragmentFactoryMode.SHARED_START_AND_END) {
                this.sharedSegments = segmenter.segment(this.sharedSearchSpace);
            }

            if (this.prefixSearchSpace) {
                this.prefixSegments = segmenter.segment(this.prefixSearchSpace);
            }
            if (this.suffixSearchSpace) {
                this.suffixSegments = segmenter.segment(this.suffixSearchSpace);
            }
        }

        getNumberOfContextWordsToAdd(): number {
            return (this.backwardsPrefixOffset() === 0 && this.suffixOffset === 0) ?
                WORDS_TO_ADD_FIRST_ITERATION :
                WORDS_TO_ADD_SUBSEQUENT_ITERATIONS;
        }

        getNumberOfRangeWordsToAdd(): number {
            return (this.startOffset === 0 && this.backwardsEndOffset() === 0) ?
                WORDS_TO_ADD_FIRST_ITERATION :
                WORDS_TO_ADD_SUBSEQUENT_ITERATIONS;
        }

        getNextOffsetForwards(segments: Intl.Segments | undefined, offset: number, searchSpace: string): number {
            if (!segments) {
                return 0;
            }

            let currentSegment = segments.containing(offset);
            while (currentSegment) {

                const currentSegmentEnd = currentSegment.index + currentSegment.segment.length;
                if (currentSegment.isWordLike) {
                    return currentSegmentEnd;
                }
                currentSegment = segments.containing(currentSegmentEnd);
            }

            return searchSpace.length;
        }

        getNextOffsetBackwards(segments: Intl.Segments | undefined, offset: number): number {
            if (!segments) {
                return 0;
            }

            let currentSegment = segments.containing(offset);

            if (!currentSegment || offset === currentSegment.index) {

                currentSegment = segments.containing(offset - 1);
            }

            while (currentSegment) {

                if (currentSegment.isWordLike) {
                    return currentSegment.index;
                }
                currentSegment = segments.containing(currentSegment.index - 1);
            }

            return 0;
        }

        getStartSearchSpace(): string {
            return this.mode === FragmentFactoryMode.SHARED_START_AND_END ? this.sharedSearchSpace : this.startSearchSpace;
        }

        getStartSegments(): Intl.Segments | undefined {
            return this.mode === FragmentFactoryMode.SHARED_START_AND_END ? this.sharedSegments : this.startSegments;
        }

        getEndSearchSpace(): string {
            return this.mode === FragmentFactoryMode.SHARED_START_AND_END ? this.sharedSearchSpace : this.endSearchSpace;
        }

        getEndSegments(): Intl.Segments | undefined {
            return this.mode === FragmentFactoryMode.SHARED_START_AND_END ? this.sharedSegments : this.endSegments;
        }

        getBackwardsEndSearchSpace(): string {
            return this.mode === FragmentFactoryMode.SHARED_START_AND_END ?
                this.backwardsSharedSearchSpace :
                this.backwardsEndSearchSpace;
        }

        backwardsEndOffset(): number {
            return this.getEndSearchSpace().length - (this.endOffset || 0);
        }

        setBackwardsEndOffset(backwardsEndOffset: number) {
            this.endOffset = this.getEndSearchSpace().length - backwardsEndOffset;
        }

        backwardsPrefixOffset(): number | null {
            if (this.prefixOffset === null) {
                return null;
            }
            return this.prefixSearchSpace.length - this.prefixOffset;
        }

        setBackwardsPrefixOffset(backwardsPrefixOffset: number) {
            if (this.prefixOffset === null) {
                return;
            }
            this.prefixOffset = this.prefixSearchSpace.length - backwardsPrefixOffset;
        }
    };

    const isUniquelyIdentifying = (fragment: TextFragment): boolean => {
        return convertTextFragmentToRanges(fragment, window.document).length === 1;
    };

    const getFirstNodeForBlockSearch = (range: Range): Node => {
        let node = range.startContainer;
        if (isElement(node) &&
            range.startOffset < node.childNodes.length) {
            node = node.childNodes[range.startOffset];
        }
        return node;
    };

    const backwardTraverse = (walker: TreeWalker, finishedSubtrees: Set<Node>): Node | null => {

        if (!finishedSubtrees.has(walker.currentNode)) {
            const lastChild = walker.lastChild();
            if (lastChild) {
                return lastChild;
            }
        }

        const previousSibling = walker.previousSibling();
        if (previousSibling) {
            return previousSibling;
        }

        const parent = walker.parentNode();

        if (parent) {
            finishedSubtrees.add(parent);
        }

        return parent;
    };

    const makeWalkerForNode = (node: Node, endNode?: Node): TreeWalker => {
        let blockAncestor = node;
        const endNodeNotNull = endNode ? endNode : node;
        while (!blockAncestor.contains(endNodeNotNull) ||
            !isBlock(blockAncestor)) {
            if (blockAncestor.parentNode) {
                blockAncestor = blockAncestor.parentNode;
            } else {
                break;
            }
        }

        const walker = (blockAncestor.ownerDocument || window.document).createTreeWalker(
            blockAncestor,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
            (node) => {
                return acceptNodeIfVisibleInRange(node, undefined);
            });

        walker.currentNode = node;
        return walker;
    };

    const containsBlockBoundary = (range: Range): boolean => {
        const tempRange = range.cloneRange();
        let node: Node | null = getFirstNodeForBlockSearch(tempRange);
        if (!node) {
            return false;
        }
        const walker = makeWalkerForNode(node);
        const finishedSubtrees = new Set<Node>();

        while (!tempRange.collapsed && node) {
            if (isBlock(node)) {
                return true;
            }
            if (node) {
                tempRange.setStartAfter(node);
            }
            node = forwardTraverse(walker, finishedSubtrees);
        }
        return false;
    };

    const MAX_EXACT_MATCH_LENGTH = 300;
    const canUseExactMatch = (range: Range): boolean => {
        if (range.toString().length > MAX_EXACT_MATCH_LENGTH) {
            return false;
        }
        return !containsBlockBoundary(range);
    };

    const getSearchSpaceForStart = (range: Range) => {
        let node: Node | null = getFirstNodeForBlockSearch(range);
        if (!node) {
            return undefined;
        }
        const walker = makeWalkerForNode(node, range.endContainer);
        const finishedSubtrees = new Set<Node>();

        if (isElement(range.startContainer) && range.startOffset === range.startContainer.childNodes.length) {
            finishedSubtrees.add(range.startContainer);
        }
        const origin = node;
        const textAccumulator = new BlockTextAccumulator(range, true);

        const tempRange = range.cloneRange();
        while (!tempRange.collapsed && node) {

            if (node.contains(origin)) {
                tempRange.setStartAfter(node);
            } else {
                tempRange.setStartBefore(node);
            }

            textAccumulator.appendNode(node);

            if (textAccumulator.textInBlock !== null) {
                return textAccumulator.textInBlock;
            }

            node = forwardTraverse(walker, finishedSubtrees);
        }

        // textAccumulator.finish();
        // if (textAccumulator.textInBlock !== null) {
        //     return textAccumulator.textInBlock;
        // }

        return undefined;
    };

    const getLastNodeForBlockSearch = (range: Range) => {
        let node = range.endContainer;
        if (isElement(node) && range.endOffset > 0) {
            node = node.childNodes[range.endOffset - 1];
        }
        return node;
    };

    const getSearchSpaceForEnd = (range: Range) => {
        let node: Node | null = getLastNodeForBlockSearch(range);
        if (!node) {
            return undefined;
        }
        const walker = makeWalkerForNode(node, range.startContainer);
        const finishedSubtrees = new Set<Node>();

        if (isElement(range.endContainer) &&
            range.endOffset === 0) {
            finishedSubtrees.add(range.endContainer);
        }

        const origin = node;
        const textAccumulator = new BlockTextAccumulator(range, false);

        const tempRange = range.cloneRange();
        while (!tempRange.collapsed && node) {

            if (node.contains(origin)) {
                tempRange.setEnd(node, 0);
            } else {
                tempRange.setEndAfter(node);
            }

            textAccumulator.appendNode(node);

            if (textAccumulator.textInBlock !== null) {
                return textAccumulator.textInBlock;
            }

            node = backwardTraverse(walker, finishedSubtrees);
        }

        // textAccumulator.finish();
        // if (textAccumulator.textInBlock !== null) {
        //     return textAccumulator.textInBlock;
        // }

        return undefined;
    };

    // if (FORCE_WORD_ALIGNMENT) {
    //     expandRangeStartToWordBound(range);
    //     expandRangeEndToWordBound(range);
    // }
    const rangeBeforeShrinking = FORCE_WORD_ALIGNMENT ? range.cloneRange() : range;
    // if (FORCE_WORD_ALIGNMENT) {
    //     moveRangeEdgesToTextNodes(range);
    // }

    let factory;

    const doExactMatch = canUseExactMatch(range);
    if (doExactMatch) {
        const exactText = normalizeString(range.toString());
        const fragment: TextFragment = {
            textStart: exactText,
        };

        if (exactText.length >= MIN_LENGTH_WITHOUT_CONTEXT && isUniquelyIdentifying(fragment)) {
            return fragment;
        }

        factory = new FragmentFactory();
        factory.setExactTextMatch(exactText);
    } else {
        const startSearchSpace = getSearchSpaceForStart(range);
        const endSearchSpace = getSearchSpaceForEnd(range);

        if (startSearchSpace && endSearchSpace) {
            factory = new FragmentFactory();
            factory.setStartAndEndSearchSpace(startSearchSpace, endSearchSpace);
        } else {
            factory = new FragmentFactory();
            factory.setSharedSearchSpace(range.toString().trim());
        }
    }

    const documant = rangeBeforeShrinking.startContainer.ownerDocument || window.document;
    const prefixRange = documant.createRange();
    prefixRange.selectNodeContents(documant.body);
    const suffixRange = prefixRange.cloneRange();
    prefixRange.setEnd(rangeBeforeShrinking.startContainer, rangeBeforeShrinking.startOffset);
    suffixRange.setStart(rangeBeforeShrinking.endContainer, rangeBeforeShrinking.endOffset);

    const prefixSearchSpace = getSearchSpaceForEnd(prefixRange);
    const suffixSearchSpace = getSearchSpaceForStart(suffixRange);

    if (prefixSearchSpace || suffixSearchSpace) {
        factory.setPrefixAndSuffixSearchSpace(prefixSearchSpace, suffixSearchSpace);
    }

    const segmenter = USE_SEGMENTER ? makeNewSegmenter() : undefined;
    if (segmenter) {
        factory.useSegmenter(segmenter);
    }

    let didEmbiggen = false;
    do {
        didEmbiggen = factory.embiggen();
        const fragment = factory.tryToMakeUniqueFragment();
        if (fragment) {
            return fragment;
        }
    } while (didEmbiggen);

    return undefined;
};

// // FORCE_WORD_ALIGNMENT
// const isWordBounded = (text: string, startPos: number, length: number, segmenter: Intl.Segmenter | undefined): boolean => {
//     if (startPos < 0 || startPos >= text.length || length <= 0 || startPos + length > text.length) {
//         return false;
//     }

//     if (segmenter) {
//         const segments = segmenter.segment(text);
//         const startSegment = segments.containing(startPos);
//         if (!startSegment) {
//             return false;
//         }
//         if (startSegment.isWordLike && startSegment.index !== startPos) {
//             return false;
//         }

//         const endPos = startPos + length;
//         const endSegment = segments.containing(endPos);

//         if (endSegment && endSegment.isWordLike && endSegment.index !== endPos) {
//             return false;
//         }
//     } else {
//         if (text[startPos].match(BOUNDARY_CHARS)) {
//             ++startPos;
//             --length;
//             if (!length) {
//                 return false;
//             }
//         }

//         if (text[startPos + length - 1].match(BOUNDARY_CHARS)) {
//             --length;
//             if (!length) {
//                 return false;
//             }
//         }

//         if (startPos !== 0 && (!text[startPos - 1].match(BOUNDARY_CHARS))) {
//             return false;
//         }

//         if (startPos + length !== text.length &&
//             !text[startPos + length].match(BOUNDARY_CHARS))
//             return false;
//     }

//     return true;
// };

// // FORCE_WORD_ALIGNMENT
// const getFirstTextNode = (range: Range): Text | null => {
//     const firstNode = getFirstNodeForBlockSearch(range);
//     if (isText(firstNode) && isNodeVisible(firstNode)) {
//         return firstNode;
//     }

//     const walker = makeTextNodeWalker(range);
//     walker.currentNode = firstNode;

//     return walker.nextNode() as Text | null;

//     // const finishedSubtrees = new Set<Node>();
//     // return forwardTraverse(walker, finishedSubtrees);
// };

// // FORCE_WORD_ALIGNMENT
// const getLastTextNode = (range: Range): Node | null => {
//     const lastNode = getLastNodeForBlockSearch(range);
//     if (isText(lastNode) && isNodeVisible(lastNode)) {
//         return lastNode;
//     }

//     const walker = makeTextNodeWalker(range);
//     walker.currentNode = lastNode;

//     // return walker.previousNode();

//     const finishedSubtrees = new Set<Node>();
//     return backwardTraverse(walker, finishedSubtrees);
// };

// // FORCE_WORD_ALIGNMENT
// const moveRangeEdgesToTextNodes = (range: Range) => {
//     const firstTextNode = getFirstTextNode(range);

//     if (!firstTextNode) {
//         range.collapse();
//         return;
//     }

//     const firstNode = getFirstNodeForBlockSearch(range);

//     if (firstNode !== firstTextNode) {
//         range.setStart(firstTextNode, 0);
//     }

//     const lastNode = getLastNodeForBlockSearch(range);
//     const lastTextNode = getLastTextNode(range);

//     if (lastTextNode && isText(lastTextNode) && lastTextNode.textContent && lastNode !== lastTextNode) {
//         range.setEnd(lastTextNode, lastTextNode.textContent.length);
//     }
// };

// // FORCE_WORD_ALIGNMENT
// const findWordStartBoundInTextNode = (node: Node, startOffset: number | null) => {
//     if (node.nodeType !== Node.TEXT_NODE || node.textContent === null) {
//         return -1;
//     }

//     const offset = startOffset !== null ? startOffset : node.textContent.length;

//     if (offset < node.textContent.length && BOUNDARY_CHARS.test(node.textContent[offset])) {
//         return offset;
//     }

//     const precedingText = node.textContent.substring(0, offset);
//     const boundaryIndex = reverseString(precedingText).search(BOUNDARY_CHARS);

//     if (boundaryIndex !== -1) {
//         return offset - boundaryIndex;
//     }
//     return -1;
// };

// // FORCE_WORD_ALIGNMENT
// const findWordEndBoundInTextNode = (node: Node, endOffset: number | null) => {
//     if (node.nodeType !== Node.TEXT_NODE || node.textContent === null) {
//         return -1;
//     }

//     const offset = endOffset !== null ? endOffset : 0;

//     if (offset < node.textContent.length && offset > 0 &&
//         BOUNDARY_CHARS.test(node.textContent[offset - 1])) {
//         return offset;
//     }

//     const followingText = node.textContent.substring(offset);
//     const boundaryIndex = followingText.search(BOUNDARY_CHARS);

//     if (boundaryIndex !== -1) {
//         return offset + boundaryIndex;
//     }
//     return -1;
// };

// // FORCE_WORD_ALIGNMENT
// const getTextNodesInSameBlock = (node: Node): { preNodes: Node[], innerNodes: Node[], postNodes: Node[] } => {
//     const preNodes = [];

//     const backWalker = makeWalkerForNode(node);

//     const finishedSubtrees = new Set<Node>();
//     let backNode = backwardTraverse(backWalker, finishedSubtrees);
//     while (backNode && !isBlock(backNode)) {

//         if (backNode.nodeType === Node.TEXT_NODE) {
//             preNodes.push(backNode);
//         }
//         backNode = backwardTraverse(backWalker, finishedSubtrees);
//     };
//     preNodes.reverse();

//     const innerNodes = [];
//     if (node.nodeType === Node.TEXT_NODE) {
//         innerNodes.push(node);
//     } else {
//         const walker = window.document.createTreeWalker(
//             node,
//             NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
//             (node) => {
//                 return acceptNodeIfVisibleInRange(node, undefined);
//             });
//         walker.currentNode = node;
//         let child = walker.nextNode();
//         while (child) {

//             if (child.nodeType === Node.TEXT_NODE) {
//                 innerNodes.push(child);
//             }
//             child = walker.nextNode();
//         }
//     }

//     const postNodes = [];
//     const forwardWalker = makeWalkerForNode(node);

//     const finishedSubtreesForward = new Set([node]);
//     let forwardNode = forwardTraverse(forwardWalker, finishedSubtreesForward);
//     while (forwardNode && !isBlock(forwardNode)) {

//         if (forwardNode.nodeType === Node.TEXT_NODE) {
//             postNodes.push(forwardNode);
//         }
//         forwardNode = forwardTraverse(forwardWalker, finishedSubtreesForward);
//     }

//     return { preNodes: preNodes, innerNodes: innerNodes, postNodes: postNodes };
// };

// // FORCE_WORD_ALIGNMENT
// const expandToNearestWordBoundaryPointUsingSegments = (segmenter: Intl.Segmenter, isRangeEnd: boolean, range: Range) => {
//     const boundary = isRangeEnd ?
//         { node: range.endContainer, offset: range.endOffset } :
//         { node: range.startContainer, offset: range.startOffset };

//     const nodes = getTextNodesInSameBlock(boundary.node);
//     const preNodeText = nodes.preNodes.reduce((prev, cur) => {
//         return prev.concat(cur.textContent || "");
//     }, "");

//     const innerNodeText = nodes.innerNodes.reduce((prev, cur) => {
//         return prev.concat(cur.textContent || "");
//     }, "");

//     let offsetInText = preNodeText.length;
//     if (boundary.node.nodeType === Node.TEXT_NODE) {
//         offsetInText += boundary.offset;
//     } else if (isRangeEnd) {
//         offsetInText += innerNodeText.length;
//     }

//     const postNodeText = nodes.postNodes.reduce((prev, cur) => {
//         return prev.concat(cur.textContent || "");
//     }, "");

//     const allNodes = [...nodes.preNodes, ...nodes.innerNodes, ...nodes.postNodes];

//     if (allNodes.length === 0) {
//         return;
//     }

//     const text = preNodeText.concat(innerNodeText, postNodeText);

//     const segments = segmenter.segment(text);
//     const foundSegment = segments.containing(offsetInText);

//     if (!foundSegment) {
//         if (isRangeEnd) {
//             range.setEndAfter(allNodes[allNodes.length - 1]);
//         } else {
//             range.setEndBefore(allNodes[0]);
//         }
//         return;
//     }

//     if (!foundSegment.isWordLike) {
//         return;
//     }

//     if (offsetInText === foundSegment.index ||
//         offsetInText === foundSegment.index + foundSegment.segment.length) {
//         return;
//     }

//     const desiredOffsetInText = isRangeEnd ?
//         foundSegment.index + foundSegment.segment.length :
//         foundSegment.index;
//     let newNodeIndexInText = 0;
//     for (const node of allNodes) {
//         if (node.textContent === null) {
//             continue;
//         }
//         if (newNodeIndexInText <= desiredOffsetInText &&
//             desiredOffsetInText < newNodeIndexInText + node.textContent.length) {
//             const offsetInNode = desiredOffsetInText - newNodeIndexInText;
//             if (isRangeEnd) {
//                 if (offsetInNode >= node.textContent.length) {
//                     range.setEndAfter(node);
//                 } else {
//                     range.setEnd(node, offsetInNode);
//                 }
//             } else {
//                 if (offsetInNode >= node.textContent.length) {
//                     range.setStartAfter(node);
//                 } else {
//                     range.setStart(node, offsetInNode);
//                 }
//             }
//             return;
//         }
//         newNodeIndexInText += node.textContent.length;
//     }

//     if (isRangeEnd) {
//         range.setEndAfter(allNodes[allNodes.length - 1]);
//     } else {
//         range.setStartBefore(allNodes[0]);
//     }
// };

// // FORCE_WORD_ALIGNMENT
// const expandRangeStartToWordBound = (range: Range) => {
//     const segmenter = USE_SEGMENTER ? makeNewSegmenter() : undefined;
//     if (segmenter) {
//         const startNode = getFirstNodeForBlockSearch(range);
//         if (startNode !== range.startContainer) {
//             range.setStartBefore(startNode);
//         }

//         expandToNearestWordBoundaryPointUsingSegments(segmenter, false, range);
//     } else {
//         const newOffset = findWordStartBoundInTextNode(range.startContainer, range.startOffset);
//         if (newOffset !== -1) {
//             range.setStart(range.startContainer, newOffset);
//             return;
//         }

//         if (isBlock(range.startContainer) && range.startOffset === 0) {
//             return;
//         }

//         const walker = makeWalkerForNode(range.startContainer);
//         if (!walker) {
//             return;
//         }
//         const finishedSubtrees = new Set<Node>();

//         let node = backwardTraverse(walker, finishedSubtrees);
//         while (node) {
//             const newOffset = findWordStartBoundInTextNode(node, null);
//             if (newOffset !== -1) {
//                 range.setStart(node, newOffset);
//                 return;
//             }

//             if (isBlock(node)) {
//                 if (node.contains(range.startContainer)) {
//                     range.setStart(node, 0);
//                 } else {
//                     range.setStartAfter(node);
//                 }
//                 return;
//             }

//             node = backwardTraverse(walker, finishedSubtrees);

//             range.collapse();
//         }
//     }
// };

// // FORCE_WORD_ALIGNMENT
// const expandRangeEndToWordBound = (range: Range) => {
//     const segmenter = USE_SEGMENTER ? makeNewSegmenter() : undefined;
//     if (segmenter) {
//         const endNode = getLastNodeForBlockSearch(range);
//         if (endNode !== range.endContainer) {
//             range.setEndAfter(endNode);
//         }
//         expandToNearestWordBoundaryPointUsingSegments(segmenter, true, range);
//     } else {
//         let initialOffset: number | null = range.endOffset;

//         let node: Node | null = range.endContainer;
//         if (node.nodeType === Node.ELEMENT_NODE) {
//             if (range.endOffset < node.childNodes.length) {
//                 node = node.childNodes[range.endOffset];
//             }
//         }

//         const walker = makeWalkerForNode(node);
//         if (!walker) {
//             return;
//         }

//         const finishedSubtrees = new Set<Node>([node]);

//         while (node) {

//             const newOffset = findWordEndBoundInTextNode(node, initialOffset);

//             initialOffset = null;

//             if (newOffset !== -1) {
//                 range.setEnd(node, newOffset);
//                 return;
//             }

//             if (isBlock(node)) {
//                 if (node.contains(range.endContainer)) {
//                     range.setEnd(node, node.childNodes.length);
//                 } else {
//                     range.setEndBefore(node);
//                 }
//                 return;
//             }

//             node = forwardTraverse(walker, finishedSubtrees);
//         }

//         range.collapse();
//     }
// };
