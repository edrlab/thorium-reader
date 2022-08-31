export type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
/**
 * Document initialization / loading parameters object.
 */
export type DocumentInitParameters = {
    /**
     * - The URL of the PDF.
     */
    url?: string | undefined;
    /**
     * - Binary PDF data. Use
     * typed arrays (Uint8Array) to improve the memory usage. If PDF data is
     * BASE64-encoded, use `atob()` to convert it to a binary string first.
     */
    data?: string | number[] | Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | undefined;
    /**
     * - Basic authentication headers.
     */
    httpHeaders?: Object | undefined;
    /**
     * - Indicates whether or not
     * cross-site Access-Control requests should be made using credentials such
     * as cookies or authorization headers. The default is `false`.
     */
    withCredentials?: boolean | undefined;
    /**
     * - For decrypting password-protected PDFs.
     */
    password?: string | undefined;
    /**
     * - A typed array with the first portion
     * or all of the pdf data. Used by the extension since some data is already
     * loaded before the switch to range requests.
     */
    initialData?: Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | undefined;
    /**
     * - The PDF file length. It's used for progress
     * reports and range requests operations.
     */
    length?: number | undefined;
    /**
     * - Allows for using a custom range
     * transport implementation.
     */
    range?: PDFDataRangeTransport | undefined;
    /**
     * - Specify maximum number of bytes fetched
     * per range request. The default value is {@link DEFAULT_RANGE_CHUNK_SIZE}.
     */
    rangeChunkSize?: number | undefined;
    /**
     * - The worker that will be used for loading and
     * parsing the PDF data.
     */
    worker?: any;
    /**
     * - Controls the logging level; the constants
     * from {@link VerbosityLevel} should be used.
     */
    verbosity?: number | undefined;
    /**
     * - The base URL of the document, used when
     * attempting to recover valid absolute URLs for annotations, and outline
     * items, that (incorrectly) only specify relative URLs.
     */
    docBaseUrl?: string | undefined;
    /**
     * - The URL where the predefined Adobe CMaps are
     * located. Include the trailing slash.
     */
    cMapUrl?: string | undefined;
    /**
     * - Specifies if the Adobe CMaps are binary
     * packed or not.
     */
    cMapPacked?: boolean | undefined;
    /**
     * - The factory that will be used when
     * reading built-in CMap files. Providing a custom factory is useful for
     * environments without Fetch API or `XMLHttpRequest` support, such as
     * Node.js. The default value is {DOMCMapReaderFactory}.
     */
    CMapReaderFactory?: Object | undefined;
    /**
     * - Reject certain promises, e.g.
     * `getOperatorList`, `getTextContent`, and `RenderTask`, when the associated
     * PDF data cannot be successfully parsed, instead of attempting to recover
     * whatever possible of the data. The default value is `false`.
     */
    stopAtErrors?: boolean | undefined;
    /**
     * - The maximum allowed image size in total
     * pixels, i.e. width * height. Images above this value will not be rendered.
     * Use -1 for no limit, which is also the default value.
     */
    maxImageSize?: number | undefined;
    /**
     * - Determines if we can evaluate strings
     * as JavaScript. Primarily used to improve performance of font rendering, and
     * when parsing PDF functions. The default value is `true`.
     */
    isEvalSupported?: boolean | undefined;
    /**
     * - By default fonts are converted to
     * OpenType fonts and loaded via `@font-face` rules. If disabled, fonts will
     * be rendered using a built-in font renderer that constructs the glyphs with
     * primitive path commands. The default value is `false`.
     */
    disableFontFace?: boolean | undefined;
    /**
     * - Include additional properties,
     * which are unused during rendering of PDF documents, when exporting the
     * parsed font data from the worker-thread. This may be useful for debugging
     * purposes (and backwards compatibility), but note that it will lead to
     * increased memory usage. The default value is `false`.
     */
    fontExtraProperties?: boolean | undefined;
    /**
     * - Specify an explicit document
     * context to create elements with and to load resources, such as fonts,
     * into. Defaults to the current document.
     */
    ownerDocument?: HTMLDocument | undefined;
    /**
     * - Disable range request loading of PDF
     * files. When enabled, and if the server supports partial content requests,
     * then the PDF will be fetched in chunks. The default value is `false`.
     */
    disableRange?: boolean | undefined;
    /**
     * - Disable streaming of PDF file data.
     * By default PDF.js attempts to load PDF files in chunks. The default value
     * is `false`.
     */
    disableStream?: boolean | undefined;
    /**
     * - Disable pre-fetching of PDF file
     * data. When range requests are enabled PDF.js will automatically keep
     * fetching more data even if it isn't needed to display the current page.
     * The default value is `false`.
     *
     * NOTE: It is also necessary to disable streaming, see above, in order for
     * disabling of pre-fetching to work correctly.
     */
    disableAutoFetch?: boolean | undefined;
    /**
     * - Enables special hooks for debugging PDF.js
     * (see `web/debugger.js`). The default value is `false`.
     */
    pdfBug?: boolean | undefined;
};
export type PDFDocumentStats = {
    /**
     * - Used stream types in the
     * document (an item is set to true if specific stream ID was used in the
     * document).
     */
    streamTypes: {
        [x: string]: boolean;
    };
    /**
     * - Used font types in the
     * document (an item is set to true if specific font ID was used in the
     * document).
     */
    fontTypes: {
        [x: string]: boolean;
    };
};
export type IPDFStreamFactory = Function;
/**
 * The loading task controls the operations required to load a PDF document
 * (such as network requests) and provides a way to listen for completion,
 * after which individual pages can be rendered.
 */
export type PDFDocumentLoadingTask = {
    /**
     * - Unique identifier for the document loading task.
     */
    docId: string;
    /**
     * - Whether the loading task is destroyed or not.
     */
    destroyed: boolean;
    /**
     * - Callback to request a password if a wrong
     * or no password was provided. The callback receives two parameters: a
     * function that should be called with the new password, and a reason (see
     * {@link PasswordResponses}).
     */
    onPassword?: Function | undefined;
    /**
     * - Callback to be able to monitor the
     * loading progress of the PDF file (necessary to implement e.g. a loading
     * bar). The callback receives an {Object} with the properties `loaded`
     * ({number}) and `total` ({number}) that indicate how many bytes are loaded.
     */
    onProgress?: Function | undefined;
    /**
     * - Callback for when an
     * unsupported feature is used in the PDF document. The callback receives an
     * {@link UNSUPPORTED_FEATURES} argument.
     */
    onUnsupportedFeature?: Function | undefined;
    /**
     * - Promise for document loading
     * task completion.
     */
    promise: Promise<PDFDocumentProxy>;
    /**
     * - Abort all network requests and destroy
     * the worker. Returns a promise that is resolved when destruction is
     * completed.
     */
    destroy: Function;
};
/**
 * Page getViewport parameters.
 */
export type GetViewportParameters = {
    /**
     * - The desired scale of the viewport.
     */
    scale: number;
    /**
     * - The desired rotation, in degrees, of
     * the viewport. If omitted it defaults to the page rotation.
     */
    rotation?: number | undefined;
    /**
     * - The horizontal, i.e. x-axis, offset.
     * The default value is `0`.
     */
    offsetX?: number | undefined;
    /**
     * - The vertical, i.e. y-axis, offset.
     * The default value is `0`.
     */
    offsetY?: number | undefined;
    /**
     * - If true, the y-axis will not be
     * flipped. The default value is `false`.
     */
    dontFlip?: boolean | undefined;
};
/**
 * Page getTextContent parameters.
 */
export type getTextContentParameters = {
    /**
     * - Replaces all occurrences of
     * whitespace with standard spaces (0x20). The default value is `false`.
     */
    normalizeWhitespace: boolean;
    /**
     * - Do not attempt to combine
     * same line {@link TextItem}'s. The default value is `false`.
     */
    disableCombineTextItems: boolean;
};
/**
 * Page text content.
 */
export type TextContent = {
    /**
     * - Array of {@link TextItem} objects.
     */
    items: Array<TextItem>;
    /**
     * - {@link TextStyle} objects,
     * indexed by font name.
     */
    styles: {
        [x: string]: TextStyle;
    };
};
/**
 * Page text content part.
 */
export type TextItem = {
    /**
     * - Text content.
     */
    str: string;
    /**
     * - Text direction: 'ttb', 'ltr' or 'rtl'.
     */
    dir: string;
    /**
     * - Transformation matrix.
     */
    transform: Array<any>;
    /**
     * - Width in device space.
     */
    width: number;
    /**
     * - Height in device space.
     */
    height: number;
    /**
     * - Font name used by PDF.js for converted font.
     */
    fontName: string;
};
/**
 * Text style.
 */
export type TextStyle = {
    /**
     * - Font ascent.
     */
    ascent: number;
    /**
     * - Font descent.
     */
    descent: number;
    /**
     * - Whether or not the text is in vertical mode.
     */
    vertical: boolean;
    /**
     * - The possible font family.
     */
    fontFamily: string;
};
/**
 * Page annotation parameters.
 */
export type GetAnnotationsParameters = {
    /**
     * - Determines the annotations that will be fetched,
     * can be either 'display' (viewable annotations) or 'print' (printable
     * annotations). If the parameter is omitted, all annotations are fetched.
     */
    intent: string;
};
/**
 * Page render parameters.
 */
export type RenderParameters = {
    /**
     * - A 2D context of a DOM Canvas object.
     */
    canvasContext: Object;
    /**
     * - Rendering viewport obtained by calling
     * the `PDFPageProxy.getViewport` method.
     */
    viewport: PageViewport;
    /**
     * - Rendering intent, can be 'display' or 'print'.
     * The default value is 'display'.
     */
    intent?: string | undefined;
    /**
     * - Enables WebGL accelerated rendering for
     * some operations. The default value is `false`.
     */
    enableWebGL?: boolean | undefined;
    /**
     * - Whether or not interactive
     * form elements are rendered in the display layer. If so, we do not render
     * them on the canvas as well.
     */
    renderInteractiveForms?: boolean | undefined;
    /**
     * - Additional transform, applied just
     * before viewport transform.
     */
    transform?: any[] | undefined;
    /**
     * - An object that has `beginLayout`,
     * `endLayout` and `appendImage` functions.
     */
    imageLayer?: Object | undefined;
    /**
     * - The factory instance that will be used
     * when creating canvases. The default value is {new DOMCanvasFactory()}.
     */
    canvasFactory?: Object | undefined;
    /**
     * - Background to use for the canvas.
     * Any valid `canvas.fillStyle` can be used: a `DOMString` parsed as CSS
     * <color> value, a `CanvasGradient` object (a linear or radial gradient) or
     * a `CanvasPattern` object (a repetitive image). The default value is
     * 'rgb(255,255,255)'.
     */
    background?: string | Object | undefined;
    /**
     * - Storage for annotation
     * data in forms.
     */
    annotationStorage?: AnnotationStorage | undefined;
    /**
     * -
     * A promise that should resolve with an {@link OptionalContentConfig}
     * created from `PDFDocumentProxy.getOptionalContentConfig`. If `null`,
     * the configuration will be fetched automatically with the default visibility
     * states set.
     */
    optionalContentConfigPromise?: Promise<OptionalContentConfig> | undefined;
};
/**
 * PDF page operator list.
 */
export type PDFOperatorList = {
    /**
     * - Array containing the operator functions.
     */
    fnArray: Array<number>;
    /**
     * - Array containing the arguments of the
     * functions.
     */
    argsArray: Array<any>;
};
export type PDFWorkerParameters = {
    /**
     * - The name of the worker.
     */
    name?: string | undefined;
    /**
     * - The `workerPort` object.
     */
    port?: Object | undefined;
    /**
     * - Controls the logging level; the
     * constants from {@link VerbosityLevel} should be used.
     */
    verbosity?: number | undefined;
};
/** @type {string} */
export const build: string;
export const DefaultCanvasFactory: typeof DOMCanvasFactory | {
    new (): {};
};
export const DefaultCMapReaderFactory: typeof DOMCMapReaderFactory | {
    new (): {};
};
/**
 * @typedef { Int8Array | Uint8Array | Uint8ClampedArray |
 *            Int16Array | Uint16Array |
 *            Int32Array | Uint32Array | Float32Array |
 *            Float64Array
 * } TypedArray
 */
/**
 * Document initialization / loading parameters object.
 *
 * @typedef {Object} DocumentInitParameters
 * @property {string} [url] - The URL of the PDF.
 * @property {TypedArray|Array<number>|string} [data] - Binary PDF data. Use
 *    typed arrays (Uint8Array) to improve the memory usage. If PDF data is
 *    BASE64-encoded, use `atob()` to convert it to a binary string first.
 * @property {Object} [httpHeaders] - Basic authentication headers.
 * @property {boolean} [withCredentials] - Indicates whether or not
 *   cross-site Access-Control requests should be made using credentials such
 *   as cookies or authorization headers. The default is `false`.
 * @property {string} [password] - For decrypting password-protected PDFs.
 * @property {TypedArray} [initialData] - A typed array with the first portion
 *   or all of the pdf data. Used by the extension since some data is already
 *   loaded before the switch to range requests.
 * @property {number} [length] - The PDF file length. It's used for progress
 *   reports and range requests operations.
 * @property {PDFDataRangeTransport} [range] - Allows for using a custom range
 *   transport implementation.
 * @property {number} [rangeChunkSize] - Specify maximum number of bytes fetched
 *   per range request. The default value is {@link DEFAULT_RANGE_CHUNK_SIZE}.
 * @property {PDFWorker} [worker] - The worker that will be used for loading and
 *   parsing the PDF data.
 * @property {number} [verbosity] - Controls the logging level; the constants
 *   from {@link VerbosityLevel} should be used.
 * @property {string} [docBaseUrl] - The base URL of the document, used when
 *   attempting to recover valid absolute URLs for annotations, and outline
 *   items, that (incorrectly) only specify relative URLs.
 * @property {string} [cMapUrl] - The URL where the predefined Adobe CMaps are
 *   located. Include the trailing slash.
 * @property {boolean} [cMapPacked] - Specifies if the Adobe CMaps are binary
 *   packed or not.
 * @property {Object} [CMapReaderFactory] - The factory that will be used when
 *   reading built-in CMap files. Providing a custom factory is useful for
 *   environments without Fetch API or `XMLHttpRequest` support, such as
 *   Node.js. The default value is {DOMCMapReaderFactory}.
 * @property {boolean} [stopAtErrors] - Reject certain promises, e.g.
 *   `getOperatorList`, `getTextContent`, and `RenderTask`, when the associated
 *   PDF data cannot be successfully parsed, instead of attempting to recover
 *   whatever possible of the data. The default value is `false`.
 * @property {number} [maxImageSize] - The maximum allowed image size in total
 *   pixels, i.e. width * height. Images above this value will not be rendered.
 *   Use -1 for no limit, which is also the default value.
 * @property {boolean} [isEvalSupported] - Determines if we can evaluate strings
 *   as JavaScript. Primarily used to improve performance of font rendering, and
 *   when parsing PDF functions. The default value is `true`.
 * @property {boolean} [disableFontFace] - By default fonts are converted to
 *   OpenType fonts and loaded via `@font-face` rules. If disabled, fonts will
 *   be rendered using a built-in font renderer that constructs the glyphs with
 *   primitive path commands. The default value is `false`.
 * @property {boolean} [fontExtraProperties] - Include additional properties,
 *   which are unused during rendering of PDF documents, when exporting the
 *   parsed font data from the worker-thread. This may be useful for debugging
 *   purposes (and backwards compatibility), but note that it will lead to
 *   increased memory usage. The default value is `false`.
 * @property {HTMLDocument} [ownerDocument] - Specify an explicit document
 *   context to create elements with and to load resources, such as fonts,
 *   into. Defaults to the current document.
 * @property {boolean} [disableRange] - Disable range request loading of PDF
 *   files. When enabled, and if the server supports partial content requests,
 *   then the PDF will be fetched in chunks. The default value is `false`.
 * @property {boolean} [disableStream] - Disable streaming of PDF file data.
 *   By default PDF.js attempts to load PDF files in chunks. The default value
 *   is `false`.
 * @property {boolean} [disableAutoFetch] - Disable pre-fetching of PDF file
 *   data. When range requests are enabled PDF.js will automatically keep
 *   fetching more data even if it isn't needed to display the current page.
 *   The default value is `false`.
 *
 *   NOTE: It is also necessary to disable streaming, see above, in order for
 *   disabling of pre-fetching to work correctly.
 * @property {boolean} [pdfBug] - Enables special hooks for debugging PDF.js
 *   (see `web/debugger.js`). The default value is `false`.
 */
/**
 * @typedef {Object} PDFDocumentStats
 * @property {Object<string, boolean>} streamTypes - Used stream types in the
 *   document (an item is set to true if specific stream ID was used in the
 *   document).
 * @property {Object<string, boolean>} fontTypes - Used font types in the
 *   document (an item is set to true if specific font ID was used in the
 *   document).
 */
/**
 * This is the main entry point for loading a PDF and interacting with it.
 *
 * NOTE: If a URL is used to fetch the PDF data a standard Fetch API call (or
 * XHR as fallback) is used, which means it must follow same origin rules,
 * e.g. no cross-domain requests without CORS.
 *
 * @param {string|TypedArray|DocumentInitParameters|PDFDataRangeTransport} src -
 *   Can be a URL to where a PDF file is located, a typed array (Uint8Array)
 *   already populated with data or parameter object.
 * @returns {PDFDocumentLoadingTask}
 */
export function getDocument(src: string | TypedArray | DocumentInitParameters | PDFDataRangeTransport): PDFDocumentLoadingTask;
export class LoopbackPort {
    constructor(defer?: boolean);
    _listeners: any[];
    _defer: boolean;
    _deferred: Promise<undefined>;
    postMessage(obj: any, transfers: any): void;
    addEventListener(name: any, listener: any): void;
    removeEventListener(name: any, listener: any): void;
    terminate(): void;
}
/**
 * Abstract class to support range requests file loading.
 */
export class PDFDataRangeTransport {
    /**
     * @param {number} length
     * @param {Uint8Array} initialData
     * @param {boolean} [progressiveDone]
     */
    constructor(length: number, initialData: Uint8Array, progressiveDone?: boolean | undefined);
    length: number;
    initialData: Uint8Array;
    progressiveDone: boolean;
    _rangeListeners: any[];
    _progressListeners: any[];
    _progressiveReadListeners: any[];
    _progressiveDoneListeners: any[];
    _readyCapability: import("../shared/util.js").PromiseCapability;
    addRangeListener(listener: any): void;
    addProgressListener(listener: any): void;
    addProgressiveReadListener(listener: any): void;
    addProgressiveDoneListener(listener: any): void;
    onDataRange(begin: any, chunk: any): void;
    onDataProgress(loaded: any, total: any): void;
    onDataProgressiveRead(chunk: any): void;
    onDataProgressiveDone(): void;
    transportReady(): void;
    requestDataRange(begin: any, end: any): void;
    abort(): void;
}
/**
 * Proxy to a `PDFDocument` in the worker thread.
 */
export class PDFDocumentProxy {
    constructor(pdfInfo: any, transport: any);
    _pdfInfo: any;
    _transport: any;
    /**
     * @type {AnnotationStorage} Storage for annotation data in forms.
     */
    get annotationStorage(): AnnotationStorage;
    /**
     * @type {number} Total number of pages in the PDF file.
     */
    get numPages(): number;
    /**
     * @type {string} A (not guaranteed to be) unique ID to identify a PDF.
     */
    get fingerprint(): string;
    /**
     * @param {number} pageNumber - The page number to get. The first page is 1.
     * @returns {Promise<PDFPageProxy>} A promise that is resolved with
     *   a {@link PDFPageProxy} object.
     */
    getPage(pageNumber: number): Promise<PDFPageProxy>;
    /**
     * @param {{num: number, gen: number}} ref - The page reference. Must have
     *   the `num` and `gen` properties.
     * @returns {Promise<{num: number, gen: number}>} A promise that is resolved
     *   with the page index (starting from zero) that is associated with the
     *   reference.
     */
    getPageIndex(ref: {
        num: number;
        gen: number;
    }): Promise<{
        num: number;
        gen: number;
    }>;
    /**
     * @returns {Promise<Object<string, Array<any>>>} A promise that is resolved
     *   with a mapping from named destinations to references.
     *
     * This can be slow for large documents. Use `getDestination` instead.
     */
    getDestinations(): Promise<{
        [x: string]: Array<any>;
    }>;
    /**
     * @param {string} id - The named destination to get.
     * @returns {Promise<Array<any>>} A promise that is resolved with all
     *   information of the given named destination.
     */
    getDestination(id: string): Promise<Array<any>>;
    /**
     * @returns {Promise<Array<string> | null>} A promise that is resolved with
     *   an {Array} containing the page labels that correspond to the page
     *   indexes, or `null` when no page labels are present in the PDF file.
     */
    getPageLabels(): Promise<Array<string> | null>;
    /**
     * @returns {Promise<string>} A promise that is resolved with a {string}
     *   containing the page layout name.
     */
    getPageLayout(): Promise<string>;
    /**
     * @returns {Promise<string>} A promise that is resolved with a {string}
     *   containing the page mode name.
     */
    getPageMode(): Promise<string>;
    /**
     * @returns {Promise<Object | null>} A promise that is resolved with an
     *   {Object} containing the viewer preferences, or `null` when no viewer
     *   preferences are present in the PDF file.
     */
    getViewerPreferences(): Promise<Object | null>;
    /**
     * @returns {Promise<any | null>} A promise that is resolved with an {Array}
     *   containing the destination, or `null` when no open action is present
     *   in the PDF.
     */
    getOpenAction(): Promise<any | null>;
    /**
     * @returns {Promise<any>} A promise that is resolved with a lookup table
     *   for mapping named attachments to their content.
     */
    getAttachments(): Promise<any>;
    /**
     * @returns {Promise<Array<string> | null>} A promise that is resolved with
     *   an {Array} of all the JavaScript strings in the name tree, or `null`
     *   if no JavaScript exists.
     */
    getJavaScript(): Promise<Array<string> | null>;
    /**
     * @returns {Promise<Object | null>} A promise that is resolved with
     *   an {Object} with the JavaScript actions:
     *     - from the name tree (like getJavaScript);
     *     - from A or AA entries in the catalog dictionary.
     *   , or `null` if no JavaScript exists.
     */
    getJSActions(): Promise<Object | null>;
    /**
     * @typedef {Object} OutlineNode
     * @property {string} title
     * @property {boolean} bold
     * @property {boolean} italic
     * @property {Uint8ClampedArray} color - The color in RGB format to use for
     *   display purposes.
     * @property {string | Array<any> | null} dest
     * @property {string | null} url
     * @property {string | undefined} unsafeUrl
     * @property {boolean | undefined} newWindow
     * @property {number | undefined} count
     * @property {Array<OutlineNode>} items
     */
    /**
     * @returns {Promise<Array<OutlineNode>>} A promise that is resolved with an
     *   {Array} that is a tree outline (if it has one) of the PDF file.
     */
    getOutline(): Promise<{
        title: string;
        bold: boolean;
        italic: boolean;
        /**
         * - The color in RGB format to use for
         * display purposes.
         */
        color: Uint8ClampedArray;
        dest: string | Array<any> | null;
        url: string | null;
        unsafeUrl: string | undefined;
        newWindow: boolean | undefined;
        count: number | undefined;
        items: any[];
    }[]>;
    /**
     * @returns {Promise<OptionalContentConfig>} A promise that is resolved with
     *   an {@link OptionalContentConfig} that contains all the optional content
     *   groups (assuming that the document has any).
     */
    getOptionalContentConfig(): Promise<OptionalContentConfig>;
    /**
     * @returns {Promise<Array<number> | null>} A promise that is resolved with
     *   an {Array} that contains the permission flags for the PDF document, or
     *   `null` when no permissions are present in the PDF file.
     */
    getPermissions(): Promise<Array<number> | null>;
    /**
     * @returns {Promise<{ info: Object, metadata: Metadata }>} A promise that is
     *   resolved with an {Object} that has `info` and `metadata` properties.
     *   `info` is an {Object} filled with anything available in the information
     *   dictionary and similarly `metadata` is a {Metadata} object with
     *   information from the metadata section of the PDF.
     */
    getMetadata(): Promise<{
        info: Object;
        metadata: Metadata;
    }>;
    /**
     * @typedef {Object} MarkInfo
     * Properties correspond to Table 321 of the PDF 32000-1:2008 spec.
     * @property {boolean} Marked
     * @property {boolean} UserProperties
     * @property {boolean} Suspects
     */
    /**
     * @returns {Promise<MarkInfo | null>} A promise that is resolved with
     *   a {MarkInfo} object that contains the MarkInfo flags for the PDF
     *   document, or `null` when no MarkInfo values are present in the PDF file.
     */
    getMarkInfo(): Promise<{
        Marked: boolean;
        UserProperties: boolean;
        Suspects: boolean;
    } | null>;
    /**
     * @returns {Promise<TypedArray>} A promise that is resolved with a
     *   {TypedArray} that has the raw data from the PDF.
     */
    getData(): Promise<TypedArray>;
    /**
     * @returns {Promise<{ length: number }>} A promise that is resolved when the
     *   document's data is loaded. It is resolved with an {Object} that contains
     *   the `length` property that indicates size of the PDF data in bytes.
     */
    getDownloadInfo(): Promise<{
        length: number;
    }>;
    /**
     * @returns {Promise<PDFDocumentStats>} A promise this is resolved with
     *   current statistics about document structures (see
     *   {@link PDFDocumentStats}).
     */
    getStats(): Promise<PDFDocumentStats>;
    /**
     * Cleans up resources allocated by the document on both the main and worker
     * threads.
     *
     * NOTE: Do not, under any circumstances, call this method when rendering is
     * currently ongoing since that may lead to rendering errors.
     *
     * @returns {Promise} A promise that is resolved when clean-up has finished.
     */
    cleanup(): Promise<any>;
    /**
     * Destroys the current document instance and terminates the worker.
     */
    destroy(): any;
    /**
     * @type {DocumentInitParameters} A subset of the current
     *   {DocumentInitParameters}, which are either needed in the viewer and/or
     *   whose default values may be affected by the `apiCompatibilityParams`.
     */
    get loadingParams(): DocumentInitParameters;
    /**
     * @type {PDFDocumentLoadingTask} The loadingTask for the current document.
     */
    get loadingTask(): PDFDocumentLoadingTask;
    /**
     * @param {AnnotationStorage} annotationStorage - Storage for annotation
     *   data in forms.
     * @returns {Promise<Uint8Array>} A promise that is resolved with a
     *   {Uint8Array} containing the full data of the saved document.
     */
    saveDocument(annotationStorage: AnnotationStorage): Promise<Uint8Array>;
    /**
     * @returns {Promise<Array<Object> | null>} A promise that is resolved with an
     *   {Array<Object>} containing /AcroForm field data for the JS sandbox,
     *   or `null` when no field data is present in the PDF file.
     */
    getFieldObjects(): Promise<Array<Object> | null>;
    /**
     * @returns {Promise<boolean>} A promise that is resolved with `true`
     *   if some /AcroForm fields have JavaScript actions.
     */
    hasJSActions(): Promise<boolean>;
    /**
     * @returns {Promise<Array<string> | null>} A promise that is resolved with an
     *   {Array<string>} containing IDs of annotations that have a calculation
     *   action, or `null` when no such annotations are present in the PDF file.
     */
    getCalculationOrderIds(): Promise<Array<string> | null>;
}
/**
 * Page getViewport parameters.
 *
 * @typedef {Object} GetViewportParameters
 * @property {number} scale - The desired scale of the viewport.
 * @property {number} [rotation] - The desired rotation, in degrees, of
 *   the viewport. If omitted it defaults to the page rotation.
 * @property {number} [offsetX] - The horizontal, i.e. x-axis, offset.
 *   The default value is `0`.
 * @property {number} [offsetY] - The vertical, i.e. y-axis, offset.
 *   The default value is `0`.
 * @property {boolean} [dontFlip] - If true, the y-axis will not be
 *   flipped. The default value is `false`.
 */
/**
 * Page getTextContent parameters.
 *
 * @typedef {Object} getTextContentParameters
 * @property {boolean} normalizeWhitespace - Replaces all occurrences of
 *   whitespace with standard spaces (0x20). The default value is `false`.
 * @property {boolean} disableCombineTextItems - Do not attempt to combine
 *   same line {@link TextItem}'s. The default value is `false`.
 */
/**
 * Page text content.
 *
 * @typedef {Object} TextContent
 * @property {Array<TextItem>} items - Array of {@link TextItem} objects.
 * @property {Object<string, TextStyle>} styles - {@link TextStyle} objects,
 *   indexed by font name.
 */
/**
 * Page text content part.
 *
 * @typedef {Object} TextItem
 * @property {string} str - Text content.
 * @property {string} dir - Text direction: 'ttb', 'ltr' or 'rtl'.
 * @property {Array<any>} transform - Transformation matrix.
 * @property {number} width - Width in device space.
 * @property {number} height - Height in device space.
 * @property {string} fontName - Font name used by PDF.js for converted font.
 */
/**
 * Text style.
 *
 * @typedef {Object} TextStyle
 * @property {number} ascent - Font ascent.
 * @property {number} descent - Font descent.
 * @property {boolean} vertical - Whether or not the text is in vertical mode.
 * @property {string} fontFamily - The possible font family.
 */
/**
 * Page annotation parameters.
 *
 * @typedef {Object} GetAnnotationsParameters
 * @property {string} intent - Determines the annotations that will be fetched,
 *   can be either 'display' (viewable annotations) or 'print' (printable
 *   annotations). If the parameter is omitted, all annotations are fetched.
 */
/**
 * Page render parameters.
 *
 * @typedef {Object} RenderParameters
 * @property {Object} canvasContext - A 2D context of a DOM Canvas object.
 * @property {PageViewport} viewport - Rendering viewport obtained by calling
 *   the `PDFPageProxy.getViewport` method.
 * @property {string} [intent] - Rendering intent, can be 'display' or 'print'.
 *   The default value is 'display'.
 * @property {boolean} [enableWebGL] - Enables WebGL accelerated rendering for
 *   some operations. The default value is `false`.
 * @property {boolean} [renderInteractiveForms] - Whether or not interactive
 *   form elements are rendered in the display layer. If so, we do not render
 *   them on the canvas as well.
 * @property {Array<any>} [transform] - Additional transform, applied just
 *   before viewport transform.
 * @property {Object} [imageLayer] - An object that has `beginLayout`,
 *   `endLayout` and `appendImage` functions.
 * @property {Object} [canvasFactory] - The factory instance that will be used
 *   when creating canvases. The default value is {new DOMCanvasFactory()}.
 * @property {Object | string} [background] - Background to use for the canvas.
 *   Any valid `canvas.fillStyle` can be used: a `DOMString` parsed as CSS
 *   <color> value, a `CanvasGradient` object (a linear or radial gradient) or
 *   a `CanvasPattern` object (a repetitive image). The default value is
 *   'rgb(255,255,255)'.
 * @property {AnnotationStorage} [annotationStorage] - Storage for annotation
 *   data in forms.
 * @property {Promise<OptionalContentConfig>} [optionalContentConfigPromise] -
 *   A promise that should resolve with an {@link OptionalContentConfig}
 *   created from `PDFDocumentProxy.getOptionalContentConfig`. If `null`,
 *   the configuration will be fetched automatically with the default visibility
 *   states set.
 */
/**
 * PDF page operator list.
 *
 * @typedef {Object} PDFOperatorList
 * @property {Array<number>} fnArray - Array containing the operator functions.
 * @property {Array<any>} argsArray - Array containing the arguments of the
 *   functions.
 */
/**
 * Proxy to a `PDFPage` in the worker thread.
 */
export class PDFPageProxy {
    constructor(pageIndex: any, pageInfo: any, transport: any, ownerDocument: any, pdfBug?: boolean);
    _pageIndex: any;
    _pageInfo: any;
    _ownerDocument: any;
    _transport: any;
    _stats: StatTimer | null;
    _pdfBug: boolean;
    commonObjs: any;
    objs: PDFObjects;
    cleanupAfterRender: boolean;
    pendingCleanup: boolean;
    _intentStates: Map<any, any>;
    destroyed: boolean;
    /**
     * @type {number} Page number of the page. First page is 1.
     */
    get pageNumber(): number;
    /**
     * @type {number} The number of degrees the page is rotated clockwise.
     */
    get rotate(): number;
    /**
     * @type {Object} The reference that points to this page. It has `num` and
     *   `gen` properties.
     */
    get ref(): Object;
    /**
     * @type {number} The default size of units in 1/72nds of an inch.
     */
    get userUnit(): number;
    /**
     * @type {Array<number>} An array of the visible portion of the PDF page in
     *   user space units [x1, y1, x2, y2].
     */
    get view(): number[];
    /**
     * @param {GetViewportParameters} params - Viewport parameters.
     * @returns {PageViewport} Contains 'width' and 'height' properties
     *   along with transforms required for rendering.
     */
    getViewport({ scale, rotation, offsetX, offsetY, dontFlip, }?: GetViewportParameters): PageViewport;
    /**
     * @param {GetAnnotationsParameters} params - Annotation parameters.
     * @returns {Promise<Array<any>>} A promise that is resolved with an
     *   {Array} of the annotation objects.
     */
    getAnnotations({ intent }?: GetAnnotationsParameters): Promise<Array<any>>;
    annotationsPromise: any;
    annotationsIntent: string | undefined;
    /**
     * @returns {Promise<Object>} A promise that is resolved with an
     *   {Object} with JS actions.
     */
    getJSActions(): Promise<Object>;
    /**
     * Begins the process of rendering a page to the desired context.
     *
     * @param {RenderParameters} params Page render parameters.
     * @returns {RenderTask} An object that contains a promise that is
     *   resolved when the page finishes rendering.
     */
    render({ canvasContext, viewport, intent, enableWebGL, renderInteractiveForms, transform, imageLayer, canvasFactory, background, annotationStorage, optionalContentConfigPromise, }: RenderParameters): RenderTask;
    /**
     * @returns {Promise<PDFOperatorList>} A promise resolved with an
     *   {@link PDFOperatorList} object that represents page's operator list.
     */
    getOperatorList(): Promise<PDFOperatorList>;
    /**
     * @param {getTextContentParameters} params - getTextContent parameters.
     * @returns {ReadableStream} Stream for reading text content chunks.
     */
    streamTextContent({ normalizeWhitespace, disableCombineTextItems, }?: getTextContentParameters): ReadableStream;
    /**
     * @param {getTextContentParameters} params - getTextContent parameters.
     * @returns {Promise<TextContent>} A promise that is resolved with a
     *   {@link TextContent} object that represents the page's text content.
     */
    getTextContent(params?: getTextContentParameters): Promise<TextContent>;
    /**
     * Destroys the page object.
     * @private
     */
    private _destroy;
    _jsActionsPromise: any;
    /**
     * Cleans up resources allocated by the page.
     *
     * @param {boolean} [resetStats] - Reset page stats, if enabled.
     *   The default value is `false`.
     * @returns {boolean} Indicates if clean-up was successfully run.
     */
    cleanup(resetStats?: boolean | undefined): boolean;
    /**
     * Attempts to clean up if rendering is in a state where that's possible.
     * @private
     */
    private _tryCleanup;
    /**
     * @private
     */
    private _startRenderPage;
    /**
     * @private
     */
    private _renderPageChunk;
    /**
     * @private
     */
    private _pumpOperatorList;
    /**
     * @private
     */
    private _abortOperatorList;
    /**
     * @type {Object} Returns page stats, if enabled; returns `null` otherwise.
     */
    get stats(): Object;
}
/**
 * @typedef {Object} PDFWorkerParameters
 * @property {string} [name] - The name of the worker.
 * @property {Object} [port] - The `workerPort` object.
 * @property {number} [verbosity] - Controls the logging level; the
 *   constants from {@link VerbosityLevel} should be used.
 */
/** @type {any} */
export const PDFWorker: any;
/**
 * Sets the function that instantiates an {IPDFStream} as an alternative PDF
 * data transport.
 *
 * @param {IPDFStreamFactory} pdfNetworkStreamFactory - The factory function
 *   that takes document initialization parameters (including a "url") and
 *   returns a promise which is resolved with an instance of {IPDFStream}.
 * @ignore
 */
export function setPDFNetworkStreamFactory(pdfNetworkStreamFactory: IPDFStreamFactory): void;
/** @type {string} */
export const version: string;
import { PageViewport } from "./display_utils.js";
import { AnnotationStorage } from "./annotation_storage.js";
import { OptionalContentConfig } from "./optional_content_config.js";
import { DOMCanvasFactory } from "./display_utils.js";
import { DOMCMapReaderFactory } from "./display_utils.js";
/**
 * The loading task controls the operations required to load a PDF document
 * (such as network requests) and provides a way to listen for completion,
 * after which individual pages can be rendered.
 *
 * @typedef {Object} PDFDocumentLoadingTask
 * @property {string} docId - Unique identifier for the document loading task.
 * @property {boolean} destroyed - Whether the loading task is destroyed or not.
 * @property {function} [onPassword] - Callback to request a password if a wrong
 *   or no password was provided. The callback receives two parameters: a
 *   function that should be called with the new password, and a reason (see
 *   {@link PasswordResponses}).
 * @property {function} [onProgress] - Callback to be able to monitor the
 *   loading progress of the PDF file (necessary to implement e.g. a loading
 *   bar). The callback receives an {Object} with the properties `loaded`
 *   ({number}) and `total` ({number}) that indicate how many bytes are loaded.
 * @property {function} [onUnsupportedFeature] - Callback for when an
 *   unsupported feature is used in the PDF document. The callback receives an
 *   {@link UNSUPPORTED_FEATURES} argument.
 * @property {Promise<PDFDocumentProxy>} promise - Promise for document loading
 *   task completion.
 * @property {function} destroy - Abort all network requests and destroy
 *   the worker. Returns a promise that is resolved when destruction is
 *   completed.
 */
/**
 * @type {any}
 * @ignore
 */
declare const PDFDocumentLoadingTask: any;
import { info } from "../shared/util.js";
import { Metadata } from "./metadata.js";
import { StatTimer } from "./display_utils.js";
/**
 * A PDF document and page is built of many objects. E.g. there are objects for
 * fonts, images, rendering code, etc. These objects may get processed inside of
 * a worker. This class implements some basic methods to manage these objects.
 * @ignore
 */
declare class PDFObjects {
    _objs: any;
    /**
     * Ensures there is an object defined for `objId`.
     * @private
     */
    private _ensureObj;
    /**
     * If called *without* callback, this returns the data of `objId` but the
     * object needs to be resolved. If it isn't, this method throws.
     *
     * If called *with* a callback, the callback is called with the data of the
     * object once the object is resolved. That means, if you call this method
     * and the object is already resolved, the callback gets called right away.
     */
    get(objId: any, callback?: any): any;
    has(objId: any): any;
    /**
     * Resolves the object `objId` with optional `data`.
     */
    resolve(objId: any, data: any): void;
    clear(): void;
}
/**
 * Allows controlling of the rendering tasks.
 */
declare class RenderTask {
    constructor(internalRenderTask: any);
    _internalRenderTask: any;
    /**
     * Callback for incremental rendering -- a function that will be called
     * each time the rendering is paused.  To continue rendering call the
     * function that is the first argument to the callback.
     * @type {function}
     */
    onContinue: Function;
    /**
     * Promise for rendering task completion.
     * @type {Promise<void>}
     */
    get promise(): Promise<void>;
    /**
     * Cancels the rendering task. If the task is currently rendering it will
     * not be cancelled until graphics pauses with a timeout. The promise that
     * this object extends will be rejected when cancelled.
     */
    cancel(): void;
}
export {};
