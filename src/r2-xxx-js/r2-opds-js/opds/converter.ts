// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Metadata } from "@r2-shared-js/models/metadata";
import { BelongsTo } from "@r2-shared-js/models/metadata-belongsto";
import { Contributor } from "@r2-shared-js/models/metadata-contributor";
import { Subject } from "@r2-shared-js/models/metadata-subject";
import { Link } from "@r2-shared-js/models/publication-link";

import { OPDS } from "./opds1/opds";
import { Entry } from "./opds1/opds-entry";
import { Link as Opds1Link } from "./opds1/opds-link";
import { OPDSFeed } from "./opds2/opds2";
import { OPDSAvailability } from "./opds2/opds2-availability";
import { OPDSCopy } from "./opds2/opds2-copy";
import { OPDSHold } from "./opds2/opds2-hold";
import { OPDSIndirectAcquisition } from "./opds2/opds2-indirectAcquisition";
import { OPDSLink } from "./opds2/opds2-link";
import { OPDSMetadata } from "./opds2/opds2-metadata";
import { OPDSPrice } from "./opds2/opds2-price";
import { OPDSProperties } from "./opds2/opds2-properties";
import { OPDSPublication } from "./opds2/opds2-publication";

// import { OPDSCollection } from "./opds2/opds2-collection";
// import { OPDSContributor } from "./opds2/opds2-contributor";
// import { OPDSPublicationMetadata } from "./opds2/opds2-publicationMetadata";

export const unescapeHtmlEntities = (str: string, onlyEssential: boolean | undefined = undefined): string => {
    if (onlyEssential) {
        return str
            .replace(/&lt;/g, "<") // &#60;
            .replace(/&amp;/g, "&") // &#38;
            ;
    }
    return str
        .replace(/&lt;/g, "<") // &#60;
        .replace(/&gt;/g, ">") // &#62;
        .replace(/&quot;/g, "\"") // &#34;
        .replace(/&#039;/g, "'") // &apos;
        .replace(/&apos;/g, "'") // xhtml, not html
        .replace(/&amp;/g, "&") // &#38;
        ;
};
export const escapeHtmlEntities = (str: string, onlyEssential: boolean | undefined = undefined): string => {
    if (onlyEssential) {
        return str
            .replace(/</g, "&lt;") // &#60;
            .replace(/&/g, "&amp;") // &#38;
            ;
    }
    return str
        .replace(/</g, "&lt;") // &#60;
        .replace(/>/g, "&gt;") // &#62;
        .replace(/"/g, "&quot;") // &#34;
        .replace(/'/g, "&#039;") // &apos;
        // .replace(/'/g, "&apos;") // xhtml, not html
        .replace(/&/g, "&amp;") // &#38;
        ;
};
const processTypedString = (str: string, type: string | undefined) => {
    if (type === "text/html" || type === "html") {
        // ALREADY UNESCAPED BY THE XPATH text() selector
        // e.g. @XmlXPathSelector("atom:content/text()")
        return str;
        // return unescapeHtmlEntities(str);
    } else if (type === "xhtml" || type && type.indexOf("xhtml") >= 0) {
        // CHILD(REN) XML NODES ALREADY SERIALIZED (INC. NAMESPACES) BY THE XPATH text() selector
        // e.g. @XmlXPathSelector("atom:content/text()")
        // ... BUT ONLY "ESSENTIAL" ESCAPED (&amp; and &lt;)
        // PS: we patch the erroneous Atom namespace for badly-authored OPDS feeds
        return str.replace(/http:\/\/www\.w3\.org\/2005\/Atom/g, "http://www.w3.org/1999/xhtml");
    }
    return str;
};
// https://datatracker.ietf.org/doc/html/rfc4287#page-16
const convertContentSummary = (entry: Entry): string | undefined => {

    if (entry.Content) {
        return processTypedString(entry.Content, entry.ContentType);
    } else if (entry.Summary) {
        return processTypedString(entry.Summary, entry.SummaryType);
    }

    return undefined;
};

export function convertOpds1ToOpds2_EntryToPublication(entry: Entry): OPDSPublication {

    const p = new OPDSPublication();
    p.Metadata = new Metadata();

    if (entry.Title) {
        p.Metadata.Title = processTypedString(entry.Title, entry.TitleType);
    }

    if (entry.SubTitle) {
        p.Metadata.SubTitle = processTypedString(entry.SubTitle, entry.SubTitleType);
    }

    if (entry.DcIdentifier) {
        p.Metadata.Identifier = entry.DcIdentifier;
    } else {
        p.Metadata.Identifier = entry.Id;
    }
    if (entry.DcLanguage) {
        p.Metadata.Language = [entry.DcLanguage];
    }
    p.Metadata.Modified = entry.Updated;
    p.Metadata.PublicationDate = entry.Published;
    p.Metadata.Rights = entry.DcRights;
    if (entry.Series) {
        entry.Series.forEach((s) => {
            const coll = new Contributor();
            coll.Name = s.Name;
            coll.Position = s.Position;
            const link = new Link();
            link.Href = s.Url;
            coll.Links = [];
            coll.Links.push(link);

            if (!p.Metadata.BelongsTo) {
                p.Metadata.BelongsTo = new BelongsTo();
            }
            if (!p.Metadata.BelongsTo.Series) {
                p.Metadata.BelongsTo.Series = [];
            }
            p.Metadata.BelongsTo.Series.push(coll);
        });
    }
    if (entry.DcPublisher) {
        const c = new Contributor();
        c.Name = entry.DcPublisher;
        if (!p.Metadata.Publisher) {
            p.Metadata.Publisher = [];
        }
        p.Metadata.Publisher.push(c);
    }

    if (entry.Categories) {
        entry.Categories.forEach((cat) => {
            const subj = new Subject();
            subj.Code = cat.Term;
            subj.Name = cat.Label;
            subj.Scheme = cat.Scheme;
            if (!p.Metadata.Subject) {
                p.Metadata.Subject = [];
            }
            p.Metadata.Subject.push(subj);
        });
    }
    if (entry.Authors) {
        entry.Authors.forEach((aut) => {

            const cont = new Contributor();
            cont.Name = aut.Name;
            cont.Identifier = aut.Uri;
            if (!p.Metadata.Author) {
                p.Metadata.Author = [];
            }
            p.Metadata.Author.push(cont);
        });
    }

    const t = convertContentSummary(entry);
    if (t) {
        p.Metadata.Description = t;
    }

    if (entry.Links) {
        entry.Links.forEach((link) => {
            const l = new OPDSLink();
            portLinkInfo(link, l);

            // tslint:disable-next-line: max-line-length
            // https://readium.org/lcp-specs/notes/lcp-key-retrieval.html#sample-of-readium-web-publication-manifest-supporting-a-link-to-an-lcp-license-and-an-lcp_hashed_passphrase-property
            // tslint:disable-next-line: max-line-length
            // https://github.com/readium/lcp-specs/blob/master/notes/lcp-key-retrieval.md#sample-of-readium-web-publication-manifest-supporting-a-link-to-an-lcp-license-and-an-lcp_hashed_passphrase-property
            if (link.LcpHashedPassphrase) {
                if (!l.Properties) {
                    l.Properties = new OPDSProperties();
                }

                if (!l.Properties.AdditionalJSON) {
                    l.Properties.AdditionalJSON = {};
                }
                l.Properties.AdditionalJSON.lcp_hashed_passphrase = link.LcpHashedPassphrase;
            }

            if (link.OpdsIndirectAcquisitions && link.OpdsIndirectAcquisitions.length) {
                if (!l.Properties) {
                    l.Properties = new OPDSProperties();
                }

                link.OpdsIndirectAcquisitions.forEach((ia) => {
                    const ind = new OPDSIndirectAcquisition();
                    ind.TypeAcquisition = ia.OpdsIndirectAcquisitionType;
                    if (ia.OpdsIndirectAcquisitions && ia.OpdsIndirectAcquisitions.length) {
                        ia.OpdsIndirectAcquisitions.forEach((iac) => {

                            const cia = new OPDSIndirectAcquisition();
                            cia.TypeAcquisition = iac.OpdsIndirectAcquisitionType;
                            if (!ind.Children) {
                                ind.Children = [];
                            }
                            ind.Children.push(cia);
                        });
                    }
                    if (!l.Properties.IndirectAcquisitions) {
                        l.Properties.IndirectAcquisitions = [];
                    }
                    l.Properties.IndirectAcquisitions.push(ind);
                });
            }

            if (link.OpdsPrice && link.OpdsPriceCurrencyCode) {
                if (!l.Properties) {
                    l.Properties = new OPDSProperties();
                }
                l.Properties.Price = new OPDSPrice();
                l.Properties.Price.Currency = link.OpdsPriceCurrencyCode;
                l.Properties.Price.Value = link.OpdsPrice;
            }

            if (link.HasRel("collection") || link.HasRel("http://opds-spec.org/group")) {
                // NOOP
            } else if (link.HasRel("http://opds-spec.org/image") ||
                link.HasRel("http://opds-spec.org/image/thumbnail") ||

                link.HasRel("http://opds-spec.org/cover") || // incorrect OPDS1, but exists in the wild :(
                link.HasRel("http://opds-spec.org/thumbnail") || // incorrect OPDS1, but exists in the wild :(

                link.HasRel("x-stanza-cover-image") || // legacy Stanza
                link.HasRel("x-stanza-cover-image-thumbnail")) {

                const iCoverRel = l.Rel.indexOf("http://opds-spec.org/cover");
                if (iCoverRel >= 0) {
                    l.Rel[iCoverRel] = "http://opds-spec.org/image"; // fix the erroneous OPDS1 rel
                }

                const iThumbnailRel = l.Rel.indexOf("http://opds-spec.org/thumbnail");
                if (iThumbnailRel >= 0) {
                    l.Rel[iThumbnailRel] = "http://opds-spec.org/image/thumbnail"; // fix the erroneous OPDS1 rel
                }

                if (!p.Images) {
                    p.Images = [];
                }
                p.Images.push(l);
            } else {
                if (!p.Links) {
                    p.Links = [];
                }
                p.Links.push(l);
            }
        });
    }

    return p;
}
export function convertOpds1ToOpds2_EntryToLink(entry: Entry): OPDSLink {

    const linkNav = new OPDSLink();

    if (entry.Title) {
        const t = processTypedString(entry.Title, entry.TitleType);
        if (t) {
            linkNav.Title = t;
        }
    }
    if (entry.Summary) {
        const s = processTypedString(entry.Summary, entry.SummaryType);
        if (s) {
            if (!linkNav.Properties) {
                linkNav.Properties = new OPDSProperties();
            }

            if (!linkNav.Properties.AdditionalJSON) {
                linkNav.Properties.AdditionalJSON = {};
            }
            linkNav.Properties.AdditionalJSON["http://www.w3.org/2005/Atom#summary"] = s;
            linkNav.Properties.AdditionalJSON.title_summary = s;
        }
    }

    if (entry.Links) {
        const atomLink = entry.Links.find((l) => {
            return l.Type && l.Type.indexOf("application/atom+xml") >= 0;
        });
        const link = atomLink ? atomLink : (entry.Links[0] ? entry.Links[0] : undefined);
        if (link) {
            portLinkInfo(link, linkNav);
        }
    }

    return linkNav;
}

// https://github.com/opds-community/opds-revision
export function convertOpds1ToOpds2(feed: OPDS): OPDSFeed {
    const opds2feed = new OPDSFeed();

    opds2feed.Metadata = new OPDSMetadata();
    opds2feed.Metadata.Title = feed.Title;
    opds2feed.Metadata.Modified = feed.Updated;
    if (feed.OpensearchTotalResults) {
        opds2feed.Metadata.NumberOfItems = feed.OpensearchTotalResults;
    }
    if (feed.OpensearchItemsPerPage) {
        opds2feed.Metadata.ItemsPerPage = feed.OpensearchItemsPerPage;
    }
    if (feed.Authors) {
        feed.Authors.forEach((aut) => {

            const cont = new Contributor();
            cont.Name = aut.Name;
            cont.Identifier = aut.Uri;
            if (!opds2feed.Metadata.Author) {
                opds2feed.Metadata.Author = [];
            }
            opds2feed.Metadata.Author.push(cont);
        });
    }
    if (feed.Entries) {
        feed.Entries.forEach((entry) => {
            let isAnNavigation = true;
            let thereIsAtomLink = false;
            // let thereIsImageLink = false;

            const collLink = new OPDSLink();

            if (entry.Links) {
                entry.Links.forEach((l) => {

                    // the JSON Schema uri-reference validator trips on space characters, but not unicode chars
                    if (l.Href) {
                        l.Href = l.Href.replace(/ /g, "%20");
                    }

                    // fix incorrect JPEG content type
                    if (l.Type === "image/jpg") {
                        l.Type = "image/jpeg";
                    }

                    // if (l.HasRel("http://opds-spec.org/acquisition")
                    //     || l.HasRel("http://opds-spec.org/acquisition/buy")) {
                    if ((l.Rel && l.Rel.indexOf("http://opds-spec.org/acquisition") === 0) ||
                        (!l.Rel && l.Type === "application/epub+zip")) {
                        if (!l.Rel) { // workaround for feed links with missing rel
                            l.Rel = "http://opds-spec.org/acquisition";
                        }
                        isAnNavigation = false;
                    }
                    if (l.HasRel("collection") || l.HasRel("http://opds-spec.org/group")) {
                        collLink.AddRel("collection"); // note that existing l.Rel will not be ported to collink!
                        portLinkInfo(l, collLink);
                    }

                    if (l.Type && l.Type.indexOf("application/atom+xml") >= 0) {
                        thereIsAtomLink = true;
                    }

                    // if (l.Type && l.Type.indexOf("image/") >= 0) {
                    //     thereIsImageLink = true;
                    // }
                });
            }

            const thereIsAuthor = entry.Authors && entry.Authors.length;

            // no acquisition link ... let's duck-type further to infer the "publications" nature:
            // thereIsImageLink cannot be used here, because some OPDS navigation feeds provide an image thumbnail
            if (isAnNavigation && thereIsAuthor) {
                isAnNavigation = false;
            }
            if (isAnNavigation && !thereIsAtomLink) {
                isAnNavigation = false;
            }

            if (!isAnNavigation) {
                const p = convertOpds1ToOpds2_EntryToPublication(entry);
                if (collLink.Href) {
                    opds2feed.AddPublicationInGroup(p, collLink);
                } else {
                    if (!opds2feed.Publications) {
                        opds2feed.Publications = [];
                    }
                    opds2feed.Publications.push(p);
                }
            } else {
                const linkNav = convertOpds1ToOpds2_EntryToLink(entry);
                if (collLink.Href) {
                    opds2feed.AddNavigationInGroup(linkNav, collLink);
                } else {
                    if (!opds2feed.Navigation) {
                        opds2feed.Navigation = [];
                    }
                    opds2feed.Navigation.push(linkNav);
                }
            }
        });
    }

    if (feed.Links) {
        feed.Links.forEach((l) => {

            // the JSON Schema uri-reference validator trips on space characters, but not unicode chars
            if (l.Href) {
                l.Href = l.Href.replace(/ /g, "%20");
            }

            const linkFeed = new OPDSLink();
            portLinkInfo(l, linkFeed);

            if (l.HasRel("http://opds-spec.org/facet")) {
                opds2feed.AddFacet(linkFeed, l.FacetGroup);
            } else {
                if (!opds2feed.Links) {
                    opds2feed.Links = [];
                }
                opds2feed.Links.push(linkFeed);
            }
        });
    }

    return opds2feed;
}

const portLinkInfo = (linkSource: Opds1Link, linkDest: OPDSLink) => {

    if (!linkDest.Href && linkSource.Href) {
        linkDest.Href = linkSource.Href;
    }
    if (!linkDest.TypeLink && linkSource.Type) {
        linkDest.TypeLink = linkSource.Type;
    }
    if (!linkDest.Title && linkSource.Title) {
        linkDest.Title = linkSource.Title;
    }
    if ((!linkDest.Rel || !linkDest.Rel.length) && linkSource.Rel) {
        linkDest.AddRel(linkSource.Rel);
    }

    if (linkSource.OpdsAvailability) {
        if (!linkDest.Properties) {
            linkDest.Properties = new OPDSProperties();
        }
        linkDest.Properties.Availability = new OPDSAvailability();
        if (linkSource.OpdsAvailability.Since) {
            linkDest.Properties.Availability.Since = linkSource.OpdsAvailability.Since;
        }
        if (linkSource.OpdsAvailability.Until) {
            linkDest.Properties.Availability.Until = linkSource.OpdsAvailability.Until;
        }
        if (linkSource.OpdsAvailability.State) {
            linkDest.Properties.Availability.State = linkSource.OpdsAvailability.State;
        } else if (linkSource.OpdsAvailability.Status) {
            linkDest.Properties.Availability.State = linkSource.OpdsAvailability.Status;
        }
    }

    if (linkSource.OpdsCopies) {
        if (!linkDest.Properties) {
            linkDest.Properties = new OPDSProperties();
        }
        linkDest.Properties.Copies = new OPDSCopy();
        if (typeof linkSource.OpdsCopies.Available === "number") {
            linkDest.Properties.Copies.Available = linkSource.OpdsCopies.Available;
        }
        if (typeof linkSource.OpdsCopies.Total === "number") {
            linkDest.Properties.Copies.Total = linkSource.OpdsCopies.Total;
        }
    }

    if (linkSource.OpdsHolds) {
        if (!linkDest.Properties) {
            linkDest.Properties = new OPDSProperties();
        }
        linkDest.Properties.Holds = new OPDSHold();
        if (typeof linkSource.OpdsHolds.Position === "number") {
            linkDest.Properties.Holds.Position = linkSource.OpdsHolds.Position;
        }
        if (typeof linkSource.OpdsHolds.Total === "number") {
            linkDest.Properties.Holds.Total = linkSource.OpdsHolds.Total;
        }
    }

    if (linkSource.ThrCount) {
        if (!linkDest.Properties) {
            linkDest.Properties = new OPDSProperties();
        }
        linkDest.Properties.NumberOfItems = linkSource.ThrCount;
    }
};
