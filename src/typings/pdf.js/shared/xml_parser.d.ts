export class SimpleDOMNode {
    constructor(nodeName: any, nodeValue: any);
    nodeName: any;
    nodeValue: any;
    get firstChild(): any;
    get nextSibling(): any;
    get textContent(): any;
    hasChildNodes(): any;
    /**
     * Search a node in the tree with the given path
     * foo.bar[nnn], i.e. find the nnn-th node named
     * bar under a node named foo.
     *
     * @param {Array} paths - an array of objects as
     * returned by {parseXFAPath}.
     * @param {number} pos - the current position in
     * the paths array.
     * @returns {SimpleDOMNode} The node corresponding
     * to the path or null if not found.
     */
    searchNode(paths: any[], pos: number): SimpleDOMNode;
    dump(buffer: any): void;
}
export class SimpleXMLParser extends XMLParserBase {
    constructor({ hasAttributes, lowerCaseName }: {
        hasAttributes?: boolean | undefined;
        lowerCaseName?: boolean | undefined;
    });
    _currentFragment: any;
    _stack: any[] | null;
    _errorCode: number;
    _hasAttributes: boolean;
    _lowerCaseName: boolean;
    parseFromString(data: any): {
        documentElement: any;
    } | undefined;
}
declare class XMLParserBase {
    _resolveEntities(s: any): any;
    _parseContent(s: any, start: any): {
        name: any;
        attributes: {
            name: string;
            value: any;
        }[];
        parsed: number;
    } | null;
    _parseProcessingInstruction(s: any, start: any): {
        name: any;
        value: any;
        parsed: number;
    };
    parseXml(s: any): void;
    onResolveEntity(name: any): string;
    onPi(name: any, value: any): void;
    onComment(text: any): void;
    onCdata(text: any): void;
    onDoctype(doctypeContent: any): void;
    onText(text: any): void;
    onBeginElement(name: any, attributes: any, isEmpty: any): void;
    onEndElement(name: any): void;
    onError(code: any): void;
}
export {};
