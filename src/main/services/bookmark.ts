import { injectable} from "inversify";

import {
    Bookmark,
    BookmarkCollection,
} from "readium-desktop/common/models/reader";

import { ConfigDb } from "readium-desktop/main/db/config-db";

const BOOKMARK_CONFIG_PREFIX_ID = "bookmark_";

@injectable()
export class BookmarkManager {
    // Config database
    private configDb: ConfigDb;

    public constructor(configDb: ConfigDb) {
        this.configDb = configDb;
    }

    /**
     * Save bookmark
     *
     * @param bookmark Bookmark object
     *
     */
    public async saveBookmark(bookmark: Bookmark): Promise<void> {
        const pubId = bookmark.publication.identifier;
        const configId = this.getPublicationBookmarkConfigId(pubId);
        const bookmarks = await this.getBookmarks(pubId);
        bookmarks[bookmark.identifier] = bookmark;
        await this.configDb.putOrUpdate({
            identifier: configId,
            bookmarks,
        });
    }

    /**
     * Get a identified bookmark of a given publication
     *
     * @param pubId Publication identifier
     * @param bookmarkId Bookmark identifier for the given publication
     *
     * @return Bookmark object
     */
    public async getBookmark(
        pubId: string,
        bookmarkId: string,
    ): Promise<Bookmark> {
        const bookmarks = await this.getBookmarks(pubId);
        return bookmarks[bookmarkId];
    }

    /**
     * Get bookmarks of a given publication
     *
     * @param pubId Publication identifier
     *
     * @return List of Bookmark objects
     */
    public async getBookmarks(pubId: string): Promise<BookmarkCollection> {
        const configId = this.getPublicationBookmarkConfigId(pubId);

        try {
            const configDb = await this.configDb.get(configId);
            return configDb.bookmarks;
        } catch (error) {
            return {};
        }
    }

    private getPublicationBookmarkConfigId(pubId: string) {
        return BOOKMARK_CONFIG_PREFIX_ID + pubId;
    }
}
