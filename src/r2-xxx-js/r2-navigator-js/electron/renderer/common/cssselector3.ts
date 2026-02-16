// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// @medv/finder v3.1.0
// https://github.com/antonmedv/finder/blob/df88b7266bdf21fc657efc00469001c2af04b433/finder.ts
// NEW MAJOR VERSION:
// https://github.com/antonmedv/finder/blob/4.0.2/finder.ts

// r2-FORK: replaced "CSS.escape()" with "CSSEscape()"
// This polyfill automatically invokes the native CSS.escape API if available
// https://github.com/mathiasbynens/CSS.escape/blob/4b25c283eaf4dd443f44a7096463e973d56dd1b2/css.escape.js#L16-L18
// https://developer.mozilla.org/en-US/docs/Web/API/CSS/escape_static
import * as CSSEscape from "css.escape";

type Knot = {
    name: string
    penalty: number
    level?: number
}

type Path = Knot[]

export type Options = {
    root: Element
    idName: (name: string) => boolean
    className: (name: string) => boolean
    tagName: (name: string) => boolean
    attr: (name: string, value: string) => boolean
    seedMinLength: number
    optimizedMinLength: number
    threshold: number
    maxNumberOfTries: number
}

let config: Options;
let rootDocument: Document | Element;

// r2-FORK: "finder" replaced with "uniqueCssSelector"
// r2-FORK: added "doc: Document" function argument
export function uniqueCssSelector(input: Element, doc: Document, options?: Partial<Options>) {
    if (input.nodeType !== Node.ELEMENT_NODE) {
        throw new Error("Can't generate CSS selector for non-element node type.");
    }

    // fast path: static cache
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((input as any).__r2CssSelector) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (input as any).__r2CssSelector;
    }

    if ("html" === input.tagName.toLowerCase()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (input as any).__r2CssSelector = "html";
        return "html";
    }
    const defaults: Options = {
        root: doc.body, // r2-FORK: replaced "document" with "doc" (function argument)
        idName: (_name: string) => true,
        className: (_name: string) => true,
        tagName: (_name: string) => true,
        attr: (_name: string, _value: string) => false,
        seedMinLength: 1,
        optimizedMinLength: 2,
        threshold: 1000,
        maxNumberOfTries: 10000,
    };

    config = { ...defaults, ...options };
    rootDocument = findRootDocument(config.root, defaults);

    let path =
        bottomUpSearch(input, "all",
            () => bottomUpSearch(input, "two",
                () => bottomUpSearch(input, "one",
                    () => bottomUpSearch(input, "none"))));

    if (path) {
        const optimized = sort(optimize(path, input));
        if (optimized.length > 0) {
            path = optimized[0];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (input as any).__r2CssSelector = selector(path);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (input as any).__r2CssSelector;
    } else {
        throw new Error("Selector was not found.");
    }
}

function findRootDocument(rootNode: Element | Document, defaults: Options) {
    if (rootNode.nodeType === Node.DOCUMENT_NODE) {
        return rootNode;
    }
    if (rootNode === defaults.root) {
        return rootNode.ownerDocument as Document;
    }
    return rootNode;
}

function bottomUpSearch(
    input: Element,
    limit: "all" | "two" | "one" | "none",
    fallback?: () => Path | null,
): Path | null {
    let path: Path | null = null;
    const stack: Knot[][] = [];
    let current: Element | null = input;
    let i = 0;
    while (current) {
        let level: Knot[] = maybe(id(current)) ||
            maybe(...attr(current)) ||
            maybe(...classNames(current)) ||
            maybe(tagName(current)) || [any()];
        const nth = index(current);
        if (limit == "all") {
            if (nth) {
                level = level.concat(
                    level.filter(dispensableNth).map((node) => nthChild(node, nth)),
                );
            }
        } else if (limit == "two") {
            level = level.slice(0, 1);
            if (nth) {
                level = level.concat(
                    level.filter(dispensableNth).map((node) => nthChild(node, nth)),
                );
            }
        } else if (limit == "one") {
            const [node] = (level = level.slice(0, 1));
            if (nth && dispensableNth(node)) {
                level = [nthChild(node, nth)];
            }
        } else if (limit == "none") {
            level = [any()];
            if (nth) {
                level = [nthChild(level[0], nth)];
            }
        }
        for (const node of level) {
            node.level = i;
        }
        stack.push(level);
        if (stack.length >= config.seedMinLength) {
            path = findUniquePath(stack, fallback);
            if (path) {
                break;
            }
        }
        current = current.parentElement;

        // r2-FORK: added parent check
        if (current && !current.parentElement) {
            break; // exclude root HTML document element for when seedMinLength and optimizedMinLength allow reaching up to the body and even beyond in the ancestor path.
        }
        // if (current && (!current.parentElement || !current.parentElement.parentElement)) {
        //     break; // exclude root HTML document element or even body element for when seedMinLength and optimizedMinLength allow reaching up to the body and even beyond in the ancestor path.
        // }

        i++;
    }
    if (!path) {
        path = findUniquePath(stack, fallback);
    }
    if (!path && fallback) {
        return fallback();
    }
    return path;
}

function findUniquePath(
    stack: Knot[][],
    fallback?: () => Path | null,
): Path | null {
    const paths = sort(combinations(stack));
    if (paths.length > config.threshold) {
        return fallback ? fallback() : null;
    }
    for (const candidate of paths) {
        if (unique(candidate)) {
            return candidate;
        }
    }
    return null;
}

function selector(path: Path): string {
    let node = path[0];
    let query = node.name;
    for (let i = 1; i < path.length; i++) {
        const level = path[i].level || 0;
        if (node.level === level - 1) {
            query = `${path[i].name} > ${query}`;
        } else {
            query = `${path[i].name} ${query}`;
        }
        node = path[i];
    }
    return query;
}

function penalty(path: Path): number {
    return path.map((node) => node.penalty).reduce((acc, i) => acc + i, 0);
}

function unique(path: Path) {
    const css = selector(path);
    switch (rootDocument.querySelectorAll(css).length) {
        case 0:
            throw new Error(
                `Can't select any node with this selector: ${css}`,
            );
        case 1:
            return true;
        default:
            return false;
    }
}

function id(input: Element): Knot | null {
    const elementId = input.getAttribute("id");
    if (elementId && config.idName(elementId)) {
        return {
            name: "#" + CSSEscape(elementId),
            penalty: 0,
        };
    }
    return null;
}

function attr(input: Element): Knot[] {
    const attrs = Array.from(input.attributes).filter((attr) =>
        config.attr(attr.name, attr.value),
    );
    return attrs.map(
        (attr): Knot => ({
            name: `[${CSSEscape(attr.name)}="${CSSEscape(attr.value)}"]`,
            penalty: 0.5,
        }),
    );
}

function classNames(input: Element): Knot[] {
    const names = Array.from(input.classList).filter(config.className);
    return names.map(
        (name): Knot => ({
            name: "." + CSSEscape(name),
            penalty: 1,
        }),
    );
}

// r2-FORK: added "tagName" processing for XML/XHTML
const ELEMENT_NAMESPACE_PREFIX = /^(.+:)(.+)$/;
const ELEMENT_NAMESPACE_PREFIX_ = /^\*\|(a|script|style)$/;
function tagName(input: Element): Knot | null {
    // CSS foreignObject ... yeah, it's hacky :(
    const name = input.tagName === "foreignObject" ? input.tagName : input.tagName.toLowerCase();
    if (config.tagName(name)) {
        // https://github.com/antonmedv/finder/issues/78
        // "div" ==> "div", "m:math" ==> "*|math", "svg:a" ==> "*|a" (which unfortunately matches HTML "a" without XML namespace too! ... that's a shortcoming of the web's querySelector() API) https://www.w3.org/TR/selectors-api/#namespace-prefix-needs-to-be-resolved
        const n = name.replace(ELEMENT_NAMESPACE_PREFIX, "*|$2").replace(ELEMENT_NAMESPACE_PREFIX_, "*|$1:not(|$1)"); // match SVG / MathML namespace-prefixed elements but exclude HTML elements with the same non-prefixed name
        return {
            name: n,
            penalty: 2,
        };
    }
    return null;
}

function any(): Knot {
    return {
        name: "*",
        penalty: 3,
    };
}

function index(input: Element): number | null {
    const parent = input.parentNode;
    if (!parent) {
        return null;
    }
    let child = parent.firstChild;
    if (!child) {
        return null;
    }
    let i = 0;
    while (child) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            i++;
        }
        if (child === input) {
            break;
        }
        child = child.nextSibling;
    }
    return i;
}

function nthChild(node: Knot, i: number): Knot {
    return {
        name: node.name + `:nth-child(${i})`,
        penalty: node.penalty + 1,
    };
}

function dispensableNth(node: Knot) {
    return node.name !== "html" && !node.name.startsWith("#");
}

function maybe(...level: (Knot | null)[]): Knot[] | null {
    const list = level.filter(notEmpty);
    if (list.length > 0) {
        return list;
    }
    return null;
}

function notEmpty<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}

function* combinations(stack: Knot[][], path: Knot[] = []): Generator<Knot[]> {
    if (stack.length > 0) {
        for (const node of stack[0]) {
            yield* combinations(stack.slice(1, stack.length), path.concat(node));
        }
    } else {
        yield path;
    }
}

function sort(paths: Iterable<Path>): Path[] {
    return [...paths].sort((a, b) => penalty(a) - penalty(b));
}

type Scope = {
    counter: number
    visited: Map<string, boolean>
}

function* optimize(
    path: Path,
    input: Element,
    scope: Scope = {
        counter: 0,
        visited: new Map<string, boolean>(),
    },
): Generator<Knot[]> {
    if (path.length > 2 && path.length > config.optimizedMinLength) {
        for (let i = 1; i < path.length - 1; i++) {
            if (scope.counter > config.maxNumberOfTries) {
                return; // Okay At least I tried!
            }
            scope.counter += 1;
            const newPath = [...path];
            newPath.splice(i, 1);
            const newPathKey = selector(newPath);
            if (scope.visited.has(newPathKey)) {
                return;
            }
            if (unique(newPath) && same(newPath, input)) {
                yield newPath;
                scope.visited.set(newPathKey, true);
                yield* optimize(newPath, input, scope);
            }
        }
    }
}

function same(path: Path, input: Element) {
    return rootDocument.querySelector(selector(path)) === input;
}
