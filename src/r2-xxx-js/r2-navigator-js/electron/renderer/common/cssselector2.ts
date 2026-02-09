// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/antonmedv/finder

import * as cssesc from "cssesc";


interface CSSNode {
    name: string;
    penalty: number;
    level?: number;
}

enum Limit {
    All,
    Two,
    One,
}

export interface Options {
    root: Element;
    idName: (name: string) => boolean;
    className: (name: string) => boolean;
    tagName: (name: string) => boolean;
    seedMinLength: number;
    optimizedMinLength: number;
    threshold: number;
}

let config: Options;
let rootDocument: Document | Element;

export function uniqueCssSelector(input: Element, doc: Document, options?: Partial<Options>) {
    if (input.nodeType !== Node.ELEMENT_NODE) {
        throw new Error("Can't generate CSS selector for non-element node type.");
    }

    if ("html" === input.tagName.toLowerCase()) {
        return input.tagName.toLowerCase();
    }

    const defaults: Options = {
        className: (_name: string) => true,
        idName: (_name: string) => true,
        optimizedMinLength: 2,
        root: doc.body,
        seedMinLength: 1,
        tagName: (_name: string) => true,
        threshold: 1000,
    };

    config = { ...defaults, ...options };

    rootDocument = findRootDocument(config.root, defaults);

    let path =
        bottomUpSearch(input, Limit.All, () =>
            bottomUpSearch(input, Limit.Two, () =>
                bottomUpSearch(input, Limit.One)));

    if (path) {
        const optimized = sort(optimize(path, input));

        if (optimized.length > 0) {
            path = optimized[0];
        }

        return selector(path);
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

function bottomUpSearch(input: Element, limit: Limit, fallback?: () => CSSNode[] | null): CSSNode[] | null {
    let path: CSSNode[] | null = null;
    const stack: CSSNode[][] = [];
    let current: Element | null = input;
    let i = 0;

    while (current && current !== config.root.parentElement) {
        let level: CSSNode[] = maybe(id(current)) || maybe(...classNames(current)) ||
            maybe(tagName(current)) || [any()];

        const nth = index(current);

        if (limit === Limit.All) {
            if (nth) {
                level = level.concat(level.filter(dispensableNth).map((node) => nthChild(node, nth)));
            }
        } else if (limit === Limit.Two) {
            level = level.slice(0, 1);

            if (nth) {
                level = level.concat(level.filter(dispensableNth).map((node) => nthChild(node, nth)));
            }
        } else if (limit === Limit.One) {
            const [node] = level = level.slice(0, 1);

            if (nth && dispensableNth(node)) {
                level = [nthChild(node, nth)];
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
        i++;
    }

    if (!path) {
        path = findUniquePath(stack, fallback);
    }

    return path;
}

function findUniquePath(stack: CSSNode[][], fallback?: () => CSSNode[] | null): CSSNode[] | null {
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

function selector(path: CSSNode[]): string {
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

function penalty(path: CSSNode[]): number {
    return path.map((node) => node.penalty).reduce((acc, i) => acc + i, 0);
}

function unique(path: CSSNode[]) {
    switch (rootDocument.querySelectorAll(selector(path)).length) {
        case 0:
            throw new Error(`Can't select any node with this selector: ${selector(path)}`);
        case 1:
            return true;
        default:
            return false;
    }
}

function id(input: Element): CSSNode | null {
    const elementId = input.getAttribute("id");
    if (elementId && config.idName(elementId)) {
        return {
            name: "#" + cssesc(elementId, { isIdentifier: true }),
            penalty: 0,
        };
    }
    return null;
}

function classNames(input: Element): CSSNode[] {
    const names = Array.from(input.classList)
        .filter(config.className);

    return names.map((name): CSSNode => ({
        name: "." + cssesc(name, { isIdentifier: true }),
        penalty: 1,
    }));
}

function tagName(input: Element): CSSNode | null {
    const name = input.tagName.toLowerCase();
    if (config.tagName(name)) {
        return {
            name: name.replace(/^(.+:)(.+)$/, "*|$2"), // "div" ==> "div", "m:math" ==> "*|math", "svg:a" ==> "*|a" (which unfortunately matches HTML "a" without XML namespace too! ... that's a shortcoming of the web's querySelector() API)  https://www.w3.org/TR/selectors-api/#namespace-prefix-needs-to-be-resolved
            penalty: 2,
        };
    }
    return null;
}

function any(): CSSNode {
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

    let child: Node | null = parent.firstChild;
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

function nthChild(node: CSSNode, i: number): CSSNode {
    return {
        name: node.name + `:nth-child(${i})`,
        penalty: node.penalty + 1,
    };
}

function dispensableNth(node: CSSNode) {
    return node.name !== "html" && !node.name.startsWith("#");
}

function maybe(...level: Array<CSSNode | null>): CSSNode[] | null {
    const list = level.filter(notEmpty);
    if (list.length > 0) {
        return list;
    }
    return null;
}

function notEmpty<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}

function* combinations(stack: CSSNode[][], path: CSSNode[] = []): IterableIterator<CSSNode[]> {
    if (stack.length > 0) {
        for (const node of stack[0]) {
            yield* combinations(stack.slice(1, stack.length), path.concat(node));
        }
    } else {
        yield path;
    }
}

function sort(paths: IterableIterator<CSSNode[]>): CSSNode[][] {
    return Array.from(paths).sort((a, b) => penalty(a) - penalty(b));
}

function* optimize(path: CSSNode[], input: Element): IterableIterator<CSSNode[]> {
    if (path.length > 2 && path.length > config.optimizedMinLength) {
        for (let i = 1; i < path.length - 1; i++) {
            const newPath = [...path];
            newPath.splice(i, 1);

            if (unique(newPath) && same(newPath, input)) {
                yield newPath;
                yield* optimize(newPath, input);
            }
        }
    }
}

function same(path: CSSNode[], input: Element) {
    return rootDocument.querySelector(selector(path)) === input;
}
