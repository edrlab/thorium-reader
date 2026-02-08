// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import * as mime from "mime-types";
import moment from "moment";
import * as path from "path";
import * as xmldom from "@xmldom/xmldom";

import { MediaOverlayNode, timeStrToSeconds } from "@r2-shared-js/models/media-overlay";
import { DirectionEnum, MetadataSupportedKeys } from "@r2-shared-js/models/metadata";
import { Contributor } from "@r2-shared-js/models/metadata-contributor";
import { MediaOverlay } from "@r2-shared-js/models/metadata-media-overlay";
import { IStringMap } from "@r2-shared-js/models/metadata-multilang";
import { LayoutEnum, Properties } from "@r2-shared-js/models/metadata-properties";
import { Subject } from "@r2-shared-js/models/metadata-subject";
import { Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";
import { DelinearizeAccessModeSufficient } from "@r2-shared-js/models/ta-json-string-tokens-converter";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";
import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
import { XML } from "@r2-utils-js/_utils/xml-js-mapper";
import { IStreamAndLength, IZip } from "@r2-utils-js/_utils/zip/zip";
import { Transformers } from "@r2-shared-js/transform/transformer";

import { zipHasEntry } from "../_utils/zipHasEntry";
import { Rootfile } from "./epub/container-rootfile";
import { NCX } from "./epub/ncx";
import { NavLabel } from "./epub/ncx-navlabel";
import { NavPoint } from "./epub/ncx-navpoint";
import { OPF } from "./epub/opf";
import { Author } from "./epub/opf-author";
import { Manifest } from "./epub/opf-manifest";
import { Metafield } from "./epub/opf-metafield";
import { Title } from "./epub/opf-title";
import { SMIL } from "./epub/smil";
import { Par } from "./epub/smil-par";
import { Seq } from "./epub/smil-seq";
import { SeqOrPar } from "./epub/smil-seq-or-par";
import { MetaDate } from "./epub/opf-date";
import { AccessibilityMetadata } from "@r2-shared-js/models/metadata-accessibility";
import { AccessibilityCertification } from "@r2-shared-js/models/metadata-accessibility-certification";
import { removeUTF8BOM } from "@r2-utils-js/_utils/bom";

const debug = debug_("r2:shared#parser/epub-daisy-common");

const epub3 = "3.0";
const epub301 = "3.0.1";
const epub31 = "3.1";
// const epub2 = "2.0";
// const epub201 = "2.0.1";

export const mediaOverlayURLPath = "media-overlay.json";
export const mediaOverlayURLParam = "resource";

// https://github.com/readium/webpub-manifest/issues/52#issuecomment-601686135
export const BCP47_UNKNOWN_LANG = "und";

export const parseSpaceSeparatedString = (str: string | undefined | null): string[] => {
    return str ? str.trim().split(" ").map((role) => {
        return role.trim();
    }).filter((role) => {
        return role.length > 0;
    }) : [];
};

const getEpubVersion = (rootfile: Rootfile, opf: OPF): string | undefined => {

    if (rootfile.Version) {
        return rootfile.Version;
    } else if (opf.Version) {
        return opf.Version;
    }

    return undefined;
};

export const isEpub3OrMore = (rootfile: Rootfile, opf: OPF): boolean => {

    const version = getEpubVersion(rootfile, opf);
    return (version === epub3 || version === epub301 || version === epub31);
};

export const fillPublicationDate = (publication: Publication, rootfile: Rootfile | undefined, opf: OPF) => {

    let publishedDateStr: string | undefined;
    let modifiedDateStr: string | undefined;

    if (opf.Metadata?.Meta?.length) {
        for (const m of opf.Metadata.Meta) {
            if (m.Name === "dcterms:modified" && m.Content) {
                modifiedDateStr = m.Content;
                break;
            }
            if (m.Property === "dcterms:modified" && m.Data) {
                modifiedDateStr = m.Data;
                break;
            }
        }
    }

    const opfMetadataDateArray = ([] as MetaDate[]).concat(
        opf.Metadata?.DCMetadata?.Date?.length ? opf.Metadata.DCMetadata.Date : [],
        opf.Metadata?.Date?.length ? opf.Metadata.Date : [],
    );
    if (opfMetadataDateArray?.length) {
        for (const metaDate of opfMetadataDateArray) {
            if (!modifiedDateStr &&
                (metaDate.Event === "modification" || metaDate.Event === "ops-modification")) {
                modifiedDateStr = metaDate.Data;
            }
            if (!publishedDateStr &&
                (metaDate.Event === "publication" || metaDate.Event === "ops-publication")) {
                publishedDateStr = metaDate.Data;
                // <dc:date opf:event="original-publication">1860</dc:date>
                // <dc:date opf:event="ops-publication">2008-03-11</dc:date>
            }
            if (modifiedDateStr && publishedDateStr) {
                break;
            }
        }
        // fallback 1: first date without explicit OPF "event" (EPUB2)
        if (!publishedDateStr) {
            for (const metaDate of opfMetadataDateArray) {
                if (!metaDate.Event) {
                    publishedDateStr = metaDate.Data;
                    // <dc:date>1860</dc:date>
                    break;
                }
            }
        }
        // fallback 2: first date in OPF XML (EPUB3)
        if (!publishedDateStr) {
            if (!rootfile || isEpub3OrMore(rootfile, opf)) {
                publishedDateStr = opfMetadataDateArray[0].Data;
            }
        }
    }

    if (publishedDateStr) {
        try {
            const mom = moment(publishedDateStr);
            if (mom.isValid()) {
                publication.Metadata.PublicationDate = mom.toDate();
            }
        } catch (_err) {
            debug("INVALID published DATE/TIME? " + publishedDateStr);
        }
    }

    if (modifiedDateStr) {
        try {
            const mom = moment(modifiedDateStr);
            if (mom.isValid()) {
                publication.Metadata.Modified = mom.toDate();
            }
        } catch (_err) {
            debug("INVALID modified DATE/TIME? " + modifiedDateStr);
        }
    }
};

export const fillSubject = (publication: Publication, opf: OPF) => {

    const opfMetadataSubject =
        opf.Metadata?.DCMetadata?.Subject?.length ?
            opf.Metadata.DCMetadata.Subject :
            (opf.Metadata?.Subject?.length ?
                opf.Metadata.Subject :
                undefined);

    if (opfMetadataSubject) {
        opfMetadataSubject.forEach((s) => {
            const sub = new Subject();

            const xmlLang: string = s.Lang || opf.Lang;
            const isLangOverride = s.Lang && opf.Lang && s.Lang !== opf.Lang;
            if (xmlLang && (isLangOverride || langStringIsRTL(xmlLang.toLowerCase()))) {
                sub.Name = {} as IStringMap;
                sub.Name[xmlLang.toLowerCase()] = s.Data;
            } else {
                sub.Name = s.Data;
            }
            sub.Code = s.Term;
            sub.Scheme = s.Authority;
            if (!publication.Metadata.Subject) {
                publication.Metadata.Subject = [];
            }
            publication.Metadata.Subject.push(sub);
        });
    }
};

export const findContributorInMeta = (publication: Publication, rootfile: Rootfile | undefined, opf: OPF) => {
    if (!rootfile || isEpub3OrMore(rootfile, opf)) {
        const func = (meta: Metafield) => {
            if (meta.Property === "dcterms:creator" || meta.Property === "dcterms:contributor") {
                const cont = new Author();
                cont.Data = meta.Data;
                cont.ID = meta.ID;
                addContributor(publication, rootfile, opf, cont, undefined);
            }
        };
        if (opf.Metadata?.XMetadata?.Meta?.length) {
            opf.Metadata.XMetadata.Meta.forEach(func);
        }
        if (opf.Metadata?.Meta?.length) {
            opf.Metadata.Meta.forEach(func);
        }
    }
};

export const addContributor = (
    publication: Publication, rootfile: Rootfile | undefined,
    opf: OPF, cont: Author, forcedRole: string | undefined) => {

    const contributor = new Contributor();
    let role: string | undefined;

    // const epubVersion = getEpubVersion(rootfile, opf);

    if (rootfile && isEpub3OrMore(rootfile, opf)) {

        if (cont.FileAs) {
            contributor.SortAs = cont.FileAs;
        } else {
            const metaFileAs = findMetaByRefineAndProperty(opf, cont.ID, "file-as");
            if (metaFileAs && metaFileAs.Property === "file-as") {
                contributor.SortAs = metaFileAs.Data;
            }
        }

        const metaRole = findMetaByRefineAndProperty(opf, cont.ID, "role");
        if (metaRole && metaRole.Property === "role") {
            role = metaRole.Data;
        }
        if (!role && forcedRole) {
            role = forcedRole;
        }

        const metaAlt = findAllMetaByRefineAndProperty(opf, cont.ID, "alternate-script");
        if (metaAlt && metaAlt.length) {
            contributor.Name = {} as IStringMap;

            metaAlt.forEach((m) => {
                if (m.Lang) {
                    (contributor.Name as IStringMap)[m.Lang.toLowerCase()] = m.Data;
                }
            });

            // https://github.com/readium/architecture/blob/master/streamer/parser/metadata.md#title
            const xmlLang: string = cont.Lang || opf.Lang;
            if (xmlLang) {
                contributor.Name[xmlLang.toLowerCase()] = cont.Data;
            } else if (publication.Metadata &&
                publication.Metadata.Language &&
                publication.Metadata.Language.length &&
                !contributor.Name[publication.Metadata.Language[0].toLowerCase()]) {
                contributor.Name[publication.Metadata.Language[0].toLowerCase()] = cont.Data;
            } else {
                // tslint:disable-next-line: no-string-literal
                contributor.Name[BCP47_UNKNOWN_LANG] = cont.Data;
            }
        } else {
            const xmlLang: string = cont.Lang || opf.Lang;
            const isLangOverride = cont.Lang && opf.Lang && cont.Lang !== opf.Lang;
            if (xmlLang && (isLangOverride || langStringIsRTL(xmlLang.toLowerCase()))) {
                contributor.Name = {} as IStringMap;
                contributor.Name[xmlLang.toLowerCase()] = cont.Data;
            } else {
                contributor.Name = cont.Data;
            }
        }
    } else {
        const xmlLang: string = cont.Lang || opf.Lang;
        const isLangOverride = cont.Lang && opf.Lang && cont.Lang !== opf.Lang;
        if (xmlLang && (isLangOverride || langStringIsRTL(xmlLang.toLowerCase()))) {
            contributor.Name = {} as IStringMap;
            contributor.Name[xmlLang.toLowerCase()] = cont.Data;
        } else {
            contributor.Name = cont.Data;
        }
        role = cont.Role;
        if (!role && forcedRole) {
            role = forcedRole;
        }
    }

    if (role) {
        switch (role) {
            case "aut": {
                if (!publication.Metadata.Author) {
                    publication.Metadata.Author = [];
                }
                publication.Metadata.Author.push(contributor);
                break;
            }
            case "trl": {
                if (!publication.Metadata.Translator) {
                    publication.Metadata.Translator = [];
                }
                publication.Metadata.Translator.push(contributor);
                break;
            }
            case "art": {
                if (!publication.Metadata.Artist) {
                    publication.Metadata.Artist = [];
                }
                publication.Metadata.Artist.push(contributor);
                break;
            }
            case "edt": {
                if (!publication.Metadata.Editor) {
                    publication.Metadata.Editor = [];
                }
                publication.Metadata.Editor.push(contributor);
                break;
            }
            case "ill": {
                if (!publication.Metadata.Illustrator) {
                    publication.Metadata.Illustrator = [];
                }
                publication.Metadata.Illustrator.push(contributor);
                break;
            }
            case "ltr": {
                if (!publication.Metadata.Letterer) {
                    publication.Metadata.Letterer = [];
                }
                publication.Metadata.Letterer.push(contributor);
                break;
            }
            case "pen": {
                if (!publication.Metadata.Penciler) {
                    publication.Metadata.Penciler = [];
                }
                publication.Metadata.Penciler.push(contributor);
                break;
            }
            case "clr": {
                if (!publication.Metadata.Colorist) {
                    publication.Metadata.Colorist = [];
                }
                publication.Metadata.Colorist.push(contributor);
                break;
            }
            case "ink": {
                if (!publication.Metadata.Inker) {
                    publication.Metadata.Inker = [];
                }
                publication.Metadata.Inker.push(contributor);
                break;
            }
            case "nrt": {
                if (!publication.Metadata.Narrator) {
                    publication.Metadata.Narrator = [];
                }
                publication.Metadata.Narrator.push(contributor);
                break;
            }
            case "pbl": {
                if (!publication.Metadata.Publisher) {
                    publication.Metadata.Publisher = [];
                }
                publication.Metadata.Publisher.push(contributor);
                break;
            }
            default: {
                contributor.Role = [role];

                if (!publication.Metadata.Contributor) {
                    publication.Metadata.Contributor = [];
                }
                publication.Metadata.Contributor.push(contributor);
            }
        }
    }
};

export const findMetaByRefineAndProperty = (opf: OPF, ID: string, property: string): Metafield | undefined => {

    const ret = findAllMetaByRefineAndProperty(opf, ID, property);
    if (ret.length) {
        return ret[0];
    }
    return undefined;
};

export const findAllMetaByRefineAndProperty = (opf: OPF, ID: string, property: string): Metafield[] => {

    const metas: Metafield[] = [];

    const refineID = "#" + ID;

    const func = (metaTag: Metafield) => {
        if (metaTag.Refine === refineID && metaTag.Property === property) {
            metas.push(metaTag);
        }
    };
    if (opf.Metadata?.XMetadata?.Meta?.length) {
        opf.Metadata.XMetadata.Meta.forEach(func);
    }
    if (opf.Metadata?.Meta?.length) {
        opf.Metadata.Meta.forEach(func);
    }

    return metas;
};

export const findInSpineByHref = (publication: Publication, href: string): Link | undefined => {

    if (publication.Spine && publication.Spine.length) {
        const ll = publication.Spine.find((l) => {
            if (l.HrefDecoded === href) {
                return true;
            }
            return false;
        });
        if (ll) {
            return ll;
        }
    }

    return undefined;
};

type FuncType = (
    publication: Publication, rootfile: Rootfile | undefined,
    opf: OPF, zip: IZip, linkItem: Link, item: Manifest) => Promise<void>;

export const findInManifestByID = async (
    publication: Publication, rootfile: Rootfile | undefined, opf: OPF, ID: string, zip: IZip,
    addLinkData: FuncType): Promise<Link> => {

    if (opf.Manifest && opf.Manifest.length) {
        const item = opf.Manifest.find((manItem) => {
            if (manItem.ID === ID) {
                return true;
            }
            return false;
        });
        if (item && opf.ZipPath) {
            const linkItem = new Link();
            linkItem.TypeLink = item.MediaType;

            const itemHrefDecoded = item.HrefDecoded;
            if (!itemHrefDecoded) {
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                return Promise.reject("item.Href?!");
            }
            linkItem.setHrefDecoded(path.join(path.dirname(opf.ZipPath), itemHrefDecoded)
                .replace(/\\/g, "/"));

            await addLinkData(publication, rootfile, opf, zip, linkItem, item);

            return linkItem;
        }
    }
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    return Promise.reject(`ID ${ID} not found`);
};

export const fillSpineAndResource = async (
    publication: Publication, rootfile: Rootfile | undefined, opf: OPF, zip: IZip,
    addLinkData: FuncType) => {

    if (!opf.ZipPath) {
        return;
    }

    if (opf.Spine && opf.Spine.Items && opf.Spine.Items.length) {
        for (const item of opf.Spine.Items) {

            if (!item.Linear || item.Linear === "yes" ||
                (item.Linear === "no" && publication.Metadata?.Rendition?.Layout === LayoutEnum.Fixed) // stupid evil thing ... but unfortunately some "commercial-grade" FXL publications have linear=no on first spine item / cover document (image), which displays normally in iBooks / Apple Books.app because of their implementation choice (which sets an unfortunate precedent ... mind you, the EPUB specification is quite loose about processing / rendering requirements for linear=no, so we can't just blame reading system implementors and/or content authors!)
            ) {

                let linkItem: Link;
                try {
                    linkItem = await findInManifestByID(publication, rootfile, opf, item.IDref, zip, addLinkData);
                } catch (err) {
                    debug(err);
                    continue;
                }

                if (linkItem && linkItem.Href) {
                    if (!publication.Spine) {
                        publication.Spine = [];
                    }
                    publication.Spine.push(linkItem);
                }
            }
        }
    }

    if (opf.Manifest && opf.Manifest.length) {

        for (const item of opf.Manifest) {

            const itemHrefDecoded = item.HrefDecoded;
            if (!itemHrefDecoded) {
                debug("!? item.Href", JSON.stringify(item, null, 4));
                continue;
            }
            const zipPath = path.join(path.dirname(opf.ZipPath), itemHrefDecoded)
                .replace(/\\/g, "/");
            const linkSpine = findInSpineByHref(publication, zipPath);
            if (!linkSpine || !linkSpine.Href) {

                const linkItem = new Link();
                linkItem.TypeLink = item.MediaType;

                linkItem.setHrefDecoded(zipPath);

                if (!publication.Resources) {
                    publication.Resources = [];
                }
                publication.Resources.push(linkItem);

                await addLinkData(publication, rootfile, opf, zip, linkItem, item);
            }
        }
    }
};

export const addLanguage = (publication: Publication, opf: OPF) => {

    const opfMetadataLanguage =
        opf.Metadata?.DCMetadata?.Language?.length ?
            opf.Metadata.DCMetadata.Language :
            (opf.Metadata?.Language?.length ?
                opf.Metadata.Language :
                undefined);

    if (opfMetadataLanguage) {
        publication.Metadata.Language = opfMetadataLanguage;
    }
};

export const addIdentifier = (publication: Publication, opf: OPF) => {

    const opfMetadataIdentifier =
        opf.Metadata?.DCMetadata?.Identifier?.length ?
            opf.Metadata.DCMetadata.Identifier :
            (opf.Metadata?.Identifier?.length ?
                opf.Metadata.Identifier :
                undefined);

    if (opfMetadataIdentifier) {
        if (opf.UniqueIdentifier && opfMetadataIdentifier.length > 1) {
            opfMetadataIdentifier.forEach((iden) => {
                if (iden.ID === opf.UniqueIdentifier) {
                    publication.Metadata.Identifier = iden.Data;
                }
            });
        } else if (opfMetadataIdentifier.length > 0) {
            publication.Metadata.Identifier = opfMetadataIdentifier[0].Data;
        }
    }
};

export const addTitle = (publication: Publication, rootfile: Rootfile | undefined, opf: OPF) => {

    const opfMetadataTitle =
        opf.Metadata?.DCMetadata?.Title?.length ?
            opf.Metadata.DCMetadata.Title :
            (opf.Metadata?.Title?.length ?
                opf.Metadata.Title :
                undefined);

    if (rootfile && isEpub3OrMore(rootfile, opf)) {
        let mainTitle: Title | undefined;
        let subTitle: Title | undefined;
        let subTitleDisplaySeq = 0;

        if (opfMetadataTitle) {

            if (opf.Metadata?.Meta || opf.Metadata?.XMetadata?.Meta) {
                const tt = opfMetadataTitle.find((title) => {
                    const refineID = "#" + title.ID;

                    const func0 = (meta: Metafield) => {
                        // meta.Property === "title-type"
                        if (meta.Data === "main" && meta.Refine === refineID) {
                            return true;
                        }
                        return false;
                    };
                    let m = opf.Metadata?.Meta ? opf.Metadata.Meta.find(func0) : undefined;
                    if (!m && opf.Metadata?.XMetadata?.Meta) {
                        m = opf.Metadata.XMetadata.Meta.find(func0);
                    }
                    if (m) {
                        return true;
                    }
                    return false;
                });
                if (tt) {
                    mainTitle = tt;
                }

                opfMetadataTitle.forEach((title) => {
                    const refineID = "#" + title.ID;

                    const func1 = (meta: Metafield) => {
                        // meta.Property === "title-type"
                        if (meta.Data === "subtitle" && meta.Refine === refineID) {
                            return true;
                        }
                        return false;
                    };
                    let m = opf.Metadata?.Meta ? opf.Metadata.Meta.find(func1) : undefined;
                    if (!m && opf.Metadata?.XMetadata?.Meta) {
                        m = opf.Metadata.XMetadata.Meta.find(func1);
                    }
                    if (m) {
                        let titleDisplaySeq = 0;
                        const func2 = (meta: Metafield) => {
                            if (meta.Property === "display-seq" && meta.Refine === refineID) {
                                return true;
                            }
                            return false;
                        };
                        let mds = opf.Metadata?.Meta ? opf.Metadata.Meta.find(func2) : undefined;
                        if (!mds && opf.Metadata?.XMetadata?.Meta) {
                            mds = opf.Metadata.XMetadata.Meta.find(func2);
                        }
                        if (mds) {
                            try {
                                titleDisplaySeq = parseInt(mds.Data, 10);
                            } catch (err) {
                                debug(err);
                                debug(mds.Data);
                                titleDisplaySeq = 0;
                            }
                            if (isNaN(titleDisplaySeq)) {
                                debug("NaN");
                                debug(mds.Data);
                                titleDisplaySeq = 0;
                            }
                        } else {
                            titleDisplaySeq = 0;
                        }
                        if (!subTitle || titleDisplaySeq < subTitleDisplaySeq) {
                            subTitle = title;
                            subTitleDisplaySeq = titleDisplaySeq;
                        }
                    }
                });
            }

            if (!mainTitle) {
                mainTitle = opfMetadataTitle[0];
            }
        }

        if (mainTitle) {
            const metaAlt = findAllMetaByRefineAndProperty(opf, mainTitle.ID, "alternate-script");
            if (metaAlt && metaAlt.length) {
                publication.Metadata.Title = {} as IStringMap;

                metaAlt.forEach((m) => {
                    if (m.Lang) {
                        (publication.Metadata.Title as IStringMap)[m.Lang.toLowerCase()] = m.Data;
                    }
                });

                // https://github.com/readium/architecture/blob/master/streamer/parser/metadata.md#title
                const xmlLang: string = mainTitle.Lang || opf.Lang;
                if (xmlLang) {
                    publication.Metadata.Title[xmlLang.toLowerCase()] = mainTitle.Data;
                } else if (publication.Metadata.Language &&
                    publication.Metadata.Language.length &&
                    !publication.Metadata.Title[publication.Metadata.Language[0].toLowerCase()]) {
                    publication.Metadata.Title[publication.Metadata.Language[0].toLowerCase()] = mainTitle.Data;
                } else {
                    // tslint:disable-next-line: no-string-literal
                    publication.Metadata.Title[BCP47_UNKNOWN_LANG] = mainTitle.Data;
                }

            } else {
                const xmlLang: string = mainTitle.Lang || opf.Lang;
                const isLangOverride = mainTitle.Lang && opf.Lang && mainTitle.Lang !== opf.Lang;
                if (xmlLang && (isLangOverride || langStringIsRTL(xmlLang.toLowerCase()))) {
                    publication.Metadata.Title = {} as IStringMap;
                    publication.Metadata.Title[xmlLang.toLowerCase()] = mainTitle.Data;
                } else {
                    publication.Metadata.Title = mainTitle.Data;
                }
            }
        }

        if (subTitle) {
            const metaAlt = findAllMetaByRefineAndProperty(opf, subTitle.ID, "alternate-script");
            if (metaAlt && metaAlt.length) {
                publication.Metadata.SubTitle = {} as IStringMap;

                metaAlt.forEach((m) => {
                    if (m.Lang) {
                        (publication.Metadata.SubTitle as IStringMap)[m.Lang.toLowerCase()] = m.Data;
                    }
                });

                // https://github.com/readium/architecture/blob/master/streamer/parser/metadata.md#title
                const xmlLang: string = subTitle.Lang || opf.Lang;
                if (xmlLang) {
                    publication.Metadata.SubTitle[xmlLang.toLowerCase()] = subTitle.Data;
                } else if (publication.Metadata.Language &&
                    publication.Metadata.Language.length &&
                    !publication.Metadata.SubTitle[publication.Metadata.Language[0].toLowerCase()]) {
                    publication.Metadata.SubTitle[publication.Metadata.Language[0].toLowerCase()] = subTitle.Data;
                } else {
                    // tslint:disable-next-line: no-string-literal
                    publication.Metadata.SubTitle[BCP47_UNKNOWN_LANG] = subTitle.Data;
                }

            } else {
                const xmlLang: string = subTitle.Lang || opf.Lang;
                const isLangOverride = subTitle.Lang && opf.Lang && subTitle.Lang !== opf.Lang;
                if (xmlLang && (isLangOverride || langStringIsRTL(xmlLang.toLowerCase()))) {
                    publication.Metadata.SubTitle = {} as IStringMap;
                    publication.Metadata.SubTitle[xmlLang.toLowerCase()] = subTitle.Data;
                } else {
                    publication.Metadata.SubTitle = subTitle.Data;
                }
            }
        }

    } else {
        if (opfMetadataTitle) {
            const xmlLang: string = opfMetadataTitle[0].Lang || opf.Lang;
            const isLangOverride = opfMetadataTitle[0].Lang && opf.Lang && opfMetadataTitle[0].Lang !== opf.Lang;
            if (xmlLang && (isLangOverride || langStringIsRTL(xmlLang.toLowerCase()))) {
                publication.Metadata.Title = {} as IStringMap;
                publication.Metadata.Title[xmlLang.toLowerCase()] = opfMetadataTitle[0].Data;
            } else {
                publication.Metadata.Title = opfMetadataTitle[0].Data;
            }
        }
    }
};

export const setPublicationDirection = (publication: Publication, opf: OPF) => {

    if (opf.Spine && opf.Spine.PageProgression) {
        switch (opf.Spine.PageProgression) {
            case "auto": {
                publication.Metadata.Direction = DirectionEnum.Auto;
                break;
            }
            case "ltr": {
                publication.Metadata.Direction = DirectionEnum.LTR;
                break;
            }
            case "rtl": {
                publication.Metadata.Direction = DirectionEnum.RTL;
                break;
            }
        }
    }

    if (publication.Metadata.Language && publication.Metadata.Language.length &&
        (!publication.Metadata.Direction || publication.Metadata.Direction === DirectionEnum.Auto)) {

        const lang = publication.Metadata.Language[0].toLowerCase();
        if (langStringIsRTL(lang)) {
            publication.Metadata.Direction = DirectionEnum.RTL;
        }
    }
};

export const langStringIsRTL = (lang: string): boolean => {
    return lang === "ar" || lang.startsWith("ar-") ||
        lang === "he" || lang.startsWith("he-") ||
        lang === "fa" || lang.startsWith("fa-");

        // https://github.com/edrlab/thorium-reader/pull/3027
        // lang === "zh-Hant" || lang === "zh-TW"
};

export const getNcx = async (ncxManItem: Manifest, opf: OPF, zip: IZip): Promise<NCX> => {

    if (!opf.ZipPath) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject("?!!opf.ZipPath");
    }

    const dname = path.dirname(opf.ZipPath);
    const ncxManItemHrefDecoded = ncxManItem.HrefDecoded;
    if (!ncxManItemHrefDecoded) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject("?!ncxManItem.Href");
    }
    const ncxFilePath = path.join(dname, ncxManItemHrefDecoded).replace(/\\/g, "/");

    const has = await zipHasEntry(zip, ncxFilePath, undefined);
    if (!has) {
        const err = `NOT IN ZIP (NCX): ${ncxManItem.Href} --- ${ncxFilePath}`;
        debug(err);
        const zipEntries = await zip.getEntries();
        for (const zipEntry of zipEntries) {
            if (zipEntry.startsWith("__MACOSX/")) {
                continue;
            }
            debug(zipEntry);
        }
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }

    let ncxZipStream_: IStreamAndLength;
    try {
        ncxZipStream_ = await zip.entryStreamPromise(ncxFilePath);
    } catch (err) {
        debug(err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }
    const ncxZipStream = ncxZipStream_.stream;

    let ncxZipData: Buffer;
    try {
        ncxZipData = await streamToBufferPromise(ncxZipStream);
    } catch (err) {
        debug(err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }

    const ncxStr = removeUTF8BOM(ncxZipData.toString("utf8"));
    return getNcx_(ncxStr, ncxFilePath);
};

export const getNcx_ = (ncxStr: string, ncxFilePath: string): NCX => {
    const iStart = ncxStr.indexOf("<ncx");
    if (iStart >= 0) {
        const iEnd = ncxStr.indexOf(">", iStart);
        if (iEnd > iStart) {
            const clip = ncxStr.substr(iStart, iEnd - iStart);
            if (clip.indexOf("xmlns") < 0) {
                ncxStr = ncxStr.replace(/<ncx/, "<ncx xmlns=\"http://www.daisy.org/z3986/2005/ncx/\" ");
            }
        }
    }

    const ncxDoc = new xmldom.DOMParser().parseFromString(ncxStr, "application/xml") as unknown as Document;
    const ncx = XML.deserialize<NCX>(ncxDoc, NCX);
    ncx.ZipPath = ncxFilePath;

    // breakLength: 100  maxArrayLength: undefined
    // debug(util.inspect(ncx,
    //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));

    return ncx;
};

export const getOpf = async (zip: IZip, rootfilePathDecoded: string, rootfilePath: string): Promise<OPF> => {

    // let timeBegin = process.hrtime();
    const has = await zipHasEntry(zip, rootfilePathDecoded, rootfilePath);
    if (!has) {
        const err = `NOT IN ZIP (container OPF rootfile): ${rootfilePath} --- ${rootfilePathDecoded}`;
        debug(err);
        const zipEntries = await zip.getEntries();
        for (const zipEntry of zipEntries) {
            if (zipEntry.startsWith("__MACOSX/")) {
                continue;
            }
            debug(zipEntry);
        }
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }

    let opfZipStream_: IStreamAndLength;
    try {
        opfZipStream_ = await zip.entryStreamPromise(rootfilePathDecoded);
    } catch (err) {
        debug(err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }
    const opfZipStream = opfZipStream_.stream;

    // const timeElapsed1 = process.hrtime(timeBegin);
    // debug(`1) ${timeElapsed1[0]} seconds + ${timeElapsed1[1]} nanoseconds`);
    // timeBegin = process.hrtime();

    let opfZipData: Buffer;
    try {
        opfZipData = await streamToBufferPromise(opfZipStream);
    } catch (err) {
        debug(err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }

    // debug(`${opfZipData.length} bytes`);

    // const timeElapsed2 = process.hrtime(timeBegin);
    // debug(`2) ${timeElapsed2[0]} seconds + ${timeElapsed2[1]} nanoseconds`);
    // timeBegin = process.hrtime();

    const opfStr = removeUTF8BOM(opfZipData.toString("utf8"));
    return getOpf_(opfStr, rootfilePathDecoded);
};

export const getOpf_ = (opfStr: string, rootfilePathDecoded: string): OPF => {

    const iStart = opfStr.indexOf("<package");
    if (iStart >= 0) {
        const iEnd = opfStr.indexOf(">", iStart);
        if (iEnd > iStart) {
            const clip = opfStr.substr(iStart, iEnd - iStart);
            if (clip.indexOf("xmlns") < 0) {
                opfStr = opfStr.replace(/<package/, "<package xmlns=\"http://openebook.org/namespaces/oeb-package/1.0/\" ");
            }
        }
    }

    // const timeElapsed3 = process.hrtime(timeBegin);
    // debug(`3) ${timeElapsed3[0]} seconds + ${timeElapsed3[1]} nanoseconds`);
    // timeBegin = process.hrtime();

    // TODO: this takes some time with large OPF XML data
    // (typically: many manifest items),
    // but it remains acceptable.
    // e.g. BasicTechnicalMathWithCalculus.epub with 2.5MB OPF!
    const opfDoc = new xmldom.DOMParser().parseFromString(opfStr, "application/xml") as unknown as Document;

    // const timeElapsed4 = process.hrtime(timeBegin);
    // debug(`4) ${timeElapsed4[0]} seconds + ${timeElapsed4[1]} nanoseconds`);
    // const timeBegin = process.hrtime();

    // tslint:disable-next-line:no-string-literal
    // process.env["OPF_PARSE"] = "true";
    // TODO: this takes a MASSIVE amount of time with large OPF XML data
    // (typically: many manifest items)
    // e.g. BasicTechnicalMathWithCalculus.epub with 2.5MB OPF!
    // culprit: XPath lib ... so we use our own mini XPath parser/matcher
    // (=> performance gain in orders of magnitude!)
    const opf = XML.deserialize<OPF>(opfDoc, OPF);
    // tslint:disable-next-line:no-string-literal
    // process.env["OPF_PARSE"] = "false";

    // const timeElapsed5 = process.hrtime(timeBegin);
    // debug(`5) ${timeElapsed5[0]} seconds + ${timeElapsed5[1]} nanoseconds`);

    opf.ZipPath = rootfilePathDecoded;

    // breakLength: 100  maxArrayLength: undefined
    // debug(util.inspect(opf,
    //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));

    return opf;
};

export const addOtherMetadata = (publication: Publication, rootfile: Rootfile | undefined, opf: OPF) => {

    if (!opf.Metadata) {
        return;
    }

    const opfMetadataRights =
        opf.Metadata?.DCMetadata?.Rights?.length ?
            opf.Metadata.DCMetadata.Rights :
            (opf.Metadata?.Rights?.length ?
                opf.Metadata.Rights :
                undefined);
    if (opfMetadataRights) {
        publication.Metadata.Rights = opfMetadataRights.join(" ");
    }

    const opfMetadataDescription =
        opf.Metadata?.DCMetadata?.Description?.length ?
            opf.Metadata.DCMetadata.Description :
            (opf.Metadata?.Description?.length ?
                opf.Metadata.Description :
                undefined);
    if (opfMetadataDescription) {
        publication.Metadata.Description = opfMetadataDescription[0];
    }

    const opfMetadataPublisher =
        opf.Metadata?.DCMetadata?.Publisher?.length ?
            opf.Metadata.DCMetadata.Publisher :
            (opf.Metadata?.Publisher?.length ?
                opf.Metadata.Publisher :
                undefined);
    if (opfMetadataPublisher) {
        publication.Metadata.Publisher = [];

        opfMetadataPublisher.forEach((pub) => {
            const contrib = new Contributor();
            contrib.Name = pub;
            publication.Metadata.Publisher.push(contrib);
        });
    }

    const opfMetadataSource =
        opf.Metadata?.DCMetadata?.Source?.length ?
            opf.Metadata.DCMetadata.Source :
            (opf.Metadata?.Source?.length ?
                opf.Metadata.Source :
                undefined);
    if (opfMetadataSource) {
        publication.Metadata.Source = opfMetadataSource[0];
    }

    const opfMetadataContributor =
        opf.Metadata?.DCMetadata?.Contributor?.length ?
            opf.Metadata.DCMetadata.Contributor :
            (opf.Metadata?.Contributor?.length ?
                opf.Metadata.Contributor :
                undefined);
    if (opfMetadataContributor) {
        opfMetadataContributor.forEach((cont) => {
            addContributor(publication, rootfile, opf, cont, undefined);
        });
    }

    const opfMetadataCreator =
        opf.Metadata?.DCMetadata?.Creator?.length ?
            opf.Metadata.DCMetadata.Creator :
            (opf.Metadata?.Creator?.length ?
                opf.Metadata.Creator :
                undefined);
    if (opfMetadataCreator) {
        opfMetadataCreator.forEach((cont) => {
            addContributor(publication, rootfile, opf, cont, "aut");
        });
    }

    if (opf.Metadata?.Link) {
        opf.Metadata.Link.forEach((metaLink) => {
            if (metaLink.Property === "a11y:certifierCredential" ||
                metaLink.Rel === "a11y:certifierCredential") {
                let val = metaLink.Href;
                if (!val) {
                    return; // continue
                }
                val = val.trim();
                if (!val) {
                    return; // continue
                }

                // legacy
                if (!publication.Metadata.CertifierCredential) {
                    publication.Metadata.CertifierCredential = [];
                }
                publication.Metadata.CertifierCredential.push(val);
                // modern
                if (!publication.Metadata.Accessibility) {
                    publication.Metadata.Accessibility = {} as AccessibilityMetadata;
                }
                if (!publication.Metadata.Accessibility.Certification) {
                    publication.Metadata.Accessibility.Certification = {} as AccessibilityCertification;
                }
                if (!publication.Metadata.Accessibility.Certification.Credential) {
                    publication.Metadata.Accessibility.Certification.Credential = [];
                }
                publication.Metadata.Accessibility.Certification.Credential.push(val);
            } else if (metaLink.Property === "a11y:certifierReport" ||
                metaLink.Rel === "a11y:certifierReport") {
                let val = metaLink.Href;
                if (!val) {
                    return; // continue
                }
                val = val.trim();
                if (!val) {
                    return; // continue
                }

                // legacy
                if (!publication.Metadata.CertifierReport) {
                    publication.Metadata.CertifierReport = [];
                }
                publication.Metadata.CertifierReport.push(val);
                // modern
                if (!publication.Metadata.Accessibility) {
                    publication.Metadata.Accessibility = {} as AccessibilityMetadata;
                }
                if (!publication.Metadata.Accessibility.Certification) {
                    publication.Metadata.Accessibility.Certification = {} as AccessibilityCertification;
                }
                if (!publication.Metadata.Accessibility.Certification.Report) {
                    publication.Metadata.Accessibility.Certification.Report = [];
                }
                publication.Metadata.Accessibility.Certification.Report.push(val);
            } else if (metaLink.Property === "dcterms:conformsTo" ||
                metaLink.Rel === "dcterms:conformsTo") {
                let val = metaLink.Href;
                if (!val) {
                    return; // continue
                }
                val = val.trim();
                if (!val) {
                    return; // continue
                }

                // legacy
                if (!publication.Metadata.ConformsTo) {
                    publication.Metadata.ConformsTo = [];
                }
                publication.Metadata.ConformsTo.push(val);
                // modern
                if (!publication.Metadata.Accessibility) {
                    publication.Metadata.Accessibility = {} as AccessibilityMetadata;
                }
                if (!publication.Metadata.Accessibility.ConformsTo) {
                    publication.Metadata.Accessibility.ConformsTo = [];
                }
                publication.Metadata.Accessibility.ConformsTo.push(val);
            }
        });
    }

    if (opf.Metadata.Meta || opf.Metadata.XMetadata?.Meta) {

        interface IMetaTagValue {
            metaTag: Metafield;
            val: string;
        }
        const AccessibilitySummarys: IMetaTagValue[] = [];

        const metaFunc = (metaTag: Metafield) => {
            if (metaTag.Name === "schema:accessMode" ||
                metaTag.Property === "schema:accessMode") {
                let val = metaTag.Property ? metaTag.Data : metaTag.Content;
                if (!val) {
                    return; // continue
                }
                val = val.trim();
                if (!val) {
                    return; // continue
                }

                // legacy
                if (!publication.Metadata.AccessMode) {
                    publication.Metadata.AccessMode = [];
                }
                publication.Metadata.AccessMode.push(val);
                // modern
                if (!publication.Metadata.Accessibility) {
                    publication.Metadata.Accessibility = {} as AccessibilityMetadata;
                }
                if (!publication.Metadata.Accessibility.AccessMode) {
                    publication.Metadata.Accessibility.AccessMode = [];
                }
                publication.Metadata.Accessibility.AccessMode.push(val);
            } else if (metaTag.Name === "schema:accessibilityFeature" ||
                metaTag.Property === "schema:accessibilityFeature") {
                let val = metaTag.Property ? metaTag.Data : metaTag.Content;
                if (!val) {
                    return; // continue
                }
                val = val.trim();
                if (!val) {
                    return; // continue
                }

                // legacy
                if (!publication.Metadata.AccessibilityFeature) {
                    publication.Metadata.AccessibilityFeature = [];
                }
                publication.Metadata.AccessibilityFeature.push(val);
                // modern
                if (!publication.Metadata.Accessibility) {
                    publication.Metadata.Accessibility = {} as AccessibilityMetadata;
                }
                if (!publication.Metadata.Accessibility.Feature) {
                    publication.Metadata.Accessibility.Feature = [];
                }
                publication.Metadata.Accessibility.Feature.push(val);
            } else if (metaTag.Name === "schema:accessibilityHazard" ||
                metaTag.Property === "schema:accessibilityHazard") {
                let val = metaTag.Property ? metaTag.Data : metaTag.Content;
                if (!val) {
                    return; // continue
                }
                val = val.trim();
                if (!val) {
                    return; // continue
                }

                // legacy
                if (!publication.Metadata.AccessibilityHazard) {
                    publication.Metadata.AccessibilityHazard = [];
                }
                publication.Metadata.AccessibilityHazard.push(val);
                // modern
                if (!publication.Metadata.Accessibility) {
                    publication.Metadata.Accessibility = {} as AccessibilityMetadata;
                }
                if (!publication.Metadata.Accessibility.Hazard) {
                    publication.Metadata.Accessibility.Hazard = [];
                }
                publication.Metadata.Accessibility.Hazard.push(val);
            } else if (metaTag.Name === "schema:accessibilitySummary" ||
                metaTag.Property === "schema:accessibilitySummary") {
                let val = metaTag.Property ? metaTag.Data : metaTag.Content;
                if (!val) {
                    return; // continue
                }
                val = val.trim();
                if (!val) {
                    return; // continue
                }
                AccessibilitySummarys.push({
                    metaTag,
                    val,
                });
            } else if (metaTag.Name === "schema:accessModeSufficient" ||
                metaTag.Property === "schema:accessModeSufficient") {
                let val = metaTag.Property ? metaTag.Data : metaTag.Content;
                if (!val) {
                    return; // continue
                }
                val = val.trim();
                if (!val) {
                    return; // continue
                }

                const del = DelinearizeAccessModeSufficient(val);

                // legacy
                if (!publication.Metadata.AccessModeSufficient) {
                    publication.Metadata.AccessModeSufficient = [];
                }
                publication.Metadata.AccessModeSufficient.push(del);
                // modern
                if (!publication.Metadata.Accessibility) {
                    publication.Metadata.Accessibility = {} as AccessibilityMetadata;
                }
                if (!publication.Metadata.Accessibility.AccessModeSufficient) {
                    publication.Metadata.Accessibility.AccessModeSufficient = [];
                }
                publication.Metadata.Accessibility.AccessModeSufficient.push(del);
            } else if (metaTag.Name === "schema:accessibilityAPI" ||
                metaTag.Property === "schema:accessibilityAPI") {
                let val = metaTag.Property ? metaTag.Data : metaTag.Content;
                if (!val) {
                    return; // continue
                }
                val = val.trim();
                if (!val) {
                    return; // continue
                }

                // legacy
                if (!publication.Metadata.AccessibilityAPI) {
                    publication.Metadata.AccessibilityAPI = [];
                }
                publication.Metadata.AccessibilityAPI.push(val);
                // modern
                // if (!publication.Metadata.Accessibility) {
                //     publication.Metadata.Accessibility = {} as AccessibilityMetadata;
                // }
                // if (!publication.Metadata.Accessibility.API) {
                //     publication.Metadata.Accessibility.API = [];
                // }
                // publication.Metadata.Accessibility.API.push(val);
            } else if (metaTag.Name === "schema:accessibilityControl" ||
                metaTag.Property === "schema:accessibilityControl") {
                let val = metaTag.Property ? metaTag.Data : metaTag.Content;
                if (!val) {
                    return; // continue
                }
                val = val.trim();
                if (!val) {
                    return; // continue
                }

                // legacy
                if (!publication.Metadata.AccessibilityControl) {
                    publication.Metadata.AccessibilityControl = [];
                }
                publication.Metadata.AccessibilityControl.push(val);
                // modern
                // if (!publication.Metadata.Accessibility) {
                //     publication.Metadata.Accessibility = {} as AccessibilityMetadata;
                // }
                // if (!publication.Metadata.Accessibility.Control) {
                //     publication.Metadata.Accessibility.Control = [];
                // }
                // publication.Metadata.Accessibility.Control.push(val);
            } else if (metaTag.Name === "a11y:certifiedBy" ||
                metaTag.Property === "a11y:certifiedBy") {
                let val = metaTag.Property ? metaTag.Data : metaTag.Content;
                if (!val) {
                    return; // continue
                }
                val = val.trim();
                if (!val) {
                    return; // continue
                }

                // legacy
                if (!publication.Metadata.CertifiedBy) {
                    publication.Metadata.CertifiedBy = [];
                }
                publication.Metadata.CertifiedBy.push(val);
                // modern
                if (!publication.Metadata.Accessibility) {
                    publication.Metadata.Accessibility = {} as AccessibilityMetadata;
                }
                if (!publication.Metadata.Accessibility.Certification) {
                    publication.Metadata.Accessibility.Certification = {} as AccessibilityCertification;
                }
                if (!publication.Metadata.Accessibility.Certification.CertifiedBy) {
                    publication.Metadata.Accessibility.Certification.CertifiedBy = [];
                }
                publication.Metadata.Accessibility.Certification.CertifiedBy.push(val);
            } else if (metaTag.Name === "a11y:certifierCredential" || // may be link in EPUB3
                metaTag.Property === "a11y:certifierCredential") {
                let val = metaTag.Property ? metaTag.Data : metaTag.Content;
                if (!val) {
                    return; // continue
                }
                val = val.trim();
                if (!val) {
                    return; // continue
                }

                // legacy
                if (!publication.Metadata.CertifierCredential) {
                    publication.Metadata.CertifierCredential = [];
                }
                publication.Metadata.CertifierCredential.push(val);
                // modern
                if (!publication.Metadata.Accessibility) {
                    publication.Metadata.Accessibility = {} as AccessibilityMetadata;
                }
                if (!publication.Metadata.Accessibility.Certification) {
                    publication.Metadata.Accessibility.Certification = {} as AccessibilityCertification;
                }
                if (!publication.Metadata.Accessibility.Certification.Credential) {
                    publication.Metadata.Accessibility.Certification.Credential = [];
                }
                publication.Metadata.Accessibility.Certification.Credential.push(val);
            } else if (metaTag.Name === "dcterms:conformsTo" || // may be link in EPUB3
                metaTag.Property === "dcterms:conformsTo") {
                let val = metaTag.Property ? metaTag.Data : metaTag.Content;
                if (!val) {
                    return; // continue
                }
                val = val.trim();
                if (!val) {
                    return; // continue
                }

                // legacy
                if (!publication.Metadata.ConformsTo) {
                    publication.Metadata.ConformsTo = [];
                }
                publication.Metadata.ConformsTo.push(val);
                // modern
                if (!publication.Metadata.Accessibility) {
                    publication.Metadata.Accessibility = {} as AccessibilityMetadata;
                }
                if (!publication.Metadata.Accessibility.ConformsTo) {
                    publication.Metadata.Accessibility.ConformsTo = [];
                }
                publication.Metadata.Accessibility.ConformsTo.push(val);
            }
        };

        if (opf.Metadata.Meta) {
            opf.Metadata.Meta.forEach(metaFunc);
        }
        if (opf.Metadata.XMetadata?.Meta) {
            opf.Metadata.XMetadata.Meta.forEach(metaFunc);
        }

        if (AccessibilitySummarys.length === 1) {
            const tuple = AccessibilitySummarys[0];

            // a11y:summary parsing => xml:lang ignored (unless RTL)
            // https://github.com/w3c/publ-a11y/issues/94
            // https://github.com/w3c/epub-specs/pull/2401#issuecomment-121326068
            // https://www.w3.org/TR/epub-a11y-tech-11/#meta-005
            // https://github.com/readium/architecture/blob/master/streamer/parser/a11y-metadata-parsing.md#accessibilitysummary
            const xmlLang: string = tuple.metaTag.Lang || opf.Lang;
            const isLangOverride = tuple.metaTag.Lang && opf.Lang && tuple.metaTag.Lang !== opf.Lang;
            if (xmlLang && (isLangOverride || langStringIsRTL(xmlLang.toLowerCase()))) {

                // legacy
                publication.Metadata.AccessibilitySummary = {} as IStringMap;
                // tslint:disable-next-line: max-line-length
                (publication.Metadata.AccessibilitySummary as IStringMap)[xmlLang.toLowerCase()] = tuple.val;
                // modern
                if (!publication.Metadata.Accessibility) {
                    publication.Metadata.Accessibility = {} as AccessibilityMetadata;
                }
                publication.Metadata.Accessibility.Summary = {} as IStringMap;
                (publication.Metadata.Accessibility.Summary as IStringMap)[xmlLang.toLowerCase()] = tuple.val;
            } else {
                // legacy
                publication.Metadata.AccessibilitySummary = tuple.val;
                // modern
                if (!publication.Metadata.Accessibility) {
                    publication.Metadata.Accessibility = {} as AccessibilityMetadata;
                }
                publication.Metadata.Accessibility.Summary = tuple.val;
            }
        } else if (AccessibilitySummarys.length) {
            // legacy
            publication.Metadata.AccessibilitySummary = {} as IStringMap;
            AccessibilitySummarys.forEach((tuple) => {
                // https://github.com/readium/architecture/blob/master/streamer/parser/metadata.md#title
                const xmlLang: string = tuple.metaTag.Lang || opf.Lang;
                if (xmlLang) {
                    // tslint:disable-next-line: max-line-length
                    (publication.Metadata.AccessibilitySummary as IStringMap)[xmlLang.toLowerCase()] = tuple.val;
                } else if (publication.Metadata.Language &&
                    publication.Metadata.Language.length &&
                    // tslint:disable-next-line: max-line-length
                    !(publication.Metadata.AccessibilitySummary as IStringMap)[publication.Metadata.Language[0].toLowerCase()]) {
                    // tslint:disable-next-line: max-line-length
                    (publication.Metadata.AccessibilitySummary as IStringMap)[publication.Metadata.Language[0].toLowerCase()] = tuple.val;
                } else {
                    // tslint:disable-next-line: no-string-literal, max-line-length
                    (publication.Metadata.AccessibilitySummary as IStringMap)[BCP47_UNKNOWN_LANG] = tuple.val;
                }
            });
            // modern
            if (!publication.Metadata.Accessibility) {
                publication.Metadata.Accessibility = {} as AccessibilityMetadata;
            }
            publication.Metadata.Accessibility.Summary = {} as IStringMap;
            AccessibilitySummarys.forEach((tuple) => {
                // https://github.com/readium/architecture/blob/master/streamer/parser/metadata.md#title
                const xmlLang: string = tuple.metaTag.Lang || opf.Lang;
                if (xmlLang) {
                    // tslint:disable-next-line: max-line-length
                    (publication.Metadata.Accessibility.Summary as IStringMap)[xmlLang.toLowerCase()] = tuple.val;
                } else if (publication.Metadata.Language &&
                    publication.Metadata.Language.length &&
                    // tslint:disable-next-line: max-line-length
                    !(publication.Metadata.Accessibility.Summary as IStringMap)[publication.Metadata.Language[0].toLowerCase()]) {
                    // tslint:disable-next-line: max-line-length
                    (publication.Metadata.Accessibility.Summary as IStringMap)[publication.Metadata.Language[0].toLowerCase()] = tuple.val;
                } else {
                    // tslint:disable-next-line: no-string-literal, max-line-length
                    (publication.Metadata.Accessibility.Summary as IStringMap)[BCP47_UNKNOWN_LANG] = tuple.val;
                }
            });

        }

        const metasDuration: Metafield[] = [];
        const metasNarrator: Metafield[] = [];
        const metasActiveClass: Metafield[] = [];
        const metasPlaybackActiveClass: Metafield[] = [];

        const mFunc = (metaTag: Metafield) => {

            if (metaTag.Name === "dtb:totalTime") {
                metasDuration.push(metaTag);
            } else if (metaTag.Property === "media:duration" && !metaTag.Refine) {
                metasDuration.push(metaTag);
            } else if (metaTag.Property === "media:narrator") {
                metasNarrator.push(metaTag);
            } else if (metaTag.Property === "media:active-class") {
                metasActiveClass.push(metaTag);
            } else if (metaTag.Property === "media:playback-active-class") {
                metasPlaybackActiveClass.push(metaTag);
            } else {
                // fallback, see MetadataSupportedKeys in metadata.ts
                const key = metaTag.Name ? metaTag.Name : metaTag.Property;
                if (key && !metaTag.Refine && !MetadataSupportedKeys.includes(key)) {

                    if (!publication.Metadata.AdditionalJSON) {
                        publication.Metadata.AdditionalJSON = {};
                    }
                    if (metaTag.Name && metaTag.Content) {
                        publication.Metadata.AdditionalJSON[metaTag.Name] = metaTag.Content;
                    } else if (metaTag.Property && metaTag.Data) {
                        publication.Metadata.AdditionalJSON[metaTag.Property] = metaTag.Data;
                    }
                }
            }
        };
        if (opf.Metadata.Meta) {
            opf.Metadata.Meta.forEach(mFunc);
        }
        if (opf.Metadata.XMetadata?.Meta) {
            opf.Metadata.XMetadata.Meta.forEach(mFunc);
        }

        if (metasDuration.length) {
            const dur = timeStrToSeconds(metasDuration[0].Property ? metasDuration[0].Data : metasDuration[0].Content);
            if (dur !== 0) { // parsing failure?
                publication.Metadata.Duration = dur;
            }
        }

        if (metasNarrator.length) {
            if (!publication.Metadata.Narrator) {
                publication.Metadata.Narrator = [];
            }
            metasNarrator.forEach((metaNarrator) => {
                const cont = new Contributor();
                cont.Name = metaNarrator.Data;
                publication.Metadata.Narrator.push(cont);
            });
        }
        if (metasActiveClass.length) {
            if (!publication.Metadata.MediaOverlay) {
                publication.Metadata.MediaOverlay = new MediaOverlay();
            }
            publication.Metadata.MediaOverlay.ActiveClass = metasActiveClass[0].Data;
        }
        if (metasPlaybackActiveClass.length) {
            if (!publication.Metadata.MediaOverlay) {
                publication.Metadata.MediaOverlay = new MediaOverlay();
            }
            publication.Metadata.MediaOverlay.PlaybackActiveClass = metasPlaybackActiveClass[0].Data;
        }
    }
};

export const loadFileStrFromZipPath = async (
    linkHref: string, linkHrefDecoded: string, zip: IZip): Promise<string | undefined> => {

    let zipData: Buffer | undefined;
    try {
        zipData = await loadFileBufferFromZipPath(linkHref, linkHrefDecoded, zip);
    } catch (err) {
        debug(err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }
    if (zipData) {
        return zipData.toString("utf8");
    }
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    return Promise.reject("?!zipData loadFileStrFromZipPath()");
};

export const loadFileBufferFromZipPath = async (
    linkHref: string, linkHrefDecoded: string, zip: IZip): Promise<Buffer | undefined> => {

    if (!linkHrefDecoded) {
        debug("!?link.HrefDecoded");
        return undefined;
    }
    const has = await zipHasEntry(zip, linkHrefDecoded, linkHref);
    if (!has) {
        debug(`NOT IN ZIP (loadFileBufferFromZipPath): ${linkHref} --- ${linkHrefDecoded}`);
        const zipEntries = await zip.getEntries();
        for (const zipEntry of zipEntries) {
            if (zipEntry.startsWith("__MACOSX/")) {
                continue;
            }
            debug(zipEntry);
        }
        return undefined;
    }

    let zipStream_: IStreamAndLength;
    try {
        zipStream_ = await zip.entryStreamPromise(linkHrefDecoded);
    } catch (err) {
        debug(err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }
    const zipStream = zipStream_.stream;

    let zipData: Buffer;
    try {
        zipData = await streamToBufferPromise(zipStream);
    } catch (err) {
        debug(err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }

    return zipData;
};

const fillLandmarksFromGuide = (publication: Publication, opf: OPF) => {
    if (opf.Guide && opf.Guide.length) {
        opf.Guide.forEach((ref) => {
            if (ref.Href && opf.ZipPath) {
                const refHrefDecoded = ref.HrefDecoded;
                if (!refHrefDecoded) {
                    debug("ref.Href?!");
                    return; // foreach
                }
                const link = new Link();
                const zipPath = path.join(path.dirname(opf.ZipPath), refHrefDecoded)
                    .replace(/\\/g, "/");

                link.setHrefDecoded(zipPath);

                link.Title = ref.Title;
                if (!publication.Landmarks) {
                    publication.Landmarks = [];
                }
                publication.Landmarks.push(link);
            }
        });
    }
};

const fillTOCFromNCX = (publication: Publication, ncx: NCX) => {
    if (ncx.Points && ncx.Points.length) {
        ncx.Points.forEach((point) => {
            if (!publication.TOC) {
                publication.TOC = [];
            }
            fillTOCFromNavPoint(publication, ncx, point, publication.TOC);
        });
    }
};

const addAlternateAudioLinkFromNCX = (ncx: NCX, link: Link, navLabel: NavLabel | undefined) => {

    if (navLabel?.Audio && navLabel.Audio.Src) {

        const audioSrcDcoded = navLabel.Audio.SrcDecoded;
        if (!audioSrcDcoded) {
            debug("?!audioSrcDcoded");
        } else {
            const zipPath = path.join(path.dirname(ncx.ZipPath), audioSrcDcoded)
                .replace(/\\/g, "/");
            let timeHref = zipPath;
            timeHref += "#t=";

            const begin = navLabel.Audio.ClipBegin ? timeStrToSeconds(navLabel.Audio.ClipBegin) : 0;
            // altLink.AudioClipBegin = begin;
            const end = navLabel.Audio.ClipEnd ? timeStrToSeconds(navLabel.Audio.ClipEnd) : 0;
            // altLink.AudioClipEnd = end;

            timeHref += begin.toString();
            if (navLabel.Audio.ClipEnd && end) {
                timeHref += ",";
                timeHref += end.toString();
            }

            if (!link.Alternate) {
                link.Alternate = [];
            }
            const altLink = new Link();
            altLink.Rel = ["daisyAudioLabel"];

            altLink.setHrefDecoded(timeHref);

            const mediaType = mime.lookup(audioSrcDcoded);
            if (mediaType) {
                altLink.TypeLink = mediaType;
            }

            if (navLabel.Audio.ClipEnd && end > begin) {
                altLink.Duration = end - begin;
            }

            link.Alternate.push(altLink);
        }
    }
};

const fillTOCFromNavPoint = (publication: Publication, ncx: NCX, point: NavPoint, node: Link[]) => {

    const srcDecoded = point.Content.SrcDecoded;
    if (!srcDecoded) {
        debug("?!point.Content.Src");
        return;
    }
    const link = new Link();
    const zipPath = path.join(path.dirname(ncx.ZipPath), srcDecoded)
        .replace(/\\/g, "/");

    link.setHrefDecoded(zipPath);

    link.Title = point.NavLabel?.Text;

    addAlternateAudioLinkFromNCX(ncx, link, point.NavLabel);

    if (point.Points && point.Points.length) {
        point.Points.forEach((p) => {
            if (!link.Children) {
                link.Children = [];
            }
            fillTOCFromNavPoint(publication, ncx, p, link.Children);
        });
    }

    node.push(link);
};

const fillPageListFromNCX = (publication: Publication, ncx: NCX) => {

    if (ncx.PageList && ncx.PageList.PageTarget && ncx.PageList.PageTarget.length) {
        ncx.PageList.PageTarget.forEach((pageTarget) => {
            const link = new Link();
            const srcDecoded = pageTarget.Content.SrcDecoded;
            if (!srcDecoded) {
                debug("!?srcDecoded");
                return; // foreach
            }
            const zipPath = path.join(path.dirname(ncx.ZipPath), srcDecoded)
                .replace(/\\/g, "/");

            link.setHrefDecoded(zipPath);

            link.Title = pageTarget.NavLabel?.Text;
            if (!link.Title) {
                return;
            }

            addAlternateAudioLinkFromNCX(ncx, link, pageTarget.NavLabel);

            if (!publication.PageList) {
                publication.PageList = [];
            }
            publication.PageList.push(link);
        });
    }
};

export const fillTOC = (publication: Publication, opf: OPF, ncx: NCX | undefined) => {

    if (ncx) {
        fillTOCFromNCX(publication, ncx);
        if (!publication.PageList) {
            fillPageListFromNCX(publication, ncx);
        }
    }
    fillLandmarksFromGuide(publication, opf);
};

export const addMediaOverlaySMIL = async (link: Link, manItemSmil: Manifest, opf: OPF, zip: IZip) => {

    if (manItemSmil && manItemSmil.MediaType && manItemSmil.MediaType.startsWith("application/smil")) {
        if (opf.ZipPath) {
            const manItemSmilHrefDecoded = manItemSmil.HrefDecoded;
            if (!manItemSmilHrefDecoded) {
                debug("!?manItemSmil.HrefDecoded");
                return;
            }
            const smilFilePath = path.join(path.dirname(opf.ZipPath), manItemSmilHrefDecoded)
                .replace(/\\/g, "/");

            const has = await zipHasEntry(zip, smilFilePath, smilFilePath);
            if (!has) {
                debug(`NOT IN ZIP (addMediaOverlay): ${smilFilePath} -- ${opf.ZipPath}`);
                const zipEntries = await zip.getEntries();
                for (const zipEntry of zipEntries) {
                    if (zipEntry.startsWith("__MACOSX/")) {
                        continue;
                    }
                    debug(zipEntry);
                }
                return;
            }

            const mo = new MediaOverlayNode();
            mo.SmilPathInZip = smilFilePath;
            mo.initialized = false;
            link.MediaOverlays = mo;

            const moURL = mediaOverlayURLPath + "?" +
                mediaOverlayURLParam + "=" +
                encodeURIComponent_RFC3986(link.HrefDecoded ? link.HrefDecoded : link.Href);

            // legacy method:
            if (!link.Properties) {
                link.Properties = new Properties();
            }
            link.Properties.MediaOverlay = moURL;

            // new method:
            // https://w3c.github.io/sync-media-pub/incorporating-synchronized-narration.html#with-webpub
            if (!link.Alternate) {
                link.Alternate = [];
            }
            const moLink = new Link();
            moLink.Href = moURL;
            moLink.TypeLink = "application/vnd.syncnarr+json";
            moLink.Duration = link.Duration;
            link.Alternate.push(moLink);

            if (link.Properties && link.Properties.Encrypted) {
                debug("ENCRYPTED SMIL MEDIA OVERLAY: " + (link.HrefDecoded ? link.HrefDecoded : link.Href));
            }
            // LAZY
            // await lazyLoadMediaOverlays(publication, mo);
        }
    }
};

// export const flattenDaisy2SmilAudioSeq_ = (_smilPathInZip: string, smilXmlDoc: Document) => {

//     // flatten seq inside par
//     // (naive implementation, assumes contiguity of begin/end clips for same audio file)
//     const pars = smilXmlDoc.getElementsByTagName("par");
//     // tslint:disable-next-line: prefer-for-of
//     for (let i = 0; i < pars.length; i++) {
//         const par = pars[i];
//         const seq = par.getElementsByTagName("seq")[0] as Element | undefined; // assumes one only (safe assumption)
//         if (seq) {
//             let audioInsidePar;
//             const audios = seq.getElementsByTagName("audio");
//             for (let j = 0; j < audios.length; j++) {
//                 if (j === 0) {
//                     audioInsidePar = audios[j];
//                 }
//                 if (audioInsidePar && j === audios.length - 1) {
//                     const clipEnd = audios[j].getAttribute("clip-end") || "";
//                     audioInsidePar.setAttribute("clip-end", clipEnd);
//                 }
//             }
//             if (audioInsidePar) {
//                 seq.removeChild(audioInsidePar);
//                 par.removeChild(seq);
//                 par.appendChild(audioInsidePar);
//             }
//         }
//     }
// };

export const flattenDaisy2SmilAudioSeq = (_smilPathInZip: string, smilXmlDoc: Document) => {

    // const beforeXML = new xmldom.XMLSerializer().serializeToString(smilXmlDoc.documentElement as unknown as xmldom.Element);
    // debug("beforeXML", _smilPathInZip, beforeXML);

    // let iClone = 0;

    // factor out seq that's inside par
    const pars = Array.from(smilXmlDoc.getElementsByTagName("par"));
    for (const par of pars) {
        const seq = par.getElementsByTagName("seq")[0] as Element | undefined; // assumes one only (safe assumption)
        if (!seq) {
            continue;
        }

        // const text = par.getElementsByTagName("text")[0] as Element | undefined; // assumes one only (safe assumption)

        let prevAudio: HTMLAudioElement | undefined = undefined;
        const audios = Array.from(seq.getElementsByTagName("audio"));
        for (let j = 0; j < audios.length; j++) {
            const audio = audios[j];

            if (prevAudio === undefined) {
                seq.removeChild(audio);
                par.appendChild(audio);
                prevAudio = audio;
            } else {
                const prevSrc = prevAudio.getAttribute("src");
                const thisSrc = audio.getAttribute("src");
                if (thisSrc === prevSrc) {
                    const prevCeAttr = prevAudio.getAttribute("clip-end");
                    const thisCbAttr = audio.getAttribute("clip-begin");
                    let contiguous = prevCeAttr && thisCbAttr && prevCeAttr === thisCbAttr;
                    if (prevCeAttr && thisCbAttr && !contiguous) {
                        const prevT = timeStrToSeconds(prevCeAttr);
                        const thisT = timeStrToSeconds(thisCbAttr);
                        if (prevT === thisT || Math.abs(prevT - thisT) <= 0.5) {
                            // debug(Math.abs(prevT - thisT));
                            contiguous = true;
                        }
                    }
                    if (contiguous) {
                        const thisCeAttr = audio.getAttribute("clip-end");
                        if (thisCeAttr) {
                            prevAudio.setAttribute("clip-end", thisCeAttr);
                        } else if (prevAudio.getAttribute("clip-end")) {
                            prevAudio.removeAttribute("clip-end");
                        }
                    } else {
                        debug("NCC SMIL AUDIO not contiguous!! ", thisSrc, prevCeAttr, thisCbAttr);
                        // TODO: insert a new PAR that references the same TEXT but with different AUDIO (clip-begin/end) in order to reset the discontiguous sequence ... but that's a VERY! unlikely edge-case so low-priority until there is an actual SMIL structured this way.
                    }
                } else {
                    debug("NCC SMIL AUDIO thisSrc !== prevSrc!! ", thisSrc, prevSrc);
                    // TODO: insert a new PAR that references the same TEXT but with different AUDIO (src) ... but that's a VERY! unlikely edge-case so low-priority until there is an actual SMIL structured this way.
                    // seq.removeChild(audio);
                    // par.appendChild(audio);
                    // prevAudio = audio;
                }
            }

            // if (j === 0) {
            //     if (text) {
            //         if (text.insertAdjacentElement) {
            //             text.insertAdjacentHTML("afterend", "<!-- R2 AUDIO FLAT a -->");
            //             text.insertAdjacentElement("afterend", audio);
            //         } else if (text.parentNode) {
            //             text.parentNode.insertBefore(smilXmlDoc.createComment("R2 AUDIO FLAT b"), text.nextElementSibling);
            //             text.parentNode.insertBefore(audio, null); // text.nextElementSibling
            //         }

            //         // hoist DAISY2 text ID to parent par
            //         const parId = par.getAttribute("id");
            //         if (!parId) {
            //             const txtId = text.getAttribute("id");
            //             if (txtId) {
            //                 par.setAttribute("id", txtId);
            //                 text.removeAttribute("id");
            //             }
            //         }
            //     } else {
            //         par.appendChild(audio);
            //     }
            // }
            // else {
            //     const newPar = par.namespaceURI ?
            //         smilXmlDoc.createElementNS(par.namespaceURI, "par") :
            //         smilXmlDoc.createElement("par");
            //     iClone++;
            //     if (text) {
            //         const cloneText = text.cloneNode(false) as Element;
            //         const tId = cloneText.getAttribute("id");
            //         if (tId) {
            //             cloneText.removeAttribute("id");
            //         }
            //         // hoist DAISY2 text ID to parent par
            //         newPar.setAttribute("id", (tId ? tId : "id") + "r2__" + iClone);
            //         newPar.appendChild(cloneText);
            //     } else {
            //         newPar.setAttribute("id", "id" + "r2__" + iClone);
            //     }
            //     newPar.appendChild(audio);
            //     newPar.appendChild(smilXmlDoc.createTextNode("\n"));

            //     if (par.insertAdjacentElement) {
            //         par.insertAdjacentElement("afterend", newPar);
            //     } else if (par.parentNode) {
            //         par.parentNode.insertBefore(newPar, par.nextElementSibling);
            //     }
            // }
        }
        par.removeChild(seq);
    }

    // const afterXML = new xmldom.XMLSerializer().serializeToString(smilXmlDoc.documentElement as unknown as xmldom.Element);
    // debug("afterXML", _smilPathInZip, afterXML);
};

// mo.initialized true/false is automatically handled
export const lazyLoadMediaOverlays = async (publication: Publication, mo: MediaOverlayNode): Promise<void> => {

    if (mo.initialized || !mo.SmilPathInZip) {
        return;
    }

    let link: Link | undefined;
    if (publication.Resources) {

        link = publication.Resources.find((l) => {
            if (l.Href === mo.SmilPathInZip) {
                return true;
            }
            return false;
        });
        if (!link) {
            if (publication.Spine) {
                link = publication.Spine.find((l) => {
                    if (l.Href === mo.SmilPathInZip) {
                        return true;
                    }
                    return false;
                });
            }
        }
        if (!link) {
            const err = "Asset not declared in publication spine/resources! " + mo.SmilPathInZip;
            debug(err);
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject(err);
        }
    }

    const zipInternal = publication.findFromInternal("zip");
    if (!zipInternal) {
        return;
    }
    const zip = zipInternal.Value as IZip;

    const has = await zipHasEntry(zip, mo.SmilPathInZip, undefined);
    if (!has) {
        const err = `NOT IN ZIP (lazyLoadMediaOverlays): ${mo.SmilPathInZip}`;
        debug(err);
        const zipEntries = await zip.getEntries();
        for (const zipEntry of zipEntries) {
            if (zipEntry.startsWith("__MACOSX/")) {
                continue;
            }
            debug(zipEntry);
        }
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }

    let smilZipStream_: IStreamAndLength;
    try {
        smilZipStream_ = await zip.entryStreamPromise(mo.SmilPathInZip);
    } catch (err) {
        debug(err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }

    if (link && link.Properties && link.Properties.Encrypted) {
        let decryptFail = false;
        let transformedStream: IStreamAndLength;
        try {
            transformedStream = await Transformers.tryStream(
                publication, link, undefined,
                smilZipStream_,
                false,
                0,
                0,
                undefined,
            );
        } catch (err) {
            debug(err);
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject(err);
        }
        if (transformedStream) {
            smilZipStream_ = transformedStream;
        } else {
            decryptFail = true;
        }

        if (decryptFail) {
            const err = "Encryption scheme not supported.";
            debug(err);
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject(err);
        }
    }

    const smilZipStream = smilZipStream_.stream;

    let smilZipData: Buffer;
    try {
        smilZipData = await streamToBufferPromise(smilZipStream);
    } catch (err) {
        debug(err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }

    let smilStr = removeUTF8BOM(smilZipData.toString("utf8"));

    const iStart = smilStr.indexOf("<smil");
    if (iStart >= 0) {
        const iEnd = smilStr.indexOf(">", iStart);
        if (iEnd > iStart) {
            const clip = smilStr.substr(iStart, iEnd - iStart);
            if (clip.indexOf("xmlns") < 0) {
                smilStr = smilStr.replace(/<smil/, "<smil xmlns=\"http://www.w3.org/ns/SMIL\" ");
            }
        }
    }

    const smilXmlDoc = new xmldom.DOMParser().parseFromString(smilStr, "application/xml") as unknown as Document;

    const nccZipEntry = (await zip.getEntries()).find((entry) => {
        return /ncc\.html$/i.test(entry);
    });
    if (nccZipEntry) {
        flattenDaisy2SmilAudioSeq(mo.SmilPathInZip, smilXmlDoc);
    }

    const smil = XML.deserialize<SMIL>(smilXmlDoc, SMIL);
    smil.ZipPath = mo.SmilPathInZip;

    mo.initialized = true;
    debug("PARSED SMIL: " + mo.SmilPathInZip);

    // debug(mo.SmilPathInZip, new xmldom.XMLSerializer().serializeToString(smilXmlDoc as unknown as xmldom.Document));
    // debug(JSON.stringify(smil, null, 4));

    // breakLength: 100  maxArrayLength: undefined
    // debug(util.inspect(smil,
    //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));

    mo.Role = [];
    mo.Role.push("section");

    // debug(smil);
    // debug(JSON.stringify(smil, null, 4));

    if (smil.Head?.Meta) {
        for (const m of smil.Head.Meta) {
            if (!m.Content) {
                continue;
            }
            if (m.Name === "dtb:totalElapsedTime" || m.Name === "ncc:totalElapsedTime") {
                mo.totalElapsedTime = timeStrToSeconds(m.Content);
            }
            if (m.Name === "ncc:timeInThisSmil") {
                const dur = timeStrToSeconds(m.Content);
                if (dur !== 0) { // parsing failure?
                    mo.duration = dur;
                }
            }
        }
    }

    if (smil.Body) {
        if (smil.Body.Duration) {
            const dur = timeStrToSeconds(smil.Body.Duration);
            if (dur !== 0) { // parsing failure?
                if (mo.duration && mo.duration !== dur) {
                    debug("SMIL DUR DIFF 1: " + dur + " != " + mo.duration);
                }
                mo.duration = dur;
            }
        }
        if (smil.Body.EpubType) {
            const roles = parseSpaceSeparatedString(smil.Body.EpubType);
            for (const role of roles) {
                if (!role.length) {
                    continue;
                }
                if (mo.Role.indexOf(role) < 0) {
                    mo.Role.push(role);
                }
            }
        }

        if (smil.Body.Class) {
            if (smil.Body.Class.indexOf("pagenum") >= 0) {
                mo.Role.push("pagebreak");
            } else if (smil.Body.Class.indexOf("note") >= 0) {
                mo.Role.push("note");
            } else if (smil.Body.Class.indexOf("sidebar") >= 0) {
                mo.Role.push("sidebar");
            } else if (smil.Body.Class.indexOf("annotation") >= 0) {
                mo.Role.push("annotation");
            }
        } else if (smil.Body.CustomTest) {
            if (smil.Body.CustomTest.indexOf("pagenum") >= 0) {
                mo.Role.push("pagebreak");
            } else if (smil.Body.CustomTest.indexOf("note") >= 0) {
                mo.Role.push("note");
            } else if (smil.Body.CustomTest.indexOf("sidebar") >= 0) {
                mo.Role.push("sidebar");
            } else if (smil.Body.CustomTest.indexOf("annotation") >= 0) {
                mo.Role.push("annotation");
            }
        } else if (smil.Body.SystemRequired) {
            if (smil.Body.SystemRequired.indexOf("pagenumber-on") >= 0) {
                mo.Role.push("pagebreak");
            } else if (smil.Body.SystemRequired.indexOf("note-on") >= 0) {
                mo.Role.push("note");
            // } else if (smil.Body.SystemRequired.indexOf("footnote-on") >= 0) {
            //     mo.Role.push("note");
            // } else if (smil.Body.SystemRequired.indexOf("prodnote-on") >= 0) {
            //     mo.Role.push("note");
            } else if (smil.Body.SystemRequired.indexOf("sidebar-on") >= 0) {
                mo.Role.push("sidebar");
            }
        }
        if (smil.Body.TextRef) {
            const smilBodyTextRefDecoded = smil.Body.TextRefDecoded;
            if (!smilBodyTextRefDecoded) {
                debug("!?smilBodyTextRefDecoded");
            } else {
                const zipPath = path.join(path.dirname(smil.ZipPath), smilBodyTextRefDecoded)
                    .replace(/\\/g, "/");
                mo.Text = zipPath;
            }
        }
        if (smil.Body.Children && smil.Body.Children.length) {

            const getDur = !smil.Body.Duration && smil.Body.Children.length === 1;

            smil.Body.Children.forEach((seqChild) => {
                if (getDur && seqChild.Duration) {
                    const dur = timeStrToSeconds(seqChild.Duration);
                    if (dur !== 0) { // parsing failure?
                        if (mo.duration && mo.duration !== dur) {
                            debug("SMIL DUR DIFF 2: " + dur + " != " + mo.duration);
                        }
                        mo.duration = dur;
                    }
                }
                if (!mo.Children) {
                    mo.Children = [];
                }

                addSeqToMediaOverlay(smil, publication, mo, mo.Children, seqChild);
            });
        }
    }

    // debug(JSON.stringify(mo, null, 4));

    // if ((process.env as NodeJS.ProcessEnv).BREAK) {
    //     throw new Error("BREAK");
    // }
    // (process.env as NodeJS.ProcessEnv).BREAK = "break!";
    return;
};

const addSeqToMediaOverlay = (
    smil: SMIL, publication: Publication,
    rootMO: MediaOverlayNode, mo: MediaOverlayNode[], seqChild: SeqOrPar) => {

    if (!smil.ZipPath) {
        return;
    }

    const moc = new MediaOverlayNode();
    moc.initialized = rootMO.initialized;
    let doAdd = true;

    if (seqChild.Duration) {
        const dur = timeStrToSeconds(seqChild.Duration);
        if (dur !== 0) { // parsing failure?
            moc.duration = dur;
        }
    }

    if (seqChild instanceof Seq) {
        moc.Role = [];
        moc.Role.push("section");

        const seq = seqChild as Seq;

        if (seq.ID) {
            moc.SeqID = seq.ID;
        }

        if (seq.EpubType) {
            const roles = parseSpaceSeparatedString(seq.EpubType);
            for (const role of roles) {
                if (!role.length) {
                    continue;
                }
                if (moc.Role.indexOf(role) < 0) {
                    moc.Role.push(role);
                }
            }
        }
        if (seq.Class) {
            if (seq.Class.indexOf("pagenum") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("pagebreak");
            } else if (seq.Class.indexOf("note") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("note");
            } else if (seq.Class.indexOf("sidebar") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("sidebar");
            } else if (seq.Class.indexOf("annotation") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("annotation");
            }
        } else if (seq.CustomTest) {
            if (seq.CustomTest.indexOf("pagenum") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("pagebreak");
            } else if (seq.CustomTest.indexOf("note") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("note");
            } else if (seq.CustomTest.indexOf("sidebar") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("sidebar");
            } else if (seq.CustomTest.indexOf("annotation") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("annotation");
            }
        } else if (seq.SystemRequired) {
            if (seq.SystemRequired.indexOf("pagenumber-on") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("pagebreak");
            } else if (seq.SystemRequired.indexOf("note-on") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("note");
            // }  else if (seq.SystemRequired.indexOf("footnote-on") >= 0) {
            //     if (!moc.Role) {
            //         moc.Role = [];
            //     }
            //     moc.Role.push("note");
            // } else if (seq.SystemRequired.indexOf("prodnote-on") >= 0) {
            //     if (!moc.Role) {
            //         moc.Role = [];
            //     }
            //     moc.Role.push("note");
            } else if (seq.SystemRequired.indexOf("sidebar-on") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("sidebar");
            }
        }
        if (seq.TextRef) {
            const seqTextRefDecoded = seq.TextRefDecoded;
            if (!seqTextRefDecoded) {
                debug("!?seqTextRefDecoded");
            } else {
                const zipPath = path.join(path.dirname(smil.ZipPath), seqTextRefDecoded)
                    .replace(/\\/g, "/");
                moc.Text = zipPath;
            }
        }

        if (seq.Children && seq.Children.length) {
            seq.Children.forEach((child) => {
                if (!moc.Children) {
                    moc.Children = [];
                }
                addSeqToMediaOverlay(smil, publication, rootMO, moc.Children, child);
            });
        }
    } else { // Par
        const par = seqChild as Par;

        if (par.ID) {
            moc.ParID = par.ID;
        }

        if (par.EpubType) {
            const roles = parseSpaceSeparatedString(par.EpubType);
            for (const role of roles) {
                if (!role.length) {
                    continue;
                }
                if (!moc.Role) {
                    moc.Role = [];
                }
                if (moc.Role.indexOf(role) < 0) {
                    moc.Role.push(role);
                }
            }
        }
        if (par.Class) {
            if (par.Class.indexOf("pagenum") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("pagebreak");
            } else if (par.Class.indexOf("note") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("note");
            } else if (par.Class.indexOf("sidebar") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("sidebar");
            } else if (par.Class.indexOf("annotation") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("annotation");
            }
        } else if (par.CustomTest) {
            if (par.CustomTest.indexOf("pagenum") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("pagebreak");
            } else if (par.CustomTest.indexOf("note") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("note");
            } else if (par.CustomTest.indexOf("sidebar") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("sidebar");
            } else if (par.CustomTest.indexOf("annotation") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("annotation");
            }
        } else if (par.SystemRequired) {
            if (par.SystemRequired.indexOf("pagenumber-on") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("pagebreak");
            } else if (par.SystemRequired.indexOf("note-on") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("note");
            // } else if (par.SystemRequired.indexOf("footnote-on") >= 0) {
            //     if (!moc.Role) {
            //         moc.Role = [];
            //     }
            //     moc.Role.push("note");
            // } else if (par.SystemRequired.indexOf("prodnote-on") >= 0) {
            //     if (!moc.Role) {
            //         moc.Role = [];
            //     }
            //     moc.Role.push("note");
            } else if (par.SystemRequired.indexOf("sidebar-on") >= 0) {
                if (!moc.Role) {
                    moc.Role = [];
                }
                moc.Role.push("sidebar");
            }
        }
        if (par.Text && par.Text.Src) {
            const parTextSrcDcoded = par.Text.SrcDecoded;
            if (!parTextSrcDcoded) {
                debug("?!parTextSrcDcoded");
            } else {
                const zipPath = path.join(path.dirname(smil.ZipPath), parTextSrcDcoded)
                    .replace(/\\/g, "/");
                moc.Text = zipPath;
            }

            if (par.Text.ID) {
                moc.TextID = par.Text.ID;
            }
        }
        if (par.Audio && par.Audio.Src) {
            const parAudioSrcDcoded = par.Audio.SrcDecoded;
            if (!parAudioSrcDcoded) {
                debug("?!parAudioSrcDcoded");
            } else {
                const zipPath = path.join(path.dirname(smil.ZipPath), parAudioSrcDcoded)
                    .replace(/\\/g, "/");
                moc.Audio = zipPath;
                moc.Audio += "#t=";

                const begin = par.Audio.ClipBegin ? timeStrToSeconds(par.Audio.ClipBegin) : 0;
                moc.AudioClipBegin = begin;
                const end = par.Audio.ClipEnd ? timeStrToSeconds(par.Audio.ClipEnd) : 0;
                moc.AudioClipEnd = end;

                moc.Audio += begin.toString();
                if (par.Audio.ClipEnd) {
                    moc.Audio += ",";
                    moc.Audio += end.toString();
                }
            }

            if (par.Audio.ID) {
                moc.AudioID = par.Audio.ID;
            }
        }
        if (par.Video && par.Video.Src) {
            const parVideoSrcDcoded = par.Video.SrcDecoded;
            if (!parVideoSrcDcoded) {
                debug("?!parVideoSrcDcoded");
            } else {
                const zipPath = path.join(path.dirname(smil.ZipPath), parVideoSrcDcoded)
                    .replace(/\\/g, "/");
                moc.Video = zipPath;
                moc.Video += "#t=";

                const begin = par.Video.ClipBegin ? timeStrToSeconds(par.Video.ClipBegin) : 0;
                moc.VideoClipBegin = begin;
                const end = par.Video.ClipEnd ? timeStrToSeconds(par.Video.ClipEnd) : 0;
                moc.VideoClipEnd = end;

                moc.Video += begin.toString();
                if (par.Video.ClipEnd) {
                    moc.Video += ",";
                    moc.Video += end.toString();
                }
            }

            if (par.Video.ID) {
                moc.VideoID = par.Video.ID;
            }
        }
        if (par.Img && par.Img.Src) {
            const parImgSrcDcoded = par.Img.SrcDecoded;
            if (!parImgSrcDcoded) {
                debug("?!parImgSrcDcoded");
            } else {
                const zipPath = path.join(path.dirname(smil.ZipPath), parImgSrcDcoded)
                    .replace(/\\/g, "/");
                debug("SMIL IMG skipped: " + zipPath);
            }
            if (!par.Audio && !par.Video && !par.Text) {
                moc.initialized = false;
                doAdd = false;
            }

            if (par.Img.ID) {
                moc.ImgID = par.Img.ID;
            }
        }
    }
    if (doAdd) {
        mo.push(moc);
    } else {
        debug("SMIL MO skip: ", moc, seqChild);
    }
};

export const updateDurations = (dur: number | undefined, link: Link) => {
    if (!dur || !link.MediaOverlays) {
        return;
    }

    if (!link.Duration) {
        link.Duration = dur;
    }
    if (link.Alternate) {
        for (const altLink of link.Alternate) {
            if (altLink.TypeLink === "application/vnd.syncnarr+json") {
                if (!altLink.Duration) {
                    altLink.Duration = dur;
                }
            }
        }
    }
};
