// Tweaked from: https://github.com/pouchdb-community/pouchdb-quick-search/issues/88
// tslint:disable: no-namespace
declare namespace PouchDB {
    namespace Search {
        interface SearchQuery<Content> {
            // Search string
            query?: string;

            // Or build the index
            build?: true;

            // Fields to search over
            fields: (Array<keyof Content>) | ({ [field in keyof Content]: number });

            limit?: number;
            skip?: number;

            mm?: string;

            filter?: (content: Content) => boolean;

            include_docs?: boolean;
            highlighting?: boolean;
            highlighting_pre?: string;
            highlighting_post?: string;

            stale?: "update_after" | "ok";

            language?: string | string[];

            destroy?: true;
        }

        interface SearchRow<T> {
            id: string;
            score: number;
            doc: T & { _id: string; _rev: string; };
        }

        interface SearchResponse<T> {
            rows: Array<SearchRow<T>>;
            total_rows: number;
        }
    }

    interface Database<Content extends {} = {}> {
        search(query: Search.SearchQuery<Content>): Promise<Search.SearchResponse<Content>>;
    }
}

declare module "pouchdb-quick-search" {
    const plugin: PouchDB.Plugin;
    export = plugin;
}
