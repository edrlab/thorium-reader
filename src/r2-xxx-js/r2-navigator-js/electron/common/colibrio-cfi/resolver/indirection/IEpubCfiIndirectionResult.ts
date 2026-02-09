/**
 * Result object used by the EpubCfiResolver when it encounters an indirection where the caller must fetch a new document
 * in order to continue resolving the EPUBCFI.
 *
 **/
export declare interface IEpubCfiIndirectionResult {
    /**
     * The document URL where the indirection element was found.
     */
    documentUrl: URL;

    /**
     * The indirection element that should contain information about the document to fetch.
     */
    element: Element;
}
