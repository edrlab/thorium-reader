// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { injectable } from "inversify";
import * as lunr from "lunr";
import { ok } from "readium-desktop/common/utils/assert";
import { PublicationView } from "readium-desktop/common/views/publication";
import {
    PublicationDocument, PublicationDocumentWithoutTimestampable,
} from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { publicationActions } from "readium-desktop/main/redux/actions";
import { aboutFilteredDocs } from "readium-desktop/main/tools/filter";
import { Unsubscribe } from "redux";

import * as lunrde from "@lunr-languages/lunr.de.js";
import * as lunrfr from "@lunr-languages/lunr.fr.js";
import * as lunrmulti from "@lunr-languages/lunr.multi.js";
import * as lunrstemmer from "@lunr-languages/lunr.stemmer.support.js";

const debug = debug_("readium-desktop:main:db:repository:publication");

lunrstemmer(lunr);
lunrfr(lunr);
lunrde(lunr);
lunrmulti(lunr);

@injectable()
export class PublicationRepository {

    public async save(document: PublicationDocumentWithoutTimestampable): Promise<PublicationDocument> {
        debug("Publication SAVE: ", document);

        const pubAction = publicationActions.addPublication.build(document);
        const id = pubAction.payload[0]?.identifier;

        const store = diMainGet("store");
        let unsub: Unsubscribe;
        const p = new Promise<PublicationDocument>(
            (res, rej) => (unsub = store.subscribe(() => {
                debug("Publication SAVE store.subscribe ", id);

                // Logically this check is non-sensical, because save() should never be called for removed publications.
                // This is for safeguard consistency with usages of `store.getState().publication.db[document.identifier]`
                // (i.e. direct library access, not via the `findAll()` variants)
                const o = store.getState().publication.db[document.identifier];
                if (o && !o.removedButPreservedToAvoidReMigration) {
                    debug("Publication SAVE store.subscribe RESOLVE");
                    if (unsub) {
                        unsub();
                    }
                    res(o);
                    return;
                }

                debug("Publication SAVE store.subscribe PROMISE REJECT? ", id, " ?!".repeat(1000));
                if (unsub) {
                    unsub();
                }
                rej("!!?? PUBLICATION SAVE() o && !o.removedButPreservedToAvoidReMigration");

                // TODO: Promise 'p' can possibly never resolve or reject
                // (i.e. if the reducer associated with the 'addPublication' action somehow fails to insert in the publication store),
                // consequently consumers of save() (e.g. Redux Saga) can hang forever and cause the Unsubscribe memory leak
                //
                // More importantly: Promise 'p' forever remains unresolved
                // when the pub identifier is found (i.e. was successfully added) but the flag 'removedButPreservedToAvoidReMigration' is true
            })));

        debug("Publication SAVE action: ", id, pubAction);
        store.dispatch(pubAction);

        return p.finally(() => {
            debug("Publication SAVE finally unsub?: ", id, unsub ? "true" : "false");
        });
    }

    public async delete(identifier: string): Promise<void> {
        debug("Publication DELETE: ", identifier);

        const store = diMainGet("store");

        let unsub: Unsubscribe;
        const p = new Promise<void>(
            (res) => (unsub = store.subscribe(() => {
                debug("Publication DELETE store.subscribe ", identifier);

                const o = store.getState().publication.db[identifier];
                if (!o || o.removedButPreservedToAvoidReMigration) {
                    debug("Publication DELETE store.subscribe RESOLVE");
                    if (unsub) {
                        unsub();
                    }
                    res();
                    return;
                }
                debug("Publication DELETE store.subscribe PROMISE STALLED? ", identifier, " ?!".repeat(1000));

                // TODO: Promise 'p' can possibly never resolve or reject
                // (i.e. if the reducer associated with the 'deletePublication' action somehow fails to insert in the publication store),
                // consequently consumers of delete() (e.g. Redux Saga) can hang forever and cause the Unsubscribe memory leak
                //
                // More importantly: Promise 'p' forever remains unresolved
                // when the feed identifier is found or the flag 'removedButPreservedToAvoidReMigration' is false
                // (in other words, pub not successfully deleted)
            })));

        const feedAction = publicationActions.deletePublication.build(identifier);
        debug("Publication DELETE action: ", identifier, feedAction);
        store.dispatch(feedAction);

        await p.finally(() => {
            debug("Publication DELETE finally unsub?: ", identifier, unsub ? "true" : "false");
        });
    }

    public async get(identifier: string): Promise<PublicationDocument | undefined> {

        const store = diMainGet("store");
        const state = store.getState();

        const pub = state.publication.db[identifier];
        if (pub?.removedButPreservedToAvoidReMigration) {
            return undefined;
        }
        return pub;
    }

    public async findAll(): Promise<PublicationDocument[]> {

        const store = diMainGet("store");
        const state = store.getState();

        // use this to troubleshoot corrupted DB from filesystem dump
        // import * as fs from "fs";
        // import * as path from "path";
        // fs.writeFileSync(path.join(process.cwd(), "db.json"), JSON.stringify(state.publication.db, null, 4), { encoding: "utf8" });

        return Object.values(state.publication.db)
            .filter((v) => !v.removedButPreservedToAvoidReMigration);
    }

    public async findAllSortDesc(): Promise<PublicationDocument[]> {

        const pubs = await this.findAll();
        ok(Array.isArray(pubs));
        // WARNING: .sort() is in-place same-array mutation! (not a new array)
        // ... which is fine because findAll() creates a local array instance
        const docsSorted = pubs.sort((a,b) => b.createdAt - a.createdAt);

        return docsSorted;
    }

    public async findByHashId(hash: string): Promise<PublicationDocument | undefined> {

        const pubs = await this.findAll();
        ok(Array.isArray(pubs));
        const pub = pubs.find((f) => f.hash === hash);
        return pub;
    }

    public async findByTag(tag: string): Promise<PublicationDocument[]> {

        const pubs = await this.findAll();
        ok(Array.isArray(pubs));
        const pubsFiltered = pubs.filter((f) => f.tags.includes(tag));
        return pubsFiltered;
    }

    public async findByTitle(title: string): Promise<PublicationDocument[]> {

        const pubs = await this.findAll();
        ok(Array.isArray(pubs));
        const pubsFiltered = pubs.filter((f) => f.title === title);
        return pubsFiltered;
    }

    public async findByPublicationIdentifier(publicationIdentifier: string): Promise<PublicationDocument[]> {

        const pubs = await this.findAll();
        ok(Array.isArray(pubs));
        const pubsFiltered = pubs.filter((f) => f.identifier === publicationIdentifier);
        return pubsFiltered;
    }


    public async searchByTitleAndAuthor(titleOrAuthor: string): Promise<PublicationDocument[]> {

        try {

            const store = diMainGet("store");
            const state = store.getState();

            const pubs = Object.values(state.publication.db)
                .filter((v) => !v.removedButPreservedToAvoidReMigration);

            const publicationViewConverter = diMainGet("publication-view-converter");
            const pubViews: PublicationView[] = [];
            for (const pub of pubs) {
                pubViews.push(await publicationViewConverter.convertDocumentToView(pub));
            }

            const indexer = lunr(function (this: any) {

                try {
                    this.use((lunr as any).multiLanguage("en", "fr", "de"));
                } catch (e) {
                    console.log("lunr multilang not available", e);
                }

                this.field("title", { boost: 10 });
                this.field("author", { boost: 5 });
                // this.setRef("id");

                const docs = pubViews.map((v) => ({
                    id: v.identifier,
                    title: v.documentTitle,
                    author: v.authors.join(" "),
                }));

                docs.forEach((v) => {
                    this.add(v);
                });
            });

            const res = indexer.search(titleOrAuthor);
            if (!res) {
                return [];
            }

            ok(Array.isArray(res));
            const docs = res
                .map((v: any) => pubs.find((f) => v.ref === f.identifier))
                .filter((v) => !!v);

            return docs;

        } catch (e) {

            console.log("####");
            console.log("searchByTitle error ", e);
            console.log("####");

            return [];
        }
    }

    /** Returns all publication tags */
    public async getAllTags(): Promise<string[]> {

        const pubs = aboutFilteredDocs(await this.findAll());
        ok(Array.isArray(pubs));
        const tags: string[] = [];

        for (const doc of pubs) {
            for (const tag of doc.tags) {
                if (tags.indexOf(tag) >= 0) {
                    continue;
                }

                tags.push(tag);
            }
        }

        // Sort asc
        // WARNING: .sort() is in-place same-array mutation! (not a new array)
        // ... which is fine because this is a local array instance (stack)
        tags.sort();
        return tags;
    }
}
