// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import {
    JsonConverter, JsonElementType, JsonObject, JsonProperty, OnDeserialized,
} from "ta-json-x";

import { JsonStringConverter } from "@r2-utils-js/_utils/ta-json-string-converter";

import { OPDSAvailability } from "./opds2-availability";
import { OPDSCopy } from "./opds2-copy";
import { OPDSFacet } from "./opds2-facet";
import { OPDSGroup } from "./opds2-group";
import { OPDSHold } from "./opds2-hold";
import { OPDSLink } from "./opds2-link";
import { OPDSMetadata } from "./opds2-metadata";
import { OPDSProperties } from "./opds2-properties";
import { OPDSPublication } from "./opds2-publication";

// application/opds+json

const METADATA_JSON_PROP = "metadata";
const FACETS_JSON_PROP = "facets";
const GROUPS_JSON_PROP = "groups";
const CATALOGS_JSON_PROP = "catalogs";
const PUBLICATIONS_JSON_PROP = "publications";
const LINKS_JSON_PROP = "links";
const NAVIGATION_JSON_PROP = "navigation";

const cloneLinkInfo = (linkSource: OPDSLink, linkDest: OPDSLink) => {

    if (!linkDest.Href && linkSource.Href) {
        linkDest.Href = linkSource.Href;
    }
    if (!linkDest.TypeLink && linkSource.TypeLink) {
        linkDest.TypeLink = linkSource.TypeLink;
    }
    if (!linkDest.Title && linkSource.Title) {
        linkDest.Title = linkSource.Title;
    }
    if ((!linkDest.Rel || !linkDest.Rel.length) && linkSource.Rel) {
        for (const r of linkSource.Rel) {
            linkDest.AddRel(r);
        }
    }

    if (linkSource.Properties) {

        if (linkSource.Properties.Availability) {
            if (!linkDest.Properties) {
                linkDest.Properties = new OPDSProperties();
            }
            linkDest.Properties.Availability = new OPDSAvailability();
            if (linkSource.Properties.Availability.Since) {
                linkDest.Properties.Availability.Since = linkSource.Properties.Availability.Since;
            }
            if (linkSource.Properties.Availability.Until) {
                linkDest.Properties.Availability.Until = linkSource.Properties.Availability.Until;
            }
            if (linkSource.Properties.Availability.State) {
                linkDest.Properties.Availability.State = linkSource.Properties.Availability.State;
            }
        }

        if (linkSource.Properties.Copies) {
            if (!linkDest.Properties) {
                linkDest.Properties = new OPDSProperties();
            }
            linkDest.Properties.Copies = new OPDSCopy();
            if (typeof linkSource.Properties.Copies.Available === "number") {
                linkDest.Properties.Copies.Available = linkSource.Properties.Copies.Available;
            }
            if (typeof linkSource.Properties.Copies.Total === "number") {
                linkDest.Properties.Copies.Total = linkSource.Properties.Copies.Total;
            }
        }

        if (linkSource.Properties.Holds) {
            if (!linkDest.Properties) {
                linkDest.Properties = new OPDSProperties();
            }
            linkDest.Properties.Holds = new OPDSHold();
            if (typeof linkSource.Properties.Holds.Position === "number") {
                linkDest.Properties.Holds.Position = linkSource.Properties.Holds.Position;
            }
            if (typeof linkSource.Properties.Holds.Total === "number") {
                linkDest.Properties.Holds.Total = linkSource.Properties.Holds.Total;
            }
        }

        if (typeof linkSource.Properties.NumberOfItems === "number") {
            if (!linkDest.Properties) {
                linkDest.Properties = new OPDSProperties();
            }
            linkDest.Properties.NumberOfItems = linkSource.Properties.NumberOfItems;
        }
    }
};

@JsonObject()
export class OPDSFeed {

    // TODO: not in JSON Schema?? https://github.com/opds-community/drafts/issues/23
    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/feed.schema.json
    @JsonProperty("@context")
    @JsonElementType(String)
    @JsonConverter(JsonStringConverter)
    public Context!: string[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/feed.schema.json#L7
    @JsonProperty(METADATA_JSON_PROP)
    public Metadata!: OPDSMetadata;

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/feed.schema.json#L11
    @JsonProperty(LINKS_JSON_PROP)
    @JsonElementType(OPDSLink)
    public Links!: OPDSLink[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/feed.schema.json#L40
    @JsonProperty(PUBLICATIONS_JSON_PROP)
    @JsonElementType(OPDSPublication)
    public Publications!: OPDSPublication[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/feed.schema.json#L48
    @JsonProperty(NAVIGATION_JSON_PROP)
    @JsonElementType(OPDSLink)
    public Navigation!: OPDSLink[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/feed.schema.json#L66
    @JsonProperty(FACETS_JSON_PROP)
    @JsonElementType(OPDSFacet)
    public Facets!: OPDSFacet[];

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/feed.schema.json#L86
    @JsonProperty(GROUPS_JSON_PROP)
    @JsonElementType(OPDSGroup)
    public Groups!: OPDSGroup[];

    // https://libraryregistry.librarysimplified.org/libraries
    // http://libraries.aldiko.com/home.json => https://libraries.aldiko.com/countries/france.json etc.
    @JsonProperty(CATALOGS_JSON_PROP)
    @JsonElementType(OPDSPublication)
    public Catalogs!: OPDSPublication[];

    public findFirstLinkByRel(rel: string): OPDSLink | undefined {

        return this.Links ? this.Links.find((l) => {
            return l.HasRel(rel);
        }) : undefined;
    }

    public AddLink(href: string, rel: string, typeLink: string, templated: boolean) {
        const l = new OPDSLink();
        l.Href = href;
        l.AddRel(rel);
        l.TypeLink = typeLink;
        if (templated) {
            l.Templated = true;
        }
        if (!this.Links) {
            this.Links = [];
        }
        this.Links.push(l);
    }

    public AddNavigation(title: string, href: string, rel: string, typeLink: string) {
        const l = new OPDSLink();
        l.Href = href;
        l.TypeLink = typeLink;
        l.AddRel(rel);
        if (title) {
            l.Title = title;
        }
        if (!this.Navigation) {
            this.Navigation = [];
        }
        this.Navigation.push(l);
    }

    public AddPagination(
        numberItems: number, itemsPerPage: number, currentPage: number,
        nextLink?: string, prevLink?: string,
        firstLink?: string, lastLink?: string) {

        if (!this.Metadata) {
            this.Metadata = new OPDSMetadata();
        }
        this.Metadata.CurrentPage = currentPage;
        this.Metadata.ItemsPerPage = itemsPerPage;
        this.Metadata.NumberOfItems = numberItems;

        if (nextLink) {
            this.AddLink(nextLink, "next", "application/opds+json", false);
        }
        if (prevLink) {
            this.AddLink(prevLink, "previous", "application/opds+json", false);
        }
        if (firstLink) {
            this.AddLink(firstLink, "first", "application/opds+json", false);
        }
        if (lastLink) {
            this.AddLink(lastLink, "last", "application/opds+json", false);
        }
    }

    public AddFacet(link: OPDSLink, group: string) {

        if (this.Facets) {
            const found = this.Facets.find((f) => {
                if (f.Metadata && f.Metadata.Title === group) {
                    if (!f.Links) {
                        f.Links = [];
                    }
                    f.Links.push(link);
                    return true;
                }
                return false;
            });
            if (found) {
                return;
            }
        }

        const facet = new OPDSFacet();

        facet.Metadata = new OPDSMetadata();
        facet.Metadata.Title = group;

        facet.Links = [];
        facet.Links.push(link);

        if (!this.Facets) {
            this.Facets = [];
        }
        this.Facets.push(facet);
    }

    public AddPublicationInGroup(publication: OPDSPublication, collLink: OPDSLink) {

        if (this.Groups) {
            const found1 = this.Groups.find((g) => {
                if (g.Links) {
                    const found2 = g.Links.find((l) => {

                        if (l.Href === collLink.Href) {
                            if (!g.Publications) {
                                g.Publications = [];
                            }
                            g.Publications.push(publication);
                            return true;
                        }
                        return false;
                    });
                    if (found2) {
                        return true;
                    }
                }
                return false;
            });

            if (found1) {
                return;
            }
        }

        const group = new OPDSGroup();
        group.Metadata = new OPDSMetadata();
        group.Metadata.Title = collLink.Title;

        group.Publications = [];
        group.Publications.push(publication);

        const linkSelf = new OPDSLink();
        linkSelf.AddRel("self"); // note that existing collLink.Rel will not be ported to linkSelf!
        cloneLinkInfo(collLink, linkSelf);

        group.Links = [];
        group.Links.push(linkSelf);

        if (!this.Groups) {
            this.Groups = [];
        }
        this.Groups.push(group);
    }

    public AddNavigationInGroup(link: OPDSLink, collLink: OPDSLink) {

        if (this.Groups) {
            const found1 = this.Groups.find((g) => {
                if (g.Links) {
                    const found2 = g.Links.find((l) => {

                        if (l.Href === collLink.Href) {
                            if (!g.Navigation) {
                                g.Navigation = [];
                            }
                            g.Navigation.push(link);
                            return true;
                        }
                        return false;
                    });
                    if (found2) {
                        return true;
                    }
                }
                return false;
            });

            if (found1) {
                return;
            }
        }

        const group = new OPDSGroup();
        group.Metadata = new OPDSMetadata();
        group.Metadata.Title = collLink.Title;

        group.Navigation = [];
        group.Navigation.push(link);

        const linkSelf = new OPDSLink();
        linkSelf.AddRel("self"); // note that existing collLink.Rel will not be ported to linkSelf!
        cloneLinkInfo(collLink, linkSelf);

        group.Links = [];
        group.Links.push(linkSelf);

        if (!this.Groups) {
            this.Groups = [];
        }
        this.Groups.push(group);
    }

    @OnDeserialized()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: TS6133 (is declared but its value is never read.)
    protected _OnDeserialized() {
        // tslint:disable-next-line:max-line-length
        // https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/feed.schema.json#L121
        if (!this.Metadata) {
            console.log("OPDS2Feed.Metadata is not set!");
        }
        // tslint:disable-next-line:max-line-length
        // https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/feed.schema.json#L122
        if (!this.Links) {
            console.log("OPDS2Feed.Links is not set!");
        }
        // tslint:disable-next-line:max-line-length
        // https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/feed.schema.json#L127
        if (!this.Publications && !this.Navigation && !this.Groups && !this.Catalogs) {
            console.log("One of OPDS2Feed.Publications|Navigation|Groups|Catalogs must be set!");
        }
    }
}
