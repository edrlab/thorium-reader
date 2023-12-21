/**
 * Text layer render parameters.
 */
export type TextLayerRenderParameters = {
    /**
     * - Text content to
     * render (the object is returned by the page's `getTextContent` method).
     */
    textContent?: import("./api").TextContent | undefined;
    /**
     * - Text content stream to
     * render (the stream is returned by the page's `streamTextContent` method).
     */
    textContentStream?: ReadableStream<any> | undefined;
    /**
     * - The DOM node that
     * will contain the text runs.
     */
    container: DocumentFragment | HTMLElement;
    /**
     * - The target
     * viewport to properly layout the text runs.
     */
    viewport: import("./display_utils").PageViewport;
    /**
     * - HTML elements that correspond to
     * the text items of the textContent input.
     * This is output and shall initially be set to an empty array.
     */
    textDivs?: HTMLElement[] | undefined;
    /**
     * - Strings that correspond to
     * the `str` property of the text items of the textContent input.
     * This is output and shall initially be set to an empty array.
     */
    textContentItemsStr?: string[] | undefined;
    /**
     * - Delay in milliseconds before rendering of the
     * text runs occurs.
     */
    timeout?: number | undefined;
};
/**
 * @param {TextLayerRenderParameters} renderParameters
 * @returns {TextLayerRenderTask}
 */
export function renderTextLayer(renderParameters: TextLayerRenderParameters): TextLayerRenderTask;
export class TextLayerRenderTask {
    constructor({ textContent, textContentStream, container, viewport, textDivs, textContentItemsStr, }: {
        textContent: any;
        textContentStream: any;
        container: any;
        viewport: any;
        textDivs: any;
        textContentItemsStr: any;
    });
    _textContent: any;
    _textContentStream: any;
    _container: any;
    _document: any;
    _viewport: any;
    _textDivs: any;
    _textContentItemsStr: any;
    _fontInspectorEnabled: boolean;
    _reader: any;
    _layoutTextLastFontSize: any;
    _layoutTextLastFontFamily: any;
    _layoutTextCtx: any;
    _textDivProperties: WeakMap<object, any>;
    _renderingDone: boolean;
    _canceled: boolean;
    _capability: import("../shared/util.js").PromiseCapability;
    _renderTimer: any;
    _devicePixelRatio: number;
    /**
     * Promise for textLayer rendering task completion.
     * @type {Promise<void>}
     */
    get promise(): Promise<void>;
    /**
     * Cancel rendering of the textLayer.
     */
    cancel(): void;
    /**
     * @private
     */
    private _processItems;
    /**
     * @private
     */
    private _layoutText;
    /**
     * @private
     */
    private _render;
}
