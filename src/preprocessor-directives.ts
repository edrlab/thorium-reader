// build-time preprocessor directives
// (must be set by bundlers like WebPack / Browserify etc.)

declare const __RENDERER_APP_BASE_URL__: string;
export const _RENDERER_APP_BASE_URL = __RENDERER_APP_BASE_URL__;

declare const __RENDERER_READER_BASE_URL__: string;
export const _RENDERER_READER_BASE_URL = __RENDERER_READER_BASE_URL__;

declare const __NODE_MODULE_RELATIVE_URL__: string;
export const _NODE_MODULE_RELATIVE_URL = __NODE_MODULE_RELATIVE_URL__;

declare const __PACKAGING__: string;
export const _PACKAGING = __PACKAGING__;

declare const __POUCHDB_ADAPTER_NAME__: string;
export const _POUCHDB_ADAPTER_NAME = __POUCHDB_ADAPTER_NAME__;

// This ones needs to be inlined, no var allowed (because otherwise: dynamic require() import!)
// declare const __POUCHDB_ADAPTER_PACKAGE__: string;
// export const _POUCHDB_ADAPTER_PACKAGE = __POUCHDB_ADAPTER_PACKAGE__;

declare const __NODE_ENV__: string;
export const _NODE_ENV = __NODE_ENV__;

export const IS_DEV =

    // ... either build-time "var":
    __NODE_ENV__ === "DEV" ||

    // ... or when not packaging, check runtime process.env:
    __PACKAGING__ === "0" &&
    (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");
