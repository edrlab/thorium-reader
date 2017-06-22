import { Action } from "redux";

// Publication download action types
export const PUBLICATION_IMPORT_ADD = "PUBLICATION_IMPORT_ADD";
export const PUBLICATION_FILE_IMPORT = "PUBLICATION_FILE_IMPORT";

export interface PublicationImportAction extends Action {
    progress?: number;
    paths: string[];
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
