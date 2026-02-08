// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlItemType, XmlObject, XmlXPathSelector } from "@r2-utils-js/_utils/xml-js-mapper";

import { Author } from "./opds-author";
import { Entry } from "./opds-entry";
import { Link } from "./opds-link";

@XmlObject({
    app: "http://www.w3.org/2007/app",
    atom: "http://www.w3.org/2005/Atom",
    bibframe: "http://bibframe.org/vocab/",
    dcterms: "http://purl.org/dc/terms/",
    odl: "http://opds-spec.org/odl",
    opds: "http://opds-spec.org/2010/catalog",
    opensearch: "http://a9.com/-/spec/opensearch/1.1/",
    relevance: "http://a9.com/-/opensearch/extensions/relevance/1.0/",
    schema: "http://schema.org",
    thr: "http://purl.org/syndication/thread/1.0",
    xml: "http://www.w3.org/XML/1998/namespace",
    xsi: "http://www.w3.org/2001/XMLSchema-instance",
})
export class OPDS {

    // XPATH ROOT: /atom:feed

    @XmlXPathSelector("opensearch:totalResults/text()")
    public OpensearchTotalResults!: number;

    @XmlXPathSelector("opensearch:itemsPerPage/text()")
    public OpensearchItemsPerPage!: number;

    @XmlXPathSelector("atom:id/text()")
    public Id!: string;

    @XmlXPathSelector("atom:title/text()")
    public Title!: string;

    @XmlXPathSelector("atom:subtitle/text()")
    public SubTitle!: string;

    @XmlXPathSelector("atom:updated/text()")
    public Updated!: Date;

    @XmlXPathSelector("atom:icon/text()")
    public Icon!: string;

    @XmlXPathSelector("atom:author")
    @XmlItemType(Author)
    public Authors!: Author[];

    @XmlXPathSelector("@lang | @xml:lang")
    public Lang!: string;

    @XmlXPathSelector("atom:link")
    @XmlItemType(Link)
    public Links!: Link[];

    @XmlXPathSelector("atom:entry")
    @XmlItemType(Entry)
    public Entries!: Entry[];
}
