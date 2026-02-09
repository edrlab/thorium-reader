// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import * as fs from "fs";
import { imageSize } from "image-size";
// import { ISize } from "image-size/dist/types/interface";
import * as path from "path";
import { URL } from "url";
import * as xmldom from "@xmldom/xmldom";
import * as xpath from "xpath";

import { MediaOverlayNode, timeStrToSeconds } from "@r2-shared-js/models/media-overlay";
import { Metadata } from "@r2-shared-js/models/metadata";
import { BelongsTo } from "@r2-shared-js/models/metadata-belongsto";
import { Contributor } from "@r2-shared-js/models/metadata-contributor";
import {
    LayoutEnum, OrientationEnum, OverflowEnum, PageEnum, Properties, SpreadEnum,
} from "@r2-shared-js/models/metadata-properties";
import { Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";
import { Encrypted } from "@r2-lcp-js/models/metadata-encrypted";
import { LCP } from "@r2-lcp-js/parser/epub/lcp";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { isHTTP } from "@r2-utils-js/_utils/http/UrlUtils";
import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
import { XML } from "@r2-utils-js/_utils/xml-js-mapper";
import { IStreamAndLength, IZip } from "@r2-utils-js/_utils/zip/zip";
import { zipLoadPromise } from "@r2-utils-js/_utils/zip/zipFactory";
import { removeUTF8BOM } from "@r2-utils-js/_utils/bom";
import { tryDecodeURI } from "../_utils/decodeURI";
import { zipHasEntry } from "../_utils/zipHasEntry";
import {
    BCP47_UNKNOWN_LANG as BCP47_UNKNOWN_LANG_, addIdentifier, addLanguage, addMediaOverlaySMIL,
    addOtherMetadata, addTitle, fillPublicationDate, fillSpineAndResource, fillSubject, fillTOC,
    findContributorInMeta, findInManifestByID, findMetaByRefineAndProperty, getNcx, getOpf,
    lazyLoadMediaOverlays, loadFileStrFromZipPath, mediaOverlayURLParam as mediaOverlayURLParam_,
    mediaOverlayURLPath as mediaOverlayURLPath_, parseSpaceSeparatedString, setPublicationDirection,
} from "./epub-daisy-common";
import { Container } from "./epub/container";
import { Rootfile } from "./epub/container-rootfile";
import { DisplayOptions } from "./epub/display-options";
import { Encryption } from "./epub/encryption";
import { NCX } from "./epub/ncx";
import { OPF } from "./epub/opf";
import { Manifest } from "./epub/opf-manifest";

const debug = debug_("r2:shared#parser/epub");

// https://github.com/readium/webpub-manifest/issues/52#issuecomment-601686135
export const BCP47_UNKNOWN_LANG = BCP47_UNKNOWN_LANG_;

export const mediaOverlayURLPath = mediaOverlayURLPath_;
export const mediaOverlayURLParam = mediaOverlayURLParam_;

export const addCoverDimensions = async (publication: Publication, coverLink: Link) => {

    const zipInternal = publication.findFromInternal("zip");
    if (zipInternal) {
        const zip = zipInternal.Value as IZip;

        const coverLinkHrefDecoded = coverLink.HrefDecoded;
        if (!coverLinkHrefDecoded) {
            return;
        }
        const has = await zipHasEntry(zip, coverLinkHrefDecoded, coverLink.Href);
        if (!has) {
            debug(`NOT IN ZIP (addCoverDimensions): ${coverLink.Href} --- ${coverLinkHrefDecoded}`);
            const zipEntries = await zip.getEntries();
            for (const zipEntry of zipEntries) {
                if (zipEntry.startsWith("__MACOSX/")) {
                    continue;
                }
                debug(zipEntry);
            }
            return;
        }
        let zipStream: IStreamAndLength;
        try {
            zipStream = await zip.entryStreamPromise(coverLinkHrefDecoded);
        } catch (err) {
            debug(coverLinkHrefDecoded);
            debug(coverLink.TypeLink);
            debug(err);
            return;
        }

        let zipData: Buffer;
        try {
            zipData = await streamToBufferPromise(zipStream.stream);

            const imageInfo = imageSize(zipData);
            if (imageInfo && imageInfo.width && imageInfo.height) {
                coverLink.Width = imageInfo.width;
                coverLink.Height = imageInfo.height;

                if (coverLink.TypeLink &&
                    coverLink.TypeLink.replace("jpeg", "jpg").replace("+xml", "")
                    !== ("image/" + imageInfo.type)) {
                    debug(`Wrong image type? ${coverLink.TypeLink} -- ${imageInfo.type}`);
                }
            }
        } catch (err) {
            debug(coverLinkHrefDecoded);
            debug(coverLink.TypeLink);
            debug(err);
        }
    }
};

export enum EPUBis {
    LocalExploded = "LocalExploded",
    LocalPacked = "LocalPacked",
    RemoteExploded = "RemoteExploded",
    RemotePacked = "RemotePacked",
}
export function isEPUBlication(urlOrPath: string): EPUBis | undefined {
    let p = urlOrPath;
    const http = isHTTP(urlOrPath);
    if (http) {
        const url = new URL(urlOrPath);
        p = url.pathname;
    } else if (fs.existsSync(path.join(urlOrPath, "META-INF", "container.xml"))) {
        return EPUBis.LocalExploded;
    }
    const fileName = path.basename(p);
    const ext = path.extname(fileName);

    const epub = /\.epub3?$/i.test(ext);
    if (epub) {
        return http ? EPUBis.RemotePacked : EPUBis.LocalPacked;
    }

    // filePath.replace(/\//, "/").endsWith("META-INF/container.xml")
    if (/META-INF[\/|\\]container.xml$/.test(p)) {
        return http ? EPUBis.RemoteExploded : EPUBis.LocalExploded;
    }

    return undefined;
}

export async function EpubParsePromise(filePath: string): Promise<Publication> {

    const isAnEPUB = isEPUBlication(filePath);

    // // excludes EPUBis.RemoteExploded
    // const canLoad = isAnEPUB === EPUBis.LocalExploded ||
    //     isAnEPUB === EPUBis.LocalPacked ||
    //     isAnEPUB === EPUBis.RemotePacked;
    // if (!canLoad) {
    //     // TODO? r2-utils-js zip-ext.ts => variant for HTTP without directory listing? (no deterministic zip entries)
    //     const err = "Cannot load exploded remote EPUB (needs filesystem access to list directory contents).";
    //     debug(err);
    //     // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    //     return Promise.reject(err);
    // }

    let filePathToLoad = filePath;
    if (isAnEPUB === EPUBis.LocalExploded) { // (must ensure is directory/folder)
        filePathToLoad = filePathToLoad.replace(/META-INF[\/|\\]container.xml$/, "");
    } else if (isAnEPUB === EPUBis.RemoteExploded) {
        const url = new URL(filePathToLoad);
        url.pathname = url.pathname.replace(/META-INF[\/|\\]container.xml$/, "");
        // contains trailing slash
        filePathToLoad = url.toString();
    }
    let zip: IZip;
    try {
        zip = await zipLoadPromise(filePathToLoad);
    } catch (err) {
        debug(err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }

    if (!zip.hasEntries()) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject("EPUB zip empty");
    }

    const publication = new Publication();
    publication.Context = ["https://readium.org/webpub-manifest/context.jsonld"];
    publication.Metadata = new Metadata();
    publication.Metadata.RDFType = "http://schema.org/Book";
    // publication.Metadata.Modified = moment(Date.now()).toDate();

    publication.AddToInternal("filename", path.basename(filePath));

    publication.AddToInternal("type", "epub");
    publication.AddToInternal("zip", zip);

    let lcpl: LCP | undefined;
    const lcplZipPath = "META-INF/license.lcpl";
    let has = await zipHasEntry(zip, lcplZipPath, undefined);
    if (has) {
        let lcplZipStream_: IStreamAndLength;
        try {
            lcplZipStream_ = await zip.entryStreamPromise(lcplZipPath);
        } catch (err) {
            debug(err);
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject(err);
        }
        const lcplZipStream = lcplZipStream_.stream;

        let lcplZipData: Buffer;
        try {
            lcplZipData = await streamToBufferPromise(lcplZipStream);
        } catch (err) {
            debug(err);
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject(err);
        }

        const lcplStr = lcplZipData.toString("utf8");
        const lcplJson = global.JSON.parse(lcplStr);
        // debug(lcplJson);
        lcpl = TaJsonDeserialize<LCP>(lcplJson, LCP);
        lcpl.ZipPath = lcplZipPath;
        lcpl.JsonSource = lcplStr;
        lcpl.init();

        // breakLength: 100  maxArrayLength: undefined
        // debug(util.inspect(lcpl,
        //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));

        publication.LCP = lcpl;

        // // breakLength: 100  maxArrayLength: undefined
        // debug(util.inspect(this.LCP,
        //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));

        // https://github.com/readium/readium-lcp-specs/issues/15#issuecomment-358247286
        // application/vnd.readium.lcp.license-1.0+json (LEGACY)
        // application/vnd.readium.lcp.license.v1.0+json (NEW)
        // application/vnd.readium.license.status.v1.0+json (LSD)
        const mime = "application/vnd.readium.lcp.license.v1.0+json";
        publication.AddLink(mime, ["license"], lcpl.ZipPath, undefined);
    }

    let encryption: Encryption | undefined;
    const encZipPath = "META-INF/encryption.xml";
    has = await zipHasEntry(zip, encZipPath, undefined);
    if (has) {
        let encryptionXmlZipStream_: IStreamAndLength;
        try {
            encryptionXmlZipStream_ = await zip.entryStreamPromise(encZipPath);
        } catch (err) {
            debug(err);
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject(err);
        }
        const encryptionXmlZipStream = encryptionXmlZipStream_.stream;

        let encryptionXmlZipData: Buffer;
        try {
            encryptionXmlZipData = await streamToBufferPromise(encryptionXmlZipStream);
        } catch (err) {
            debug(err);
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject(err);
        }

        const encryptionXmlStr = removeUTF8BOM(encryptionXmlZipData.toString("utf8"));
        const encryptionXmlDoc = new xmldom.DOMParser().parseFromString(encryptionXmlStr, "application/xml") as unknown as Document;

        encryption = XML.deserialize<Encryption>(encryptionXmlDoc, Encryption);
        encryption.ZipPath = encZipPath;

        // breakLength: 100  maxArrayLength: undefined
        // debug(util.inspect(encryption,
        //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));
    }

    const containerZipPath = "META-INF/container.xml";

    let containerXmlZipStream_: IStreamAndLength;
    try {
        containerXmlZipStream_ = await zip.entryStreamPromise(containerZipPath);
    } catch (err) {
        debug(err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }
    const containerXmlZipStream = containerXmlZipStream_.stream;

    let containerXmlZipData: Buffer;
    try {
        containerXmlZipData = await streamToBufferPromise(containerXmlZipStream);
    } catch (err) {
        debug(err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }

    const containerXmlStr = removeUTF8BOM(containerXmlZipData.toString("utf8"));
    const containerXmlDoc = new xmldom.DOMParser().parseFromString(containerXmlStr, "application/xml") as unknown as Document;

    // debug(containerXmlDoc);
    // debug(containerXmlStr);
    // const containerXmlRootElement = xpath.select1("/", containerXmlDoc);
    // debug(containerXmlRootElement.toString());

    const container = XML.deserialize<Container>(containerXmlDoc, Container);
    container.ZipPath = containerZipPath;
    // breakLength: 100  maxArrayLength: undefined
    // debug(util.inspect(container,
    //     { showHidden: false, depth: 1000, colors: true, customInspect: true }));

    const rootfile = container.Rootfile[0];

    const rootfilePathDecoded = rootfile.PathDecoded;
    if (!rootfilePathDecoded) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject("?!rootfile.PathDecoded");
    }

    const opf = await getOpf(zip, rootfilePathDecoded, rootfile.Path);

    // const epubVersion = getEpubVersion(rootfile, opf);

    addLanguage(publication, opf);

    addTitle(publication, rootfile, opf);

    addIdentifier(publication, opf);

    addOtherMetadata(publication, rootfile, opf);

    setPublicationDirection(publication, opf);

    findContributorInMeta(publication, rootfile, opf);

    await addRendition(publication, opf, zip);

    await fillSpineAndResource(publication, rootfile, opf, zip, addLinkData);

    await addCoverRel(publication, rootfile, opf, zip);

    if (encryption) {
        fillEncryptionInfo(publication, encryption, lcpl);
    }

    try {
        await fillTOCFromNavDoc(publication, zip);
    } catch (ex) {
        // encrypted TOC?
        publication.TOC = [];
        console.log(ex);
    }

    if (!publication.TOC || !publication.TOC.length) {

        let ncx: NCX | undefined;
        if (opf.Manifest && opf.Spine.Toc) {
            const ncxManItem = opf.Manifest.find((manifestItem) => {
                return manifestItem.ID === opf.Spine.Toc;
            });
            if (ncxManItem) {
                ncx = await getNcx(ncxManItem, opf, zip);
            }
        }

        fillTOC(publication, opf, ncx);
    }

    if (!publication.PageList && publication.Resources) {
        // EPUB extended with Adobe Digital Editions page map
        //  https://wiki.mobileread.com/wiki/Adobe_Digital_Editions#Page-map
        const pageMapLink = publication.Resources.find((item: Link): boolean => {
            return item.TypeLink === "application/oebps-page-map+xml";
        });
        if (pageMapLink) {
            if (pageMapLink.Properties?.Encrypted) {
                debug("page.xml application/oebps-page-map+xml ENCRYPTED?! (cannot parse page list)");
            }
            try {
                await fillPageListFromAdobePageMap(publication, zip, pageMapLink);
            } catch (e) {
                debug(e);
            }
        }
    }

    fillCalibreSerieInfo(publication, opf);

    fillSubject(publication, opf);

    fillPublicationDate(publication, rootfile, opf);

    // await fillMediaOverlay(publication, rootfile, opf, zip);

    return publication;
}

// private filePathToTitle(filePath: string): string {
//     const fileName = path.basename(filePath);
//     return slugify(fileName, "_").replace(/[\.]/g, "_");
// }

export async function getAllMediaOverlays(publication: Publication): Promise<MediaOverlayNode[]> {
    const mos: MediaOverlayNode[] = [];

    const links: Link[] = ([] as Link[]).
        concat(publication.Spine ? publication.Spine : []).
        concat(publication.Resources ? publication.Resources : []);

    for (const link of links) {
        if (link.MediaOverlays) {
            const mo = link.MediaOverlays;
            if (!mo.initialized) {
                try {
                    // mo.initialized true/false is automatically handled
                    await lazyLoadMediaOverlays(publication, mo);
                } catch (err) {
                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                    return Promise.reject(err);
                }
            }
            mos.push(mo);
        }
    }

    return Promise.resolve(mos);
}

export async function getMediaOverlay(publication: Publication, spineHref: string): Promise<MediaOverlayNode> {

    const links: Link[] = ([] as Link[]).
        concat(publication.Spine ? publication.Spine : []).
        concat(publication.Resources ? publication.Resources : []);

    for (const link of links) {
        if (link.MediaOverlays && link.Href.indexOf(spineHref) >= 0) {
            const mo = link.MediaOverlays;
            if (!mo.initialized) {
                try {
                    // mo.initialized true/false is automatically handled
                    await lazyLoadMediaOverlays(publication, mo);
                } catch (err) {
                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                    return Promise.reject(err);
                }
            }
            return Promise.resolve(mo);
        }
    }

    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    return Promise.reject(`No Media Overlays ${spineHref}`);
}

const addRelAndPropertiesToLink =
    async (publication: Publication, link: Link, linkEpub: Manifest, opf: OPF) => {

        if (linkEpub.Properties) {
            await addToLinkFromProperties(publication, link, linkEpub.Properties);
        }
        const spineProperties = findPropertiesInSpineForManifest(linkEpub, opf);
        if (spineProperties) {
            await addToLinkFromProperties(publication, link, spineProperties);
        }
    };

const addToLinkFromProperties = async (publication: Publication, link: Link, propertiesString: string) => {

    const properties = parseSpaceSeparatedString(propertiesString);
    const propertiesStruct = new Properties();

    // https://idpf.github.io/epub-vocabs/rendition/

    for (const p of properties) {
        switch (p) {
            case "cover-image": {
                link.AddRel("cover");
                await addCoverDimensions(publication, link);
                break;
            }
            case "nav": {
                link.AddRel("contents");
                break;
            }
            case "scripted": {
                if (!propertiesStruct.Contains) {
                    propertiesStruct.Contains = [];
                }
                propertiesStruct.Contains.push("js");
                break;
            }
            case "mathml": {
                if (!propertiesStruct.Contains) {
                    propertiesStruct.Contains = [];
                }
                propertiesStruct.Contains.push("mathml");
                break;
            }
            case "onix-record": {
                if (!propertiesStruct.Contains) {
                    propertiesStruct.Contains = [];
                }
                propertiesStruct.Contains.push("onix");
                break;
            }
            case "svg": {
                if (!propertiesStruct.Contains) {
                    propertiesStruct.Contains = [];
                }
                propertiesStruct.Contains.push("svg");
                break;
            }
            case "xmp-record": {
                if (!propertiesStruct.Contains) {
                    propertiesStruct.Contains = [];
                }
                propertiesStruct.Contains.push("xmp");
                break;
            }
            case "remote-resources": {
                if (!propertiesStruct.Contains) {
                    propertiesStruct.Contains = [];
                }
                propertiesStruct.Contains.push("remote-resources");
                break;
            }
            case "rendition:page-spread-left": {
                propertiesStruct.Page = PageEnum.Left;
                break;
            }
            case "page-spread-left": {
                propertiesStruct.Page = PageEnum.Left;
                break;
            }
            case "rendition:page-spread-right": {
                propertiesStruct.Page = PageEnum.Right;
                break;
            }
            case "page-spread-right": {
                propertiesStruct.Page = PageEnum.Right;
                break;
            }
            case "rendition:page-spread-center": {
                propertiesStruct.Page = PageEnum.Center;
                break;
            }
            case "page-spread-center": {
                propertiesStruct.Page = PageEnum.Center;
                break;
            }
            case "rendition:spread-none": {
                propertiesStruct.Spread = SpreadEnum.None;
                break;
            }
            case "rendition:spread-auto": {
                propertiesStruct.Spread = SpreadEnum.Auto;
                break;
            }
            case "rendition:spread-landscape": {
                propertiesStruct.Spread = SpreadEnum.Landscape;
                break;
            }
            case "rendition:spread-portrait": {
                propertiesStruct.Spread = SpreadEnum.Both; // https://github.com/readium/webpub-manifest/issues/24
                break;
            }
            case "rendition:spread-both": {
                propertiesStruct.Spread = SpreadEnum.Both;
                break;
            }
            case "rendition:layout-reflowable": {
                propertiesStruct.Layout = LayoutEnum.Reflowable;
                break;
            }
            case "rendition:layout-pre-paginated": {
                propertiesStruct.Layout = LayoutEnum.Fixed;
                break;
            }
            case "rendition:orientation-auto": {
                propertiesStruct.Orientation = OrientationEnum.Auto;
                break;
            }
            case "rendition:orientation-landscape": {
                propertiesStruct.Orientation = OrientationEnum.Landscape;
                break;
            }
            case "rendition:orientation-portrait": {
                propertiesStruct.Orientation = OrientationEnum.Portrait;
                break;
            }
            case "rendition:flow-auto": {
                propertiesStruct.Overflow = OverflowEnum.Auto;
                break;
            }
            case "rendition:flow-paginated": {
                propertiesStruct.Overflow = OverflowEnum.Paginated;
                break;
            }
            case "rendition:flow-scrolled-continuous": {
                propertiesStruct.Overflow = OverflowEnum.ScrolledContinuous;
                break;
            }
            case "rendition:flow-scrolled-doc": {
                propertiesStruct.Overflow = OverflowEnum.Scrolled;
                break;
            }
            default: {
                break;
            }
        }

        if (propertiesStruct.Layout ||
            propertiesStruct.Orientation ||
            propertiesStruct.Overflow ||
            propertiesStruct.Page ||
            propertiesStruct.Spread ||
            (propertiesStruct.Contains && propertiesStruct.Contains.length)) {

            link.Properties = propertiesStruct;
        }
    }
};

const addMediaOverlay = async (link: Link, linkEpub: Manifest, opf: OPF, zip: IZip) => {
    if (linkEpub.MediaOverlay) {
        const meta = findMetaByRefineAndProperty(opf, linkEpub.MediaOverlay, "media:duration");
        if (meta) {
            const dur = timeStrToSeconds(meta.Data);
            if (dur !== 0) { // parsing failure?
                link.Duration = dur;
            }
        }

        const manItemSmil = opf.Manifest.find((mi) => {
            if (mi.ID === linkEpub.MediaOverlay) {
                return true;
            }
            return false;
        });
        if (manItemSmil) {
            await addMediaOverlaySMIL(link, manItemSmil, opf, zip);
        }
    }
};

const addRendition = async (publication: Publication, opf: OPF, zip: IZip) => {

    if (opf.Metadata && opf.Metadata.Meta && opf.Metadata.Meta.length) {
        const rendition = new Properties();

        opf.Metadata.Meta.forEach((meta) => {
            switch (meta.Property) {
                case "rendition:layout": {
                    switch (meta.Data) {
                        case "pre-paginated": {
                            rendition.Layout = LayoutEnum.Fixed;
                            break;
                        }
                        case "reflowable": {
                            rendition.Layout = LayoutEnum.Reflowable;
                            break;
                        }
                    }
                    break;
                }
                case "rendition:orientation": {
                    switch (meta.Data) {
                        case "auto": {
                            rendition.Orientation = OrientationEnum.Auto;
                            break;
                        }
                        case "landscape": {
                            rendition.Orientation = OrientationEnum.Landscape;
                            break;
                        }
                        case "portrait": {
                            rendition.Orientation = OrientationEnum.Portrait;
                            break;
                        }
                    }
                    break;
                }
                case "rendition:spread": {
                    switch (meta.Data) {
                        case "auto": {
                            rendition.Spread = SpreadEnum.Auto;
                            break;
                        }
                        case "both": {
                            rendition.Spread = SpreadEnum.Both;
                            break;
                        }
                        case "none": {
                            rendition.Spread = SpreadEnum.None;
                            break;
                        }
                        case "landscape": {
                            rendition.Spread = SpreadEnum.Landscape;
                            break;
                        }
                        case "portrait": { // https://github.com/readium/webpub-manifest/issues/24
                            rendition.Spread = SpreadEnum.Both;
                            break;
                        }
                    }
                    break;
                }
                case "rendition:flow": {
                    switch (meta.Data) {
                        case "auto": {
                            rendition.Overflow = OverflowEnum.Auto;
                            break;
                        }
                        case "paginated": {
                            rendition.Overflow = OverflowEnum.Paginated;
                            break;
                        }
                        case "scrolled": {
                            rendition.Overflow = OverflowEnum.Scrolled;
                            break;
                        }
                        case "scrolled-continuous": {
                            rendition.Overflow = OverflowEnum.ScrolledContinuous;
                            break;
                        }
                    }
                    break;
                }
                default: {
                    break;
                }
            }
        });

        if (!rendition.Layout || !rendition.Orientation) {

            let displayOptionsZipPath = "META-INF/com.apple.ibooks.display-options.xml";
            let has = await zipHasEntry(zip, displayOptionsZipPath, undefined);
            if (has) {
                debug("Info: found iBooks display-options XML");
            } else {
                displayOptionsZipPath = "META-INF/com.kobobooks.display-options.xml";
                has = await zipHasEntry(zip, displayOptionsZipPath, undefined);
                if (has) {
                    debug("Info: found Kobo display-options XML");
                }
            }
            if (!has) {
                debug("Info: not found iBooks or Kobo display-options XML");
            } else {
                let displayOptionsZipStream_: IStreamAndLength | undefined;
                try {
                    displayOptionsZipStream_ = await zip.entryStreamPromise(displayOptionsZipPath);
                } catch (err) {
                    debug(err);
                }
                if (displayOptionsZipStream_) {
                    const displayOptionsZipStream = displayOptionsZipStream_.stream;

                    let displayOptionsZipData: Buffer | undefined;
                    try {
                        displayOptionsZipData = await streamToBufferPromise(displayOptionsZipStream);
                    } catch (err) {
                        debug(err);
                    }
                    if (displayOptionsZipData) {
                        try {
                            const displayOptionsStr = removeUTF8BOM(displayOptionsZipData.toString("utf8"));
                            const displayOptionsDoc = new xmldom.DOMParser().parseFromString(displayOptionsStr, "application/xml") as unknown as Document;

                            const displayOptions = XML.deserialize<DisplayOptions>(displayOptionsDoc, DisplayOptions);
                            displayOptions.ZipPath = displayOptionsZipPath;

                            if (displayOptions && displayOptions.Platforms) {
                                const renditionPlatformAll = new Properties();
                                const renditionPlatformIpad = new Properties();
                                const renditionPlatformIphone = new Properties();
                                displayOptions.Platforms.forEach((platform) => {
                                    if (platform.Options) {
                                        platform.Options.forEach((option) => {
                                            if (!rendition.Layout) {
                                                // tslint:disable-next-line:max-line-length
                                                // https://github.com/readium/architecture/blob/master/streamer/parser/metadata.md#epub-2x-9
                                                if (option.Name === "fixed-layout") {
                                                    if (option.Value === "true") {
                                                        rendition.Layout = LayoutEnum.Fixed;
                                                    } else {
                                                        rendition.Layout = LayoutEnum.Reflowable;
                                                    }
                                                }
                                            }
                                            if (!rendition.Orientation) {
                                                // tslint:disable-next-line:max-line-length
                                                // https://github.com/readium/architecture/blob/master/streamer/parser/metadata.md#epub-2x-10
                                                if (option.Name === "orientation-lock") {
                                                    const rend = platform.Name === "*" ? renditionPlatformAll :
                                                        (platform.Name === "ipad" ? renditionPlatformIpad :
                                                            (platform.Name === "iphone" ? renditionPlatformIphone :
                                                                renditionPlatformAll));
                                                    switch (option.Value) {
                                                        case "none": {
                                                            rend.Orientation = OrientationEnum.Auto;
                                                            break;
                                                        }
                                                        case "landscape-only": {
                                                            rend.Orientation = OrientationEnum.Landscape;
                                                            break;
                                                        }
                                                        case "portrait-only": {
                                                            rend.Orientation = OrientationEnum.Portrait;
                                                            break;
                                                        }
                                                        default: {
                                                            rend.Orientation = OrientationEnum.Auto;
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        });
                                    }
                                });
                                if (renditionPlatformAll.Orientation) {
                                    rendition.Orientation = renditionPlatformAll.Orientation;
                                } else if (renditionPlatformIpad.Orientation) {
                                    rendition.Orientation = renditionPlatformIpad.Orientation;
                                } else if (renditionPlatformIphone.Orientation) {
                                    rendition.Orientation = renditionPlatformIphone.Orientation;
                                }
                            }
                        } catch (err) {
                            debug(err);
                        }
                    }
                }
            }
        }
        if (rendition.Layout || rendition.Orientation || rendition.Overflow || rendition.Page || rendition.Spread) {
            publication.Metadata.Rendition = rendition;
        }
    }
};

const addLinkData = async (
    publication: Publication, rootfile: Rootfile | undefined,
    opf: OPF, zip: IZip, linkItem: Link, item: Manifest) => {

    if (rootfile) {
        await addRelAndPropertiesToLink(publication, linkItem, item, opf);
    }
    await addMediaOverlay(linkItem, item, opf, zip);
};

const fillEncryptionInfo =
    (publication: Publication, encryption: Encryption, lcp: LCP | undefined) => {

        encryption.EncryptedData.forEach((encInfo) => {
            const encrypted = new Encrypted();
            encrypted.Algorithm = encInfo.EncryptionMethod.Algorithm;

            if (lcp &&
                encrypted.Algorithm !== "http://www.idpf.org/2008/embedding" &&
                encrypted.Algorithm !== "http://ns.adobe.com/pdf/enc#RC") {
                encrypted.Profile = lcp.Encryption.Profile;
                encrypted.Scheme = "http://readium.org/2014/01/lcp";
            }
            if (encInfo.EncryptionProperties && encInfo.EncryptionProperties.length) {

                encInfo.EncryptionProperties.forEach((prop) => {

                    if (prop.Compression) {
                        if (prop.Compression.OriginalLength) {
                            encrypted.OriginalLength = parseFloat(prop.Compression.OriginalLength);
                        }
                        if (prop.Compression.Method === "8") {
                            encrypted.Compression = "deflate";
                        } else {
                            encrypted.Compression = "none";
                        }
                    }
                });
            }

            if (publication.Resources) {
                publication.Resources.forEach((l) => {
                    const filePath = l.Href;
                    if (filePath === tryDecodeURI(encInfo.CipherData.CipherReference.URI)) {
                        if (!l.Properties) {
                            l.Properties = new Properties();
                        }
                        l.Properties.Encrypted = encrypted;
                    }
                });
            }

            if (publication.Spine) {
                publication.Spine.forEach((l) => {
                    const filePath = l.Href;
                    if (filePath === tryDecodeURI(encInfo.CipherData.CipherReference.URI)) {
                        if (!l.Properties) {
                            l.Properties = new Properties();
                        }
                        l.Properties.Encrypted = encrypted;
                    }
                });
            }
        });
    };

const fillPageListFromAdobePageMap = async (publication: Publication, zip: IZip, l: Link): Promise<void> => {
    if (!l.HrefDecoded) {
        return;
    }
    let pageMapContent = await loadFileStrFromZipPath(l.Href, l.HrefDecoded, zip);
    if (!pageMapContent) {
        return;
    }
    pageMapContent = removeUTF8BOM(pageMapContent);
    const pageMapXmlDoc = new xmldom.DOMParser().parseFromString(pageMapContent, "application/xml") as unknown as Document;

    const pages = pageMapXmlDoc.getElementsByTagName("page");
    if (pages && pages.length) {
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < pages.length; i += 1) {
            const page = pages.item(i);
            if (!page) {
                continue;
            }

            const link = new Link();
            const href = page.getAttribute("href");
            const title = page.getAttribute("name");
            if (!href || !title) {
                continue;
            }

            if (!publication.PageList) {
                publication.PageList = [];
            }

            const hrefDecoded = tryDecodeURI(href);
            if (!hrefDecoded) {
                continue;
            }
            const zipPath = path.join(path.dirname(l.HrefDecoded), hrefDecoded)
                .replace(/\\/g, "/");

            link.setHrefDecoded(zipPath);

            link.Title = title;
            publication.PageList.push(link);
        }
    }
};

const fillCalibreSerieInfo = (publication: Publication, opf: OPF) => {
    let serie: string | undefined;
    let seriePosition: number | undefined;

    if (opf.Metadata && opf.Metadata.Meta && opf.Metadata.Meta.length) {
        opf.Metadata.Meta.forEach((m) => {
            if (m.Name === "calibre:series") {
                serie = m.Content;
            }
            if (m.Name === "calibre:series_index") {
                seriePosition = parseFloat(m.Content);
            }
        });
    }

    if (serie) {
        const contributor = new Contributor();
        contributor.Name = serie;
        if (seriePosition) {
            contributor.Position = seriePosition;
        }
        if (!publication.Metadata.BelongsTo) {
            publication.Metadata.BelongsTo = new BelongsTo();
        }
        if (!publication.Metadata.BelongsTo.Series) {
            publication.Metadata.BelongsTo.Series = [];
        }
        publication.Metadata.BelongsTo.Series.push(contributor);
    }
};

const fillTOCFromNavDoc = async (publication: Publication, zip: IZip):
    Promise<void> => {

    const navLink = publication.GetNavDoc();
    if (!navLink) {
        return;
    }

    const navLinkHrefDecoded = navLink.HrefDecoded;
    if (!navLinkHrefDecoded) {
        debug("!?navLink.HrefDecoded");
        return;
    }

    const has = await zipHasEntry(zip, navLinkHrefDecoded, navLink.Href);
    if (!has) {
        debug(`NOT IN ZIP (fillTOCFromNavDoc): ${navLink.Href} --- ${navLinkHrefDecoded}`);
        const zipEntries = await zip.getEntries();
        for (const zipEntry of zipEntries) {
            if (zipEntry.startsWith("__MACOSX/")) {
                continue;
            }
            debug(zipEntry);
        }
        return;
    }

    let navDocZipStream_: IStreamAndLength;
    try {
        navDocZipStream_ = await zip.entryStreamPromise(navLinkHrefDecoded);
    } catch (err) {
        debug(err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }
    const navDocZipStream = navDocZipStream_.stream;

    let navDocZipData: Buffer;
    try {
        navDocZipData = await streamToBufferPromise(navDocZipStream);
    } catch (err) {
        debug(err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }

    const navDocStr = removeUTF8BOM(navDocZipData.toString("utf8"));
    const navXmlDoc = new xmldom.DOMParser().parseFromString(navDocStr, "application/xml") as unknown as Document;

    const select = xpath.useNamespaces({
        epub: "http://www.idpf.org/2007/ops",
        xhtml: "http://www.w3.org/1999/xhtml",
    });

    const navs = select("/xhtml:html/xhtml:body//xhtml:nav", navXmlDoc) as Element[];
    if (navs && navs.length) {

        navs.forEach((navElement: Element) => {

            const epubType = select("@epub:type", navElement) as Attr[];
            if (epubType && epubType.length) {

                const olElem = select("xhtml:ol", navElement) as Element[];

                const rolesString = epubType[0].value;
                const rolesArray = parseSpaceSeparatedString(rolesString);

                if (rolesArray.length) {
                    for (const role of rolesArray) {
                        switch (role) {
                            case "toc": {
                                publication.TOC = [];
                                fillTOCFromNavDocWithOL(select, olElem, publication.TOC, navLinkHrefDecoded);
                                break;
                            }
                            case "page-list": {
                                publication.PageList = [];
                                fillTOCFromNavDocWithOL(select, olElem, publication.PageList, navLinkHrefDecoded, true);
                                break;
                            }
                            case "landmarks": {
                                publication.Landmarks = [];
                                fillTOCFromNavDocWithOL(select, olElem, publication.Landmarks, navLinkHrefDecoded);
                                break;
                            }
                            case "lot": {
                                publication.LOT = [];
                                fillTOCFromNavDocWithOL(select, olElem, publication.LOT, navLinkHrefDecoded);
                                break;
                            }
                            case "loa": {
                                publication.LOA = [];
                                fillTOCFromNavDocWithOL(select, olElem, publication.LOA, navLinkHrefDecoded);
                                break;
                            }
                            case "loi": {
                                publication.LOI = [];
                                fillTOCFromNavDocWithOL(select, olElem, publication.LOI, navLinkHrefDecoded);
                                break;
                            }
                            case "lov": {
                                publication.LOV = [];
                                fillTOCFromNavDocWithOL(select, olElem, publication.LOV, navLinkHrefDecoded);
                                break;
                            }
                            default: {
                                break; // "switch", not enclosing "for" loop
                            }
                        }
                    }
                }
            }
        });
    }
};

const fillTOCFromNavDocWithOL = (
    select: xpath.XPathSelect,
    olElems: Element[],
    children: Link[],
    navDocPath: string,
    requireTitle: boolean = false) => {

    olElems.forEach((olElem: Element) => {

        const liElems = select("xhtml:li", olElem) as Element[];
        if (liElems && liElems.length) {

            liElems.forEach((liElem) => {

                const link = new Link();

                const aElems = select("xhtml:a", liElem) as Element[];
                if (aElems && aElems.length > 0) {

                    const epubType = select("@epub:type", aElems[0]) as Attr[];
                    if (epubType && epubType.length) {

                        const rolesString = epubType[0].value;
                        const rolesArray = parseSpaceSeparatedString(rolesString);

                        if (rolesArray.length) {
                            link.AddRels(rolesArray);
                        }
                    }

                    const aHref = select("@href", aElems[0]) as Attr[];
                    if (aHref && aHref.length) {
                        const val = aHref[0].value;
                        let valDecoded = tryDecodeURI(val);
                        if (!valDecoded) {
                            debug("!?valDecoded");
                            return; // foreach
                        }
                        if (val[0] === "#") {
                            valDecoded = path.basename(navDocPath) + valDecoded;
                        }

                        const zipPath = path.join(path.dirname(navDocPath), valDecoded)
                            .replace(/\\/g, "/");

                        link.setHrefDecoded(zipPath);
                    }

                    let aText = aElems[0].textContent; // select("text()", aElems[0])[0].data;
                    if (aText && aText.length) {
                        aText = aText.trim();
                        aText = aText.replace(/\s\s+/g, " ");
                        link.Title = aText;
                    }
                } else {
                    const liFirstChild = select("xhtml:*[1]", liElem) as Element[];
                    if (liFirstChild && liFirstChild.length && liFirstChild[0].textContent) {
                        link.Title = liFirstChild[0].textContent.trim();
                    }
                }

                if (!requireTitle || !!link.Title) {
                    children.push(link);
                }

                const olElemsNext = select("xhtml:ol", liElem) as Element[];
                if (olElemsNext && olElemsNext.length) {
                    if (!link.Children) {
                        link.Children = [];
                    }
                    fillTOCFromNavDocWithOL(select, olElemsNext, link.Children, navDocPath);
                }
            });
        }
    });
};

const addCoverRel = async (publication: Publication, rootfile: Rootfile, opf: OPF, zip: IZip) => {

    let coverID: string | undefined;

    if (opf.Metadata && opf.Metadata.Meta && opf.Metadata.Meta.length) {
        opf.Metadata.Meta.find((meta) => {
            if (meta.Name === "cover") {
                coverID = meta.Content;
                return true;
            }
            return false;
        });
    }

    if (coverID) {
        let manifestInfo: Link;
        try {
            manifestInfo = await findInManifestByID(publication, rootfile, opf, coverID, zip, addLinkData);
        } catch (err) {
            debug(err);
            return;
        }
        if (manifestInfo && manifestInfo.Href && publication.Resources && publication.Resources.length) {

            const href = manifestInfo.Href;
            const linky = publication.Resources.find((item) => {
                if (item.Href === href) {
                    return true;
                }
                return false;
            });
            if (linky) { // publication.Resources[i]
                linky.AddRel("cover");
                await addCoverDimensions(publication, linky);
            }
        }
    }
};

const findPropertiesInSpineForManifest = (linkEpub: Manifest, opf: OPF): string | undefined => {

    if (opf.Spine && opf.Spine.Items && opf.Spine.Items.length) {
        const it = opf.Spine.Items.find((item) => {
            if (item.IDref === linkEpub.ID) {
                return true;
            }
            return false;
        });
        if (it && it.Properties) {
            return it.Properties;
        }
    }

    return undefined;
};

// const findLinKByHref =
// (publication: Publication, href: string): Link | undefined => {
//     if (publication.Spine && publication.Spine.length) {
//         const ll = publication.Spine.find((l) => {
//             if (href === l.HrefDecoded) {
//                 return true;
//             }
//             return false;
//         });
//         if (ll) {
//             return ll;
//         }
//     }

//     return undefined;
// };

// const fillMediaOverlay =
//     async (publication: Publication, rootfile: Rootfile, opf: OPF, zip: IZip) => {

//         if (!publication.Resources) {
//             return;
//         }

//         for (const item of publication.Resources) {
//             if (item.TypeLink !== "application/smil+xml") {
//                 continue;
//             }

//             const itemHrefDecoded = item.HrefDecoded;
//             if (!itemHrefDecoded) {
//                 debug("?!item.HrefDecoded");
//                 continue;
//             }
//             const has = await zipHasEntry(zip, itemHrefDecoded, item.Href);
//             if (!has) {
//                 debug(`NOT IN ZIP (fillMediaOverlay): ${item.HrefDecoded} --- ${itemHrefDecoded}`);
//                 const zipEntries = await zip.getEntries();
//                 for (const zipEntry of zipEntries) {
// if (zipEntry.startsWith("__MACOSX/")) {
//     continue;
// }
//                     debug(zipEntry);
//                 }
//                 continue;
//             }

//             const manItemsHtmlWithSmil: Manifest[] = [];
//             opf.Manifest.forEach((manItemHtmlWithSmil) => {
//                 if (manItemHtmlWithSmil.MediaOverlay) { // HTML
//                     const manItemSmil = opf.Manifest.find((mi) => {
//                         if (mi.ID === manItemHtmlWithSmil.MediaOverlay) {
//                             return true;
//                         }
//                         return false;
//                     });
//                     if (manItemSmil && opf.ZipPath) {
//                         const manItemSmilHrefDecoded = manItemSmil.HrefDecoded;
//                         if (!manItemSmilHrefDecoded) {
//                             debug("!?manItemSmil.HrefDecoded");
//                             return; // foreach
//                         }
//                         const smilFilePath = path.join(path.dirname(opf.ZipPath), manItemSmilHrefDecoded)
//                                 .replace(/\\/g, "/");
//                         if (smilFilePath === itemHrefDecoded) {
//                             manItemsHtmlWithSmil.push(manItemHtmlWithSmil);
//                         } else {
//                             debug(`smilFilePath !== itemHrefDecoded ?! ${smilFilePath} ${itemHrefDecoded}`);
//                         }
//                     }
//                 }
//             });

//             const mo = new MediaOverlayNode();
//             mo.SmilPathInZip = itemHrefDecoded;
//             mo.initialized = false;

//             manItemsHtmlWithSmil.forEach((manItemHtmlWithSmil) => {

//                 if (!opf.ZipPath) {
//                     return;
//                 }
//                 const manItemHtmlWithSmilHrefDecoded = manItemHtmlWithSmil.HrefDecoded;
//                 if (!manItemHtmlWithSmilHrefDecoded) {
//                     debug("?!manItemHtmlWithSmil.HrefDecoded");
//                     return; // foreach
//                 }
//                 const htmlPathInZip = path.join(path.dirname(opf.ZipPath), manItemHtmlWithSmilHrefDecoded)
//                     .replace(/\\/g, "/");

//                 const link = findLinKByHref(publication, rootfile, opf, htmlPathInZip);
//                 if (link) {
//                     if (link.MediaOverlays) {
//                         debug(`#### MediaOverlays?! ${htmlPathInZip} => ${link.MediaOverlays.SmilPathInZip}`);
//                         return; // continue for each
//                     }

//                     const moURL = mediaOverlayURLPath + "?" +
//                         mediaOverlayURLParam + "=" + encodeURIComponent_RFC3986(link.Href);

//                     // legacy method:
//                     if (!link.Properties) {
//                         link.Properties = new Properties();
//                     }
//                     link.Properties.MediaOverlay = moURL;

//                     // new method:
//                     // https://w3c.github.io/sync-media-pub/incorporating-synchronized-narration.html#with-webpub
//                     if (!link.Alternate) {
//                         link.Alternate = [];
//                     }
//                     const moLink = new Link();
//                     moLink.Href = moURL;
//                     moLink.TypeLink = "application/vnd.syncnarr+json";
//                     moLink.Duration = link.Duration;
//                     link.Alternate.push(moLink);
//                 }
//             });

//             if (item.Properties && item.Properties.Encrypted) {
//                 debug("ENCRYPTED SMIL MEDIA OVERLAY: " + item.Href);
//                 continue;
//             }
//             // LAZY
//             // await lazyLoadMediaOverlays(publication, mo);
//         }

//         return;
//     };
