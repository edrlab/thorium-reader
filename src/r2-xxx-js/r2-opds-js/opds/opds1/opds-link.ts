// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlItemType, XmlObject, XmlXPathSelector } from "@r2-utils-js/_utils/xml-js-mapper";

import { Availability } from "./opds-availability";
import { Copies } from "./opds-copies";
import { Holds } from "./opds-holds";
import { IndirectAcquisition } from "./opds-indirectAcquisition";

@XmlObject({
    app: "http://www.w3.org/2007/app",
    atom: "http://www.w3.org/2005/Atom",
    bibframe: "http://bibframe.org/vocab/",
    dcterms: "http://purl.org/dc/terms/",
    lcp: "http://readium.org/lcp-specs/ns",
    odl: "http://opds-spec.org/odl",
    opds: "http://opds-spec.org/2010/catalog",
    opensearch: "http://a9.com/-/spec/opensearch/1.1/",
    relevance: "http://a9.com/-/opensearch/extensions/relevance/1.0/",
    schema: "http://schema.org",
    thr: "http://purl.org/syndication/thread/1.0",
    xsi: "http://www.w3.org/2001/XMLSchema-instance",
})
export class Link {

    // XPATH ROOT: /atom:feed/atom:link
    // XPATH ROOT: /atom:feed/atom:entry/atom:link

    @XmlXPathSelector("opds:price/text()")
    public OpdsPrice!: number;

    @XmlXPathSelector("opds:price/@currencycode")
    public OpdsPriceCurrencyCode!: string;

    @XmlXPathSelector("opds:indirectAcquisition")
    @XmlItemType(IndirectAcquisition)
    public OpdsIndirectAcquisitions!: IndirectAcquisition[];

    // https://wiki.lyrasis.org/display/SIM/OPDS+For+Libraries#OPDSForLibraries-availability
    // @XmlItemType(Availability)
    @XmlXPathSelector("opds:availability")
    public OpdsAvailability!: Availability;

    // https://wiki.lyrasis.org/display/SIM/OPDS+For+Libraries#OPDSForLibraries-copies
    // @XmlItemType(Copies)
    @XmlXPathSelector("opds:copies")
    public OpdsCopies!: Copies;

    // https://wiki.lyrasis.org/display/SIM/OPDS+For+Libraries#OPDSForLibraries-holds
    // @XmlItemType(Holds)
    @XmlXPathSelector("opds:holds")
    public OpdsHolds!: Holds;

    // tslint:disable-next-line: max-line-length
    // https://readium.org/lcp-specs/notes/lcp-key-retrieval.html#including-a-hashed-passphrase-in-an-opds-1-catalog
    // tslint:disable-next-line: max-line-length
    // https://github.com/readium/lcp-specs/blob/master/notes/lcp-key-retrieval.md#including-a-hashed-passphrase-in-an-opds-1-catalog
    @XmlXPathSelector("lcp:hashed_passphrase/text()")
    public LcpHashedPassphrase!: string;

    @XmlXPathSelector("@type")
    public Type!: string;

    // @XmlXPathSelector("@*[local-name()='count' and namespace-uri()='http://purl.org/syndication/thread/1.0']")
    @XmlXPathSelector("@thr:count")
    public ThrCount!: number;

    @XmlXPathSelector("@opds:facetGroup")
    public FacetGroup!: string;

    @XmlXPathSelector("@href")
    public Href!: string;

    @XmlXPathSelector("@title")
    public Title!: string;

    @XmlXPathSelector("@rel")
    public Rel!: string;

    public HasRel(rel: string): boolean {
        return this.Rel === rel;
    }

    public SetRel(rel: string) {
        this.Rel = rel;
    }
}
