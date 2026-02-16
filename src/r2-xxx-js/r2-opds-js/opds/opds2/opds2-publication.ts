// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import { JsonElementType, JsonObject, JsonProperty, OnDeserialized } from "ta-json-x";

import { Metadata } from "@r2-shared-js/models/metadata";
import { BelongsTo } from "@r2-shared-js/models/metadata-belongsto";
import { Contributor } from "@r2-shared-js/models/metadata-contributor";
import { Link } from "@r2-shared-js/models/publication-link";

import { OPDSLink } from "./opds2-link";

// import { Publication } from "@r2-shared-js/models/publication";

const METADATA_JSON_PROP = "metadata";
const LINKS_JSON_PROP = "links";
const IMAGES_JSON_PROP = "images";
const IMAGE_JSON_PROP = "image";

// tslint:disable-next-line:max-line-length
// https://github.com/opds-community/drafts/blob/4d82fb9a64f35a174a5f205c23ba623ec010d5ec/schema/publication.schema.json
@JsonObject()
export class OPDSPublication { // extends Publication

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/4d82fb9a64f35a174a5f205c23ba623ec010d5ec/schema/publication.schema.json#L7
    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/0ac78ab5c270a608c39b4b04fc90bd9b1d281896/schema/publication.schema.json#L13
    @JsonProperty(METADATA_JSON_PROP)
    public Metadata!: Metadata;

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/4d82fb9a64f35a174a5f205c23ba623ec010d5ec/schema/publication.schema.json#L10
    @JsonProperty(LINKS_JSON_PROP)
    @JsonElementType(OPDSLink)
    public Links!: OPDSLink[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/4d82fb9a64f35a174a5f205c23ba623ec010d5ec/schema/publication.schema.json#L52
    @JsonProperty(IMAGES_JSON_PROP)
    @JsonElementType(Link)
    public Images!: Link[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/r2-streamer-js/blob/751553db8c97d7a6d3ba9bc04f2153fbd7a8b4bc/misc/json-schema/opds/catalog-entry.schema.json#L40-L61
    @JsonProperty(IMAGE_JSON_PROP)
    public Image!: Link;

    public findFirstLinkByRel(rel: string): OPDSLink | undefined {

        return this.Links ? this.Links.find((l) => {
            return l.HasRel(rel);
        }) : undefined;
    }

    public AddImage(href: string, typeImage: string, height: number, width: number) {
        const i = new Link();

        i.Href = href;
        i.TypeLink = typeImage;
        if (height) {
            i.Height = height;
        }
        if (width) {
            i.Width = width;
        }

        if (!this.Images) {
            this.Images = [];
        }
        this.Images.push(i);
    }

    public AddLink_(href: string, typeLink: string, rel: string, title: string) {
        const l = new OPDSLink();
        l.Href = href;
        l.TypeLink = typeLink;
        if (rel) {
            l.AddRel(rel);
        }
        if (title) {
            l.Title = title;
        }

        if (!this.Links) {
            this.Links = [];
        }
        this.Links.push(l);
    }

    public AddAuthor(name: string, identifier: string, sortAs: string, href: string, typeLink: string) {
        const c = new Contributor();
        c.Name = name;
        if (identifier) {
            c.Identifier = identifier;
        }
        if (sortAs) {
            c.SortAs = sortAs;
        }

        const l = new Link();
        if (href) {
            l.Href = href;
        }
        if (typeLink) {
            l.TypeLink = typeLink;
        }

        if (href) {
            c.Links = [];
            c.Links.push(l);
        }

        if (!this.Metadata) {
            this.Metadata = new Metadata();
        }
        if (!this.Metadata.Author) {
            this.Metadata.Author = [];
        }
        this.Metadata.Author.push(c);
    }

    public AddSerie(name: string, position: number, href: string, typeLink: string) {

        const c = new Contributor();
        c.Name = name;
        c.Position = position;

        const l = new Link();
        if (href) {
            l.Href = href;
        }
        if (typeLink) {
            l.TypeLink = typeLink;
        }

        if (href) {
            c.Links = [];
            c.Links.push(l);
        }

        if (!this.Metadata) {
            this.Metadata = new Metadata();
        }
        if (!this.Metadata.BelongsTo) {
            this.Metadata.BelongsTo = new BelongsTo();
        }
        if (!this.Metadata.BelongsTo.Series) {
            this.Metadata.BelongsTo.Series = [];
        }

        this.Metadata.BelongsTo.Series.push(c);
    }

    public AddPublisher(name: string, href: string, typeLink: string) {
        const c = new Contributor();
        c.Name = name;

        const l = new Link();
        if (href) {
            l.Href = href;
        }
        if (typeLink) {
            l.TypeLink = typeLink;
        }

        if (href) {
            c.Links = [];
            c.Links.push(l);
        }

        if (!this.Metadata) {
            this.Metadata = new Metadata();
        }
        if (!this.Metadata.Publisher) {
            this.Metadata.Publisher = [];
        }
        this.Metadata.Publisher.push(c);
    }

    @OnDeserialized()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: TS6133 (is declared but its value is never read.)
    protected _OnDeserialized() {
        // tslint:disable-next-line:max-line-length
        // https://github.com/opds-community/drafts/blob/4d82fb9a64f35a174a5f205c23ba623ec010d5ec/schema/publication.schema.json#L78
        if (!this.Metadata) {
            console.log("OPDSPublication.Metadata is not set!");
        }
        // tslint:disable-next-line:max-line-length
        // https://github.com/opds-community/drafts/blob/4d82fb9a64f35a174a5f205c23ba623ec010d5ec/schema/publication.schema.json#L79
        if (!this.Links) {
            console.log("OPDSPublication.Links is not set!");
        }
        // tslint:disable-next-line:max-line-length
        // https://github.com/opds-community/drafts/blob/4d82fb9a64f35a174a5f205c23ba623ec010d5ec/schema/publication.schema.json#L80
        if (!this.Images && !this.Image) {
            console.log("OPDSPublication.Image[s] is not set!");
        }
    }
}
