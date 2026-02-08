// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
// https://github.com/edcarroll/ta-json
import {
    JsonConverter, JsonElementType, JsonObject, JsonProperty, OnDeserialized,
} from "ta-json-x";

import { LCP } from "@r2-lcp-js/parser/epub/lcp";
import { JsonStringConverter } from "@r2-utils-js/_utils/ta-json-string-converter";
import { IZip } from "@r2-utils-js/_utils/zip/zip";

import { IInternal } from "./internal";
import { Metadata } from "./metadata";
import { Link } from "./publication-link";

// import { JsonStringConverter } from "@r2-utils-js/_utils/ta-json-string-converter";
// import { IPublicationCollection } from "./publication-collection";

const debug = debug_("r2:shared#models/publication");

const METADATA_JSON_PROP = "metadata";
const LINKS_JSON_PROP = "links";
const READINGORDER_JSON_PROP = "readingOrder";
const SPINE_JSON_PROP = "spine";
const RESOURCES_JSON_PROP = "resources";
const TOC_JSON_PROP = "toc";
const PAGELIST_JSON_PROP = "page-list";
const PAGELIST_CAMEL_JSON_PROP = "pageList";
const LANDMARKS_JSON_PROP = "landmarks";
const LOI_JSON_PROP = "loi";
const LOA_JSON_PROP = "loa";
const LOV_JSON_PROP = "lov";
const LOT_JSON_PROP = "lot";

// tslint:disable-next-line:max-line-length
// https://github.com/readium/webpub-manifest/blob/0ac78ab5c270a608c39b4b04fc90bd9b1d281896/schema/publication.schema.json
@JsonObject()
export class Publication {

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/0ac78ab5c270a608c39b4b04fc90bd9b1d281896/schema/publication.schema.json#L6
    @JsonProperty("@context")
    @JsonElementType(String)
    @JsonConverter(JsonStringConverter)
    public Context!: string[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/0ac78ab5c270a608c39b4b04fc90bd9b1d281896/schema/publication.schema.json#L13
    @JsonProperty(METADATA_JSON_PROP)
    public Metadata!: Metadata;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/0ac78ab5c270a608c39b4b04fc90bd9b1d281896/schema/publication.schema.json#L16
    @JsonProperty(LINKS_JSON_PROP)
    @JsonElementType(Link)
    public Links!: Link[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/0ac78ab5c270a608c39b4b04fc90bd9b1d281896/schema/publication.schema.json#L44
    @JsonProperty(READINGORDER_JSON_PROP)
    @JsonElementType(Link)
    public Spine2!: Link[];
    @JsonProperty(SPINE_JSON_PROP)
    @JsonElementType(Link)
    public Spine1!: Link[] | undefined;
    get Spine(): Link[] | undefined {
        return this.Spine2 ? this.Spine2 : this.Spine1;
    }
    set Spine(spine: Link[] | undefined) {
        if (spine) {
            this.Spine1 = undefined;
            this.Spine2 = spine;
        }
    }

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/0ac78ab5c270a608c39b4b04fc90bd9b1d281896/schema/publication.schema.json#L51
    @JsonProperty(RESOURCES_JSON_PROP)
    @JsonElementType(Link)
    public Resources!: Link[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/publication.schema.json#L58
    @JsonProperty(TOC_JSON_PROP)
    @JsonElementType(Link)
    public TOC!: Link[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/subcollections.schema.json#L7
    @JsonProperty(PAGELIST_CAMEL_JSON_PROP)
    @JsonElementType(Link)
    public PageList2!: Link[];
    @JsonProperty(PAGELIST_JSON_PROP)
    @JsonElementType(Link)
    public PageList1!: Link[] | undefined;
    get PageList(): Link[] | undefined {
        return this.PageList2 ? this.PageList2 : this.PageList1;
    }
    set PageList(pagelist: Link[] | undefined) {
        if (pagelist) {
            this.PageList1 = undefined;
            this.PageList2 = pagelist;
        }
    }

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/subcollections.schema.json#L13
    @JsonProperty(LANDMARKS_JSON_PROP)
    @JsonElementType(Link)
    public Landmarks!: Link[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/subcollections.schema.json#L25
    @JsonProperty(LOI_JSON_PROP)
    @JsonElementType(Link)
    public LOI!: Link[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/subcollections.schema.json#L19
    @JsonProperty(LOA_JSON_PROP)
    @JsonElementType(Link)
    public LOA!: Link[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/subcollections.schema.json#L37
    @JsonProperty(LOV_JSON_PROP)
    @JsonElementType(Link)
    public LOV!: Link[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/917c83e798e3eda42b3e9d0dc92f0fef31b16211/schema/extensions/epub/subcollections.schema.json#L31
    @JsonProperty(LOT_JSON_PROP)
    @JsonElementType(Link)
    public LOT!: Link[];

    // // OPDS2
    // @JsonProperty("images")
    // @JsonElementType(Link)
    // public Images!: Link[];

    public LCP: LCP | undefined;

    public freeDestroy() {
        debug("freeDestroy: Publication");
        if (this.Internal) {
            const zipInternal = this.findFromInternal("zip");
            if (zipInternal) {
                const zip = zipInternal.Value as IZip;
                zip.freeDestroy();
            }
        }
    }

    public findFromInternal(key: string): IInternal | undefined {
        if (this.Internal) {
            const found = this.Internal.find((internal) => {
                return internal.Name === key;
            });
            if (found) {
                return found;
            }
        }
        return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public AddToInternal(key: string, value: any) {
        const existing = this.findFromInternal(key);
        if (existing) {
            existing.Value = value;
        } else {
            if (!this.Internal) {
                this.Internal = [];
            }

            const internal: IInternal = { Name: key, Value: value };
            this.Internal.push(internal);
        }
    }

    // public findLinKByHref(href: string): Link | undefined {
    //     if (this.Spine) {
    //         const ll = this.Spine.find((link) => {
    //             if (link.Href && href.indexOf(link.Href) >= 0) {
    //                 return true;
    //             }
    //             return false;
    //         });
    //         if (ll) {
    //             return ll;
    //         }
    //     }
    //     return undefined;
    // }

    public GetCover(): Link | undefined {
        return this.searchLinkByRel("cover");
    }

    public GetNavDoc(): Link | undefined {
        return this.searchLinkByRel("contents");
    }

    public searchLinkByRel(rel: string): Link | undefined {
        if (this.Resources) {
            const ll = this.Resources.find((link) => {
                return link.HasRel(rel);
            });
            if (ll) {
                return ll;
            }
        }

        if (this.Spine) {
            const ll = this.Spine.find((link) => {
                return link.HasRel(rel);
            });
            if (ll) {
                return ll;
            }
        }

        if (this.Links) {
            const ll = this.Links.find((link) => {
                return link.HasRel(rel);
            });
            if (ll) {
                return ll;
            }
        }

        return undefined;
    }

    // Note: currently only used internally for META-INF/license.lcpl?
    public AddLink(typeLink: string, rel: string[], url: string, templated: boolean | undefined) {
        const link = new Link();
        link.AddRels(rel);

        link.setHrefDecoded(url);

        link.TypeLink = typeLink;

        if (typeof templated !== "undefined") {
            link.Templated = templated;
        }

        if (!this.Links) {
            this.Links = [];
        }
        this.Links.push(link);
    }

    @OnDeserialized()
    // tslint:disable-next-line:no-unused-variable
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: TS6133 (is declared but its value is never read.)
    protected _OnDeserialized() {
        // tslint:disable-next-line:max-line-length
        // https://github.com/readium/webpub-manifest/blob/0ac78ab5c270a608c39b4b04fc90bd9b1d281896/schema/publication.schema.json#L60
        if (!this.Metadata) {
            console.log("Publication.Metadata is not set!");
        }
        // tslint:disable-next-line:max-line-length
        // https://github.com/readium/webpub-manifest/blob/0ac78ab5c270a608c39b4b04fc90bd9b1d281896/schema/publication.schema.json#L62
        if (!this.Spine) {
            console.log("Publication.Spine/ReadingOrder is not set!");
        }
        // TODO: many EPUB publications do not have Links
        // tslint:disable-next-line:max-line-length
        // https://github.com/readium/webpub-manifest/blob/0ac78ab5c270a608c39b4b04fc90bd9b1d281896/schema/publication.schema.json#L61
        // if (!this.Links) {
        //     console.log("Publication.Links is not set!");
        // }
    }

    // tslint:disable-next-line: member-ordering
    private Internal: IInternal[] | undefined;
}
