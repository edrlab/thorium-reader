import { Action } from "redux";

// Publication download action types
export const PUBLICATION_IMPORT_ADD = "PUBLICATION_IMPORT_ADD";
export const PUBLICATION_FILE_IMPORT = "PUBLICATION_FILE_IMPORT";
export const PUBLICATION_FILE_DELETE = "PUBLICATION_FILE_DELETE";

export interface PublicationImportAction extends Action {
    paths?: string[];
    identifier?: string;
}

export function add(paths: string[]): PublicationImportAction {
    return {
        type: PUBLICATION_IMPORT_ADD,
        paths,
    };
}

export function fileImport(paths: string[]): PublicationImportAction {
    return {
        type: PUBLICATION_FILE_IMPORT,
        paths,
    };
}

export function fileDelete(identifier: string): PublicationImportAction {
    return {
        type: PUBLICATION_FILE_DELETE,
        identifier,
    };
}
