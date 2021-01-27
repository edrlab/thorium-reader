/**
 * Promise Capability object.
 */
export type PromiseCapability = {
    /**
     * - A Promise object.
     */
    promise: Promise<any>;
    /**
     * - If the Promise has been fulfilled/rejected.
     */
    settled: boolean;
    /**
     * - Fulfills the Promise.
     */
    resolve: Function;
    /**
     * - Rejects the Promise.
     */
    reject: Function;
};
declare const AbortException_base: any;
/**
 * Error used to indicate task cancellation.
 */
export class AbortException extends AbortException_base {
    [x: string]: any;
}
export namespace AnnotationActionEventType {
    const E: string;
    const X: string;
    const D: string;
    const U: string;
    const Fo: string;
    const Bl: string;
    const PO: string;
    const PC: string;
    const PV: string;
    const PI: string;
    const K: string;
    const F: string;
    const V: string;
    const C: string;
}
export namespace AnnotationBorderStyleType {
    const SOLID: number;
    const DASHED: number;
    const BEVELED: number;
    const INSET: number;
    const UNDERLINE: number;
}
export namespace AnnotationFieldFlag {
    const READONLY: number;
    const REQUIRED: number;
    const NOEXPORT: number;
    const MULTILINE: number;
    const PASSWORD: number;
    const NOTOGGLETOOFF: number;
    const RADIO: number;
    const PUSHBUTTON: number;
    const COMBO: number;
    const EDIT: number;
    const SORT: number;
    const FILESELECT: number;
    const MULTISELECT: number;
    const DONOTSPELLCHECK: number;
    const DONOTSCROLL: number;
    const COMB: number;
    const RICHTEXT: number;
    const RADIOSINUNISON: number;
    const COMMITONSELCHANGE: number;
}
export namespace AnnotationFlag {
    export const INVISIBLE: number;
    export const HIDDEN: number;
    export const PRINT: number;
    export const NOZOOM: number;
    export const NOROTATE: number;
    export const NOVIEW: number;
    const READONLY_1: number;
    export { READONLY_1 as READONLY };
    export const LOCKED: number;
    export const TOGGLENOVIEW: number;
    export const LOCKEDCONTENTS: number;
}
export namespace AnnotationMarkedState {
    const MARKED: string;
    const UNMARKED: string;
}
export namespace AnnotationReplyType {
    const GROUP: string;
    const REPLY: string;
}
export namespace AnnotationReviewState {
    const ACCEPTED: string;
    const REJECTED: string;
    const CANCELLED: string;
    const COMPLETED: string;
    const NONE: string;
}
export namespace AnnotationStateModelType {
    const MARKED_1: string;
    export { MARKED_1 as MARKED };
    export const REVIEW: string;
}
export namespace AnnotationType {
    export const TEXT: number;
    export const LINK: number;
    export const FREETEXT: number;
    export const LINE: number;
    export const SQUARE: number;
    export const CIRCLE: number;
    export const POLYGON: number;
    export const POLYLINE: number;
    export const HIGHLIGHT: number;
    const UNDERLINE_1: number;
    export { UNDERLINE_1 as UNDERLINE };
    export const SQUIGGLY: number;
    export const STRIKEOUT: number;
    export const STAMP: number;
    export const CARET: number;
    export const INK: number;
    export const POPUP: number;
    export const FILEATTACHMENT: number;
    export const SOUND: number;
    export const MOVIE: number;
    export const WIDGET: number;
    export const SCREEN: number;
    export const PRINTERMARK: number;
    export const TRAPNET: number;
    export const WATERMARK: number;
    export const THREED: number;
    export const REDACT: number;
}
/**
 * Gets length of the array (Array, Uint8Array, or string) in bytes.
 * @param {Array<any>|Uint8Array|string} arr
 * @returns {number}
 */
export function arrayByteLength(arr: Array<any> | Uint8Array | string): number;
/**
 * Combines array items (arrays) into single Uint8Array object.
 * @param {Array<Array<any>|Uint8Array|string>} arr - the array of the arrays
 *   (Array, Uint8Array, or string).
 * @returns {Uint8Array}
 */
export function arraysToBytes(arr: Array<Array<any> | Uint8Array | string>): Uint8Array;
export function assert(cond: any, msg: any): void;
/**
 * @type {any}
 */
export const BaseException: any;
export function bytesToString(bytes: any): string;
export namespace CMapCompressionType {
    const NONE_1: number;
    export { NONE_1 as NONE };
    export const BINARY: number;
    export const STREAM: number;
}
export function createObjectURL(data: any, contentType: any, forceDataSchema?: boolean): string;
/**
 * Promise Capability object.
 *
 * @typedef {Object} PromiseCapability
 * @property {Promise<any>} promise - A Promise object.
 * @property {boolean} settled - If the Promise has been fulfilled/rejected.
 * @property {function} resolve - Fulfills the Promise.
 * @property {function} reject - Rejects the Promise.
 */
/**
 * Creates a promise capability object.
 * @alias createPromiseCapability
 *
 * @returns {PromiseCapability}
 */
export function createPromiseCapability(): PromiseCapability;
/**
 * Attempts to create a valid absolute URL.
 *
 * @param {URL|string} url - An absolute, or relative, URL.
 * @param {URL|string} baseUrl - An absolute URL.
 * @returns Either a valid {URL}, or `null` otherwise.
 */
export function createValidAbsoluteUrl(url: URL | string, baseUrl: URL | string): URL | null;
export namespace DocumentActionEventType {
    const WC: string;
    const WS: string;
    const DS: string;
    const WP: string;
    const DP: string;
}
export function encodeToXmlString(str: any): any;
export function escapeString(str: any): any;
export const FONT_IDENTITY_MATRIX: number[];
export namespace FontType {
    const UNKNOWN: string;
    const TYPE1: string;
    const TYPE1C: string;
    const CIDFONTTYPE0: string;
    const CIDFONTTYPE0C: string;
    const TRUETYPE: string;
    const CIDFONTTYPE2: string;
    const TYPE3: string;
    const OPENTYPE: string;
    const TYPE0: string;
    const MMTYPE1: string;
}
declare const FormatError_base: any;
/**
 * Error caused during parsing PDF data.
 */
export class FormatError extends FormatError_base {
    [x: string]: any;
}
export function getModificationDate(date?: Date): string;
export function getVerbosityLevel(): number;
export const IDENTITY_MATRIX: number[];
export namespace ImageKind {
    const GRAYSCALE_1BPP: number;
    const RGB_24BPP: number;
    const RGBA_32BPP: number;
}
export function info(msg: any): void;
declare const InvalidPDFException_base: any;
export class InvalidPDFException extends InvalidPDFException_base {
    [x: string]: any;
}
export function isArrayBuffer(v: any): boolean;
export function isArrayEqual(arr1: any, arr2: any): any;
export function isAscii(str: any): boolean;
export function isBool(v: any): boolean;
export namespace IsEvalSupportedCached { }
export namespace IsLittleEndianCached { }
export function isNum(v: any): boolean;
export function isSameOrigin(baseUrl: any, otherUrl: any): boolean;
export function isString(v: any): boolean;
declare const MissingPDFException_base: any;
export class MissingPDFException extends MissingPDFException_base {
    [x: string]: any;
}
export function objectFromEntries(iterable: any): any;
export function objectSize(obj: any): number;
export namespace OPS {
    const dependency: number;
    const setLineWidth: number;
    const setLineCap: number;
    const setLineJoin: number;
    const setMiterLimit: number;
    const setDash: number;
    const setRenderingIntent: number;
    const setFlatness: number;
    const setGState: number;
    const save: number;
    const restore: number;
    const transform: number;
    const moveTo: number;
    const lineTo: number;
    const curveTo: number;
    const curveTo2: number;
    const curveTo3: number;
    const closePath: number;
    const rectangle: number;
    const stroke: number;
    const closeStroke: number;
    const fill: number;
    const eoFill: number;
    const fillStroke: number;
    const eoFillStroke: number;
    const closeFillStroke: number;
    const closeEOFillStroke: number;
    const endPath: number;
    const clip: number;
    const eoClip: number;
    const beginText: number;
    const endText: number;
    const setCharSpacing: number;
    const setWordSpacing: number;
    const setHScale: number;
    const setLeading: number;
    const setFont: number;
    const setTextRenderingMode: number;
    const setTextRise: number;
    const moveText: number;
    const setLeadingMoveText: number;
    const setTextMatrix: number;
    const nextLine: number;
    const showText: number;
    const showSpacedText: number;
    const nextLineShowText: number;
    const nextLineSetSpacingShowText: number;
    const setCharWidth: number;
    const setCharWidthAndBounds: number;
    const setStrokeColorSpace: number;
    const setFillColorSpace: number;
    const setStrokeColor: number;
    const setStrokeColorN: number;
    const setFillColor: number;
    const setFillColorN: number;
    const setStrokeGray: number;
    const setFillGray: number;
    const setStrokeRGBColor: number;
    const setFillRGBColor: number;
    const setStrokeCMYKColor: number;
    const setFillCMYKColor: number;
    const shadingFill: number;
    const beginInlineImage: number;
    const beginImageData: number;
    const endInlineImage: number;
    const paintXObject: number;
    const markPoint: number;
    const markPointProps: number;
    const beginMarkedContent: number;
    const beginMarkedContentProps: number;
    const endMarkedContent: number;
    const beginCompat: number;
    const endCompat: number;
    const paintFormXObjectBegin: number;
    const paintFormXObjectEnd: number;
    const beginGroup: number;
    const endGroup: number;
    const beginAnnotations: number;
    const endAnnotations: number;
    const beginAnnotation: number;
    const endAnnotation: number;
    const paintJpegXObject: number;
    const paintImageMaskXObject: number;
    const paintImageMaskXObjectGroup: number;
    const paintImageXObject: number;
    const paintInlineImageXObject: number;
    const paintInlineImageXObjectGroup: number;
    const paintImageXObjectRepeat: number;
    const paintImageMaskXObjectRepeat: number;
    const paintSolidColorImageMask: number;
    const constructPath: number;
}
export namespace PageActionEventType {
    export const O: string;
    const C_1: string;
    export { C_1 as C };
}
declare const PasswordException_base: any;
export class PasswordException extends PasswordException_base {
    [x: string]: any;
    constructor(msg: any, code: any);
    code: any;
}
export namespace PasswordResponses {
    const NEED_PASSWORD: number;
    const INCORRECT_PASSWORD: number;
}
export namespace PermissionFlag {
    const PRINT_1: number;
    export { PRINT_1 as PRINT };
    export const MODIFY_CONTENTS: number;
    export const COPY: number;
    export const MODIFY_ANNOTATIONS: number;
    export const FILL_INTERACTIVE_FORMS: number;
    export const COPY_FOR_ACCESSIBILITY: number;
    export const ASSEMBLE: number;
    export const PRINT_HIGH_QUALITY: number;
}
/**
 * @param {string} str
 */
export function removeNullCharacters(str: string): string;
export function setVerbosityLevel(level: any): void;
export function shadow(obj: any, prop: any, value: any): any;
export namespace StreamType {
    const UNKNOWN_1: string;
    export { UNKNOWN_1 as UNKNOWN };
    export const FLATE: string;
    export const LZW: string;
    export const DCT: string;
    export const JPX: string;
    export const JBIG: string;
    export const A85: string;
    export const AHX: string;
    export const CCF: string;
    export const RLX: string;
}
export function string32(value: any): string;
export function stringToBytes(str: any): Uint8Array;
export function stringToPDFString(str: any): string;
export function stringToUTF16BEString(str: any): string;
export function stringToUTF8String(str: any): string;
export namespace TextRenderingMode {
    export const FILL: number;
    export const STROKE: number;
    export const FILL_STROKE: number;
    const INVISIBLE_1: number;
    export { INVISIBLE_1 as INVISIBLE };
    export const FILL_ADD_TO_PATH: number;
    export const STROKE_ADD_TO_PATH: number;
    export const FILL_STROKE_ADD_TO_PATH: number;
    export const ADD_TO_PATH: number;
    export const FILL_STROKE_MASK: number;
    export const ADD_TO_PATH_FLAG: number;
}
declare const UnexpectedResponseException_base: any;
export class UnexpectedResponseException extends UnexpectedResponseException_base {
    [x: string]: any;
    constructor(msg: any, status: any);
    status: any;
}
declare const UnknownErrorException_base: any;
export class UnknownErrorException extends UnknownErrorException_base {
    [x: string]: any;
    constructor(msg: any, details: any);
    details: any;
}
export function unreachable(msg: any): void;
export namespace UNSUPPORTED_FEATURES {
    const unknown: string;
    const forms: string;
    const javaScript: string;
    const smask: string;
    const shadingPattern: string;
    const font: string;
    const errorTilingPattern: string;
    const errorExtGState: string;
    const errorXObject: string;
    const errorFontLoadType3: string;
    const errorFontState: string;
    const errorFontMissing: string;
    const errorFontTranslate: string;
    const errorColorSpace: string;
    const errorOperatorList: string;
    const errorFontToUnicode: string;
    const errorFontLoadNative: string;
    const errorFontGetPath: string;
    const errorMarkedContent: string;
}
export function utf8StringToString(str: any): string;
export class Util {
    static makeHexColor(r: any, g: any, b: any): string;
    static transform(m1: any, m2: any): any[];
    static applyTransform(p: any, m: any): any[];
    static applyInverseTransform(p: any, m: any): number[];
    static getAxialAlignedBoundingBox(r: any, m: any): number[];
    static inverseTransform(m: any): number[];
    static apply3dTransform(m: any, v: any): number[];
    static singularValueDecompose2dScale(m: any): number[];
    static normalizeRect(rect: any): any;
    static intersect(rect1: any, rect2: any): any[] | null;
}
export namespace VerbosityLevel {
    const ERRORS: number;
    const WARNINGS: number;
    const INFOS: number;
}
export function warn(msg: any): void;
export {};
