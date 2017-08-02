
// The renderer process send an empty message to the main process
export const CATALOG_GET_REQUEST = "catalog.get.request";

// The main process send a CatalogMessage to the renderer process
export const CATALOG_GET_RESPONSE = "catalog.get.response";

// The renderer process send an PublicationMessage to the main process
// The main process download the resources for the given publication
export const PUBLICATION_DOWNLOAD_REQUEST = "publication.download.request";

// The main process send a PublicationMessage to the renderer process
export const PUBLICATION_DOWNLOAD_RESPONSE = "publication.download.response";

// The renderer process request a cancel on a publication download
export const PUBLICATION_DOWNLOAD_CANCEL_REQUEST = "publication.download.cancel.request";

// The renderer process request a file import to the main process
export const PUBLICATION_FILE_IMPORT_REQUEST  = "publication.file.import.request";

export const PUBLICATION_FILE_DELETE_REQUEST  = "publication.file.delete.request";

export const SYNC_CATALOG_REQUEST = "sync.catalog.request";
export const SYNC_CATALOG_RESPONSE = "sync.catalog.response";

export const OPDS_LIST_REQUEST = "sync.opds.request";
export const OPDS_LIST_RESPONSE = "sync.opds.response";
export const OPDS_ADD_REQUEST = "sync.opds.add.request";

// The renderer process request to the main process the manifest of an epub file
export const STREAMER_MANIFEST_OPEN_REQUEST = "streamer.manifest.open.request";

export const STREAMER_MANIFEST_OPEN_RESPONSE = "streamer.manifest.open.response";

export const STREAMER_MANIFEST_CLOSE_REQUEST = "streamer.manifest.close.request";

export const STREAMER_MANIFEST_CLOSE_RESPONSE = "streamer.manifest.close.response";
