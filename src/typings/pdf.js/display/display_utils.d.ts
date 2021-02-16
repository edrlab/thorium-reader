export type ExternalLinkParameters = any;
export type PageViewportParameters = {
    /**
     * - The xMin, yMin, xMax and
     * yMax coordinates.
     */
    viewBox: Array<number>;
    /**
     * - The scale of the viewport.
     */
    scale: number;
    /**
     * - The rotation, in degrees, of the viewport.
     */
    rotation: number;
    /**
     * - The horizontal, i.e. x-axis, offset. The
     * default value is `0`.
     */
    offsetX?: number | undefined;
    /**
     * - The vertical, i.e. y-axis, offset. The
     * default value is `0`.
     */
    offsetY?: number | undefined;
    /**
     * - If true, the y-axis will not be flipped.
     * The default value is `false`.
     */
    dontFlip?: boolean | undefined;
};
export type PageViewportCloneParameters = {
    /**
     * - The scale, overriding the one in the cloned
     * viewport. The default value is `this.scale`.
     */
    scale?: number | undefined;
    /**
     * - The rotation, in degrees, overriding the one
     * in the cloned viewport. The default value is `this.rotation`.
     */
    rotation?: number | undefined;
    /**
     * - The horizontal, i.e. x-axis, offset.
     * The default value is `this.offsetX`.
     */
    offsetX?: number | undefined;
    /**
     * - The vertical, i.e. y-axis, offset.
     * The default value is `this.offsetY`.
     */
    offsetY?: number | undefined;
    /**
     * - If true, the x-axis will not be flipped.
     * The default value is `false`.
     */
    dontFlip?: boolean | undefined;
};
/**
 * @typedef ExternalLinkParameters
 * @typedef {Object} ExternalLinkParameters
 * @property {string} url - An absolute URL.
 * @property {LinkTarget} [target] - The link target. The default value is
 *   `LinkTarget.NONE`.
 * @property {string} [rel] - The link relationship. The default value is
 *   `DEFAULT_LINK_REL`.
 * @property {boolean} [enabled] - Whether the link should be enabled. The
 *   default value is true.
 */
/**
 * Adds various attributes (href, title, target, rel) to hyperlinks.
 * @param {HTMLLinkElement} link - The link element.
 * @param {ExternalLinkParameters} params
 */
export function addLinkAttributes(link: HTMLLinkElement, { url, target, rel, enabled }?: any): void;
export class BaseCanvasFactory {
    create(width: any, height: any): void;
    reset(canvasAndContext: any, width: any, height: any): void;
    destroy(canvasAndContext: any): void;
}
export class BaseCMapReaderFactory {
    constructor({ baseUrl, isCompressed }: {
        baseUrl?: any;
        isCompressed?: boolean | undefined;
    });
    baseUrl: any;
    isCompressed: boolean;
    fetch({ name }: {
        name: any;
    }): Promise<any>;
    /**
     * @private
     */
    private _fetchData;
}
export const DEFAULT_LINK_REL: "noopener noreferrer nofollow";
export function deprecated(details: any): void;
export class DOMCanvasFactory extends BaseCanvasFactory {
    constructor({ ownerDocument }?: {
        ownerDocument?: Document | undefined;
    });
    _document: Document;
}
export class DOMCMapReaderFactory extends BaseCMapReaderFactory {
    constructor({ baseUrl, isCompressed }: {
        baseUrl?: any;
        isCompressed?: boolean | undefined;
    });
}
export class DOMSVGFactory {
    create(width: any, height: any): SVGElement;
    createElement(type: any): any;
}
/**
 * Gets the file name from a given URL.
 * @param {string} url
 */
export function getFilenameFromUrl(url: string): string;
export function isFetchSupported(): boolean;
export function isValidFetchUrl(url: any, baseUrl: any): boolean;
export namespace LinkTarget {
    const NONE: number;
    const SELF: number;
    const BLANK: number;
    const PARENT: number;
    const TOP: number;
}
/**
 * @param {string} src
 * @param {boolean} [removeScriptElement]
 * @returns {Promise<void>}
 */
export function loadScript(src: string, removeScriptElement?: boolean | undefined): Promise<void>;
/**
 * @typedef {Object} PageViewportParameters
 * @property {Array<number>} viewBox - The xMin, yMin, xMax and
 *   yMax coordinates.
 * @property {number} scale - The scale of the viewport.
 * @property {number} rotation - The rotation, in degrees, of the viewport.
 * @property {number} [offsetX] - The horizontal, i.e. x-axis, offset. The
 *   default value is `0`.
 * @property {number} [offsetY] - The vertical, i.e. y-axis, offset. The
 *   default value is `0`.
 * @property {boolean} [dontFlip] - If true, the y-axis will not be flipped.
 *   The default value is `false`.
 */
/**
 * @typedef {Object} PageViewportCloneParameters
 * @property {number} [scale] - The scale, overriding the one in the cloned
 *   viewport. The default value is `this.scale`.
 * @property {number} [rotation] - The rotation, in degrees, overriding the one
 *   in the cloned viewport. The default value is `this.rotation`.
 * @property {number} [offsetX] - The horizontal, i.e. x-axis, offset.
 *   The default value is `this.offsetX`.
 * @property {number} [offsetY] - The vertical, i.e. y-axis, offset.
 *   The default value is `this.offsetY`.
 * @property {boolean} [dontFlip] - If true, the x-axis will not be flipped.
 *   The default value is `false`.
 */
/**
 * PDF page viewport created based on scale, rotation and offset.
 */
export class PageViewport {
    /**
     * @param {PageViewportParameters}
     */
    constructor({ viewBox, scale, rotation, offsetX, offsetY, dontFlip, }: PageViewportParameters);
    viewBox: number[];
    scale: number;
    rotation: number;
    offsetX: number;
    offsetY: number;
    transform: number[];
    width: number;
    height: number;
    /**
     * Clones viewport, with optional additional properties.
     * @param {PageViewportCloneParameters} [params]
     * @returns {PageViewport} Cloned viewport.
     */
    clone({ scale, rotation, offsetX, offsetY, dontFlip, }?: PageViewportCloneParameters | undefined): PageViewport;
    /**
     * Converts PDF point to the viewport coordinates. For examples, useful for
     * converting PDF location into canvas pixel coordinates.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @returns {Object} Object containing `x` and `y` properties of the
     *   point in the viewport coordinate space.
     * @see {@link convertToPdfPoint}
     * @see {@link convertToViewportRectangle}
     */
    convertToViewportPoint(x: number, y: number): Object;
    /**
     * Converts PDF rectangle to the viewport coordinates.
     * @param {Array} rect - The xMin, yMin, xMax and yMax coordinates.
     * @returns {Array} Array containing corresponding coordinates of the
     *   rectangle in the viewport coordinate space.
     * @see {@link convertToViewportPoint}
     */
    convertToViewportRectangle(rect: any[]): any[];
    /**
     * Converts viewport coordinates to the PDF location. For examples, useful
     * for converting canvas pixel location into PDF one.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @returns {Object} Object containing `x` and `y` properties of the
     *   point in the PDF coordinate space.
     * @see {@link convertToViewportPoint}
     */
    convertToPdfPoint(x: number, y: number): Object;
}
export class PDFDateString {
    /**
     * Convert a PDF date string to a JavaScript `Date` object.
     *
     * The PDF date string format is described in section 7.9.4 of the official
     * PDF 32000-1:2008 specification. However, in the PDF 1.7 reference (sixth
     * edition) Adobe describes the same format including a trailing apostrophe.
     * This syntax in incorrect, but Adobe Acrobat creates PDF files that contain
     * them. We ignore all apostrophes as they are not necessary for date parsing.
     *
     * Moreover, Adobe Acrobat doesn't handle changing the date to universal time
     * and doesn't use the user's time zone (effectively ignoring the HH' and mm'
     * parts of the date string).
     *
     * @param {string} input
     * @returns {Date|null}
     */
    static toDateObject(input: string): Date | null;
}
declare const RenderingCancelledException_base: any;
export class RenderingCancelledException extends RenderingCancelledException_base {
    [x: string]: any;
    constructor(msg: any, type: any);
    type: any;
}
export class StatTimer {
    started: any;
    times: any[];
    time(name: any): void;
    timeEnd(name: any): void;
    toString(): string;
}
export {};
