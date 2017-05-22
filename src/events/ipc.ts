
// The renderer process send an empty message to the main process
export const CATALOG_GET_REQUEST = "catalog.get.request";

// The main process send a CatalogMessage to the renderer process
export const CATALOG_GET_RESPONSE = "catalog.get.response";

// The renderer process send an PublicationMessage to the main process
// The main process download the resources for the given publication
export const PUBLICATION_DOWNLOAD_REQUEST = "publication.download.request";

// The main process send a PublicationMessage to the renderer process
export const PUBLICATION_DOWNLOAD_RESPONSE = "publication.download.response";
