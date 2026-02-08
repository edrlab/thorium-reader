// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { XmlItemType, XmlObject, XmlXPathSelector } from "@r2-utils-js/_utils/xml-js-mapper";

import { Author } from "./opds-author";
import { Category } from "./opds-category";
import { Link } from "./opds-link";
import { Serie } from "./opds-serie";

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
    xsi: "http://www.w3.org/2001/XMLSchema-instance",
})
export class Entry {

    // XPATH ROOT: /atom:feed/atom:entry

    @XmlXPathSelector("schema:Rating/@schema:ratingValue")
    public SchemaRatingValue!: string;
    @XmlXPathSelector("schema:Rating/@schema:additionalType")
    public SchemaRatingAdditionalType!: string;

    @XmlXPathSelector("@schema:additionalType")
    public SchemaAdditionalType!: string;

    @XmlXPathSelector("atom:title/text()")
    public Title!: string;
    @XmlXPathSelector("atom:title/@type")
    public TitleType!: string;

    @XmlXPathSelector("atom:subtitle/text()")
    public SubTitle!: string;
    @XmlXPathSelector("atom:subtitle/@type")
    public SubTitleType!: string;

    @XmlXPathSelector("atom:author")
    @XmlItemType(Author)
    public Authors!: Author[];

    @XmlXPathSelector("atom:id/text()")
    public Id!: string;

    @XmlXPathSelector("atom:summary/text()")
    public Summary!: string;
    @XmlXPathSelector("atom:summary/@type")
    public SummaryType!: string;

    @XmlXPathSelector("dcterms:language/text()")
    public DcLanguage!: string;

    @XmlXPathSelector("dcterms:extent/text()")
    public DcExtent!: string;

    @XmlXPathSelector("dcterms:publisher/text()")
    public DcPublisher!: string;

    @XmlXPathSelector("dcterms:rights/text()")
    public DcRights!: string;

    @XmlXPathSelector("dcterms:issued/text()")
    public DcIssued!: string;

    @XmlXPathSelector("dcterms:identifier/text()")
    public DcIdentifier!: string;
    @XmlXPathSelector("dcterms:identifier/@xsi:type")
    public DcIdentifierType!: string;

    @XmlXPathSelector("bibframe:distribution/@bibframe:ProviderName")
    public BibFrameDistributionProviderName!: string;

    @XmlXPathSelector("atom:category")
    @XmlItemType(Category)
    public Categories!: Category[];

    @XmlXPathSelector("atom:content/text()")
    public Content!: string;
    @XmlXPathSelector("atom:content/@type")
    public ContentType!: string;

    @XmlXPathSelector("atom:updated/text()")
    public Updated!: Date;

    @XmlXPathSelector("atom:published/text()")
    public Published!: Date;

    @XmlXPathSelector("atom:link")
    @XmlItemType(Link)
    public Links!: Link[];

    @XmlXPathSelector("schema:Series")
    @XmlItemType(Serie)
    public Series!: Serie[];
}
