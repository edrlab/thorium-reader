/**
 * Text layer render parameters.
 */
export type TextLayerRenderParameters = {
    /**
     * - Text content to
     * render (the object is returned by the page's `getTextContent` method).
     */
    textContent?: import("./api.js").TextContent | undefined;
    /**
     * - Text content stream to
     * render (the stream is returned by the page's `streamTextContent` method).
     */
    textContentStream?: ReadableStream<any> | undefined;
    /**
     * - HTML element that will contain text runs.
     */
    container: HTMLElement;
    /**
     * - The target
     * viewport to properly layout the text runs.
     */
    viewport: import("./display_utils").PageViewport;
    /**
     * - HTML elements that are correspond
     * to the text items of the textContent input. This is output and shall be
     * initially be set to empty array.
     */
    textDivs?: HTMLElement[] | undefined;
    /**
     * - Strings that correspond to
     * the `str` property of the text items of textContent input. This is output
     * and shall be initially be set to empty array.
     */
    textContentItemsStr?: string[] | undefined;
    /**
     * - Delay in milliseconds before rendering of the
     * text runs occurs.
     */
    timeout?: number | undefined;
    /**
     * - Whether to turn on the text
     * selection enhancement.
     */
    enhanceTextSelection?: boolean | undefined;
};
export type TextLayerRenderTask = {
    promise: Promise<void>;
    cancel: () => void;
    expandTextDivs: (expandDivs: boolean) => void;
};
/**
 * Text layer render parameters.
 *
 * @typedef {Object} TextLayerRenderParameters
 * @property {import("./api").TextContent} [textContent] - Text content to
 *   render (the object is returned by the page's `getTextContent` method).
 * @property {ReadableStream} [textContentStream] - Text content stream to
 *   render (the stream is returned by the page's `streamTextContent` method).
 * @property {HTMLElement} container - HTML element that will contain text runs.
 * @property {import("./display_utils").PageViewport} viewport - The target
 *   viewport to properly layout the text runs.
 * @property {Array<HTMLElement>} [textDivs] - HTML elements that are correspond
 *   to the text items of the textContent input. This is output and shall be
 *   initially be set to empty array.
 * @property {Array<string>} [textContentItemsStr] - Strings that correspond to
 *    the `str` property of the text items of textContent input. This is output
 *   and shall be initially be set to empty array.
 * @property {number} [timeout] - Delay in milliseconds before rendering of the
 *   text runs occurs.
 * @property {boolean} [enhanceTextSelection] - Whether to turn on the text
 *   selection enhancement.
 */
/**
 * @typedef {Object} TextLayerRenderTask
 * @property {Promise<void>} promise
 * @property {() => void} cancel
 * @property {(expandDivs: boolean) => void} expandTextDivs
 */
/**
 * @type {(renderParameters: TextLayerRenderParameters) => TextLayerRenderTask}
 */
export const renderTextLayer: (renderParameters: TextLayerRenderParameters) => TextLayerRenderTask;
