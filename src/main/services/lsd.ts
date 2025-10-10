// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { inject, injectable } from "inversify";
import { diSymbolTable } from "../diSymbolTable";
import { DeviceIdManager } from "./device";
import { LSD, StatusEnum } from "@r2-lcp-js/parser/epub/lsd";
import { LCP } from "@r2-lcp-js/parser/epub/lcp";
import { httpGet, httpPost, httpPut } from "../network/http";
import { contentTypeisApiProblem, contentTypeisLcp, contentTypeisLsd, parseContentType } from "readium-desktop/utils/contentType";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import URITemplate from "urijs/src/URITemplate";
import URI from "urijs";
import moment from "moment";
import { type Store } from "redux";
import { RootState } from "readium-desktop/main/redux/states";
import { ok } from "readium-desktop/common/utils/assert";
import { parseProblemDetails } from "readium-desktop/common/utils/http";
import isURL from "validator/lib/isURL";

const debug = debug_("readium-desktop:main#services/lsd");

@injectable()
export class LSDManager {

    @inject(diSymbolTable["device-id-manager"])
    private readonly deviceIdManager!: DeviceIdManager;

    @inject(diSymbolTable.store)
    private readonly store!: Store<RootState>;

    // @inject(diSymbolTable.translator)
    // private readonly translator!: Translator;

    public async launchStatusDocumentProcessing(lcp: LCP): Promise<string | undefined> {

        if (!lcp || !lcp.Links) {
            return undefined;
        }
        const linkStatus = lcp.Links.find((link) => {
            return link.Rel === "status";
        });
        if (!linkStatus) {
            return undefined;
        }
        debug("Link Status FOUND: ", linkStatus);

        const locale = this.store.getState().i18n.locale;

        // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
        if (!linkStatus.Href || !isURL(linkStatus.Href)) {
            debug("isURL() NOK", linkStatus.Href);
            return undefined;
        }
        const httpDataReceived = await httpGet(linkStatus.Href, {timeout: 6000}, undefined, locale);

        const {
            url: _baseUrl,
            contentType: _contentType, isSuccess, isFailure,
            isAbort, isNetworkError, isTimeout, statusMessage,
        } = httpDataReceived;

        const contentType = parseContentType(_contentType);
        if (contentTypeisApiProblem(contentType)) {
            const {title, type} = await parseProblemDetails(httpDataReceived.response);
            throw new Error(`${title} (${type})`);
        }

        const baseUrl = `${_baseUrl}`;
        ok(isSuccess, `message: ${statusMessage} | url: ${baseUrl} | type: ${_contentType} | code: ${+isFailure}${+isNetworkError}${+isAbort}${+isTimeout}`);
        if (!contentTypeisLsd(contentType)) {
            debug(`LSD ERROR: LSD status http request not return an lsd content-type but: (${_contentType})`);
        }

        const lsdJson: any = await httpDataReceived.response.json();
        lcp.LSD = TaJsonDeserialize<LSD>(lsdJson, LSD);

        // debug(lsdJson.id);
        // debug(lsdJson.status); // revoked, returned, cancelled, expired
        // debug(lsdJson.message);
        // if (lsdJson.updated) {
        //     debug(lsdJson.updated.license);
        //     debug(lsdJson.updated.status);
        // }
        // if (lsdJson.links) {
        //     lsdJson.links.forEach((link: any) => {
        //         debug(link.rel); // license, register, return, renew
        //         debug(link.href);
        //         debug(link.type);
        //         debug(link.templated);
        //         debug(link.title);
        //         debug(link.profile);
        //     });
        // }
        // if (lsdJson.potential_rights) {
        //     debug(lsdJson.potential_rights.end);
        // }
        // if (lsdJson.events) {
        //     lsdJson.events.forEach((event: any) => {
        //         debug(event.type);
        //         debug(event.name);
        //         debug(event.timestamp); // ISO 8601 time and date
        //         debug(event.id);
        //     });
        // }

        const licenseUpdateResponseJson = await this.lsdLcpUpdate(lcp);
        if (licenseUpdateResponseJson) {
            return licenseUpdateResponseJson;
        }

        // lcp.LSD.Status !== StatusEnum.Active && lcp.LSD.Status !== StatusEnum.Ready
        if (lcp.LSD.Status === StatusEnum.Revoked
            || lcp.LSD.Status === StatusEnum.Returned
            || lcp.LSD.Status === StatusEnum.Cancelled
            || lcp.LSD.Status === StatusEnum.Expired) {

            debug("What?! LSD status:" + lcp.LSD.Status);
            // This should really never happen,
            // as the LCP license should not even have passed validation
            // due to expired end date / timestamp
            return undefined;
        }

        const registerResponse = await this.lsdRegister(lcp.LSD);
        if (registerResponse) {
            lcp.LSD = registerResponse;
            debug("registered response :");
            debug(lcp.LSD);
        }

        return undefined;
    }

    private async lsdLcpUpdate(lcp: LCP): Promise<string | undefined> {

        if (!lcp.LSD) {
            throw new Error("LCP LSD data is missing.");
        }

        if (!(lcp.LSD.Updated && lcp.LSD.Updated.License &&
            (lcp.Updated || lcp.Issued))) {
            debug("No LSD LCP update.");
            return undefined;
        }
        const updatedLicenseLSD = moment(lcp.LSD.Updated.License);
        const updatedLicense = moment(lcp.Updated || lcp.Issued);

        const forceUpdate = false; // just for testing!
        if (forceUpdate ||
            (updatedLicense.isBefore(updatedLicenseLSD)
                // TODO: Should we check for this? Is LCP server supposed to deliver non-usable licenses? (e.g. rights.end in the past) Let's do a sanity check on response LCP JSON (see below)
                // && (lcp.LSD.Status !== StatusEnum.Cancelled && lcp.LSD.Status !== StatusEnum.Expired && lcp.LSD.Status !== StatusEnum.Returned && lcp.LSD.Status !== StatusEnum.Revoked)
                // && (lcp.LSD.Status === StatusEnum.Active || lcp.LSD.Status === StatusEnum.Ready)
            )) {
            debug("LSD license updating...");
            if (!lcp.LSD.Links) {
                throw new Error("LSD License links missing");
            }
            const licenseLink = lcp.LSD.Links.find((link) => {
                return link.Rel === "license";
            });
            if (!licenseLink) {
                throw new Error("LSD license link is missing.");
            }

            debug("OLD LCP LICENSE, FETCHING LSD UPDATE ... " + licenseLink.Href);

            const locale = this.store.getState().i18n.locale;

            // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
            if (!licenseLink.Href || !isURL(licenseLink.Href)) {
                debug("isURL() NOK", licenseLink.Href);
                return undefined;
            }
            const httpDataReceived = await httpGet(licenseLink.Href, undefined, undefined, locale);

            const {
                url: _baseUrl,
                contentType: _contentType, isSuccess, isFailure,
                isAbort, isNetworkError, isTimeout, statusMessage,
            } = httpDataReceived;

            const contentType = parseContentType(_contentType);
            if (contentTypeisApiProblem(contentType)) {
                const {title, type} = await parseProblemDetails(httpDataReceived.response);
                throw new Error(`${title} (${type})`);
            }

            const baseUrl = `${_baseUrl}`;
            ok(isSuccess, `message: ${statusMessage} | url: ${baseUrl} | type: ${_contentType} | code: ${+isFailure}${+isNetworkError}${+isAbort}${+isTimeout}`);
            if (!contentTypeisLcp(contentType)) {
                debug(`LSD ERROR: LCP license http request not return an lcp content-type but: (${_contentType})`);
            }

            const lcplStr = await httpDataReceived.response.text();
            const tryLcpJson = JSON.parse(lcplStr);
            if (!tryLcpJson.id || !tryLcpJson.issued || !tryLcpJson.provider || !tryLcpJson.encryption || !tryLcpJson.encryption.profile) {
                debug(tryLcpJson);
                debug("NOT AN LCP LICENSE!"); // Some LCP servers respond 200 with error message!
                throw new Error("LCP not an lcp license fetched !");
            }

            return lcplStr;
        }

        return undefined;
    }

    private async lsdRegister(lsd: LSD): Promise<LSD | undefined> {

        if (!lsd) {
            throw new Error("LCP LSD data is missing.");
        }
        if (!lsd.Links) {
            throw new Error("No LSD links!");
        }

        const licenseRegister = lsd.Links.find((link) => {
            return link.Rel === "register";
        });
        if (!licenseRegister) {
            throw new Error("No LSD register link!");
        }

        const deviceID = await this.deviceIdManager.getDeviceID();
        const deviceNAME = await this.deviceIdManager.getDeviceNAME();

        let doRegister = false;
        if (lsd.Status === StatusEnum.Ready) {
            doRegister = true;
        } else if (lsd.Status === StatusEnum.Active) {

            let deviceIDForStatusDoc: string | undefined;
            try {
                deviceIDForStatusDoc = await this.deviceIdManager.checkDeviceID(lsd.ID);
            } catch (err) {
                debug(err);
                // ignore
                // return Promise.reject("xxx");
            }

            if (!deviceIDForStatusDoc) {
                doRegister = true;
            } else if (deviceIDForStatusDoc !== deviceID) {
                debug("LSD registered device ID is different? ",
                    lsd.ID, ": ", deviceIDForStatusDoc, " --- ", deviceID);
                // this should really never happen ... but let's ensure anyway.
                doRegister = true;
            }
        }

        if (!doRegister) {
            debug("No need to LSD register.");
            return undefined;
        }

        let registerURL: string = licenseRegister.Href;
        if (licenseRegister.Templated) {
            const urlTemplate = new URITemplate(registerURL);
            const uri1 = urlTemplate.expand({ id: deviceID, name: deviceNAME }, { strict: true });
            registerURL = uri1.toString();

            // url = url.replace("{?id,name}", ""); // TODO: smarter regexp?
            // url = new URI(url).setQuery("id", deviceID).setQuery("name", deviceNAME).toString();
        }
        debug("REGISTER: " + registerURL);

        const locale = this.store.getState().i18n.locale;

        // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
        if (!registerURL || !isURL(registerURL)) {
            debug("isURL() NOK", registerURL);
            throw new Error("invalid register URL: " + registerURL);
        }
        const httpDataReceived = await httpPost(registerURL, undefined, undefined, locale);

        const {
            url: _baseUrl,
            contentType: _contentType, isSuccess, isFailure,
            isAbort, isNetworkError, isTimeout, statusMessage,
        } = httpDataReceived;

        const contentType = parseContentType(_contentType);
        if (contentTypeisApiProblem(contentType)) {
            const {title, type} = await parseProblemDetails(httpDataReceived.response);
            throw new Error(`${title} (${type})`);
        }

        const baseUrl = `${_baseUrl}`;
        ok(isSuccess, `message: ${statusMessage} | url: ${baseUrl} | type: ${_contentType} | code: ${+isFailure}${+isNetworkError}${+isAbort}${+isTimeout}`);
        if (!contentTypeisLsd(contentType)) {
            debug(`LSD ERROR: LSD status http request not return an lsd content-type but: (${_contentType})`);
        }

        const responseJson = await httpDataReceived.response.json();

        if ((responseJson as any).status === "active") {
            try {
                const id = (responseJson as any).id;
                if (typeof id === "string") {
                    await this.deviceIdManager.recordDeviceID(id);
                }
            } catch (err) {
                debug(err);
            }
        }

        const newLsd = TaJsonDeserialize<LSD>(responseJson, LSD);
        return newLsd;
    }

    public async lsdRenew(end: Date | undefined, lsd: LSD): Promise<LSD> {

        if (!lsd) {
            throw new Error("LCP LSD data is missing.");
        }
        if (!lsd.Links) {
            throw new Error("No LSD links!");
        }

        const licenseRenew = lsd.Links.find((link) => {
            return link.Rel === "renew";
        });
        if (!licenseRenew) {
            throw new Error("No LSD renew link!");
        }

        const deviceID = await this.deviceIdManager.getDeviceID();
        const deviceNAME = await this.deviceIdManager.getDeviceNAME();

        let renewURL: string = licenseRenew.Href;
        if (licenseRenew.Templated) {
            const urlTemplate = new URITemplate(renewURL);
            const uri1 = urlTemplate.expand({ end: "xxx", id: deviceID, name: deviceNAME }, { strict: false });
            renewURL = uri1.toString();

            const uri2 = new URI(renewURL); // URIjs necessary for .search() to work
            // TODO: urijs types broke this! (lib remains unchanged)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (uri2 as any).search((data: any) => {
                // overrides existing (leaves others intact)
                data.end = end?.toISOString(); // can be undefined
            });
            renewURL = uri2.toString();

            // url = url.replace("{?end,id,name}", ""); // TODO: smarter regexp?
            // url = new URI(url).setQuery("id", deviceID).setQuery("name", deviceNAME).toString();
        }
        debug("RENEW: " + renewURL);

        const locale = this.store.getState().i18n.locale;

        // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
        if (!renewURL || !isURL(renewURL)) {
            debug("isURL() NOK", renewURL);
            throw new Error("invalid renew URL: " + renewURL);
        }
        const httpDataReceived = await httpPut(renewURL, undefined, undefined, locale);

        const {
            url: _baseUrl,
            contentType: _contentType, isSuccess, isFailure,
            isAbort, isNetworkError, isTimeout, statusMessage, statusCode,
        } = httpDataReceived;

        const contentType = parseContentType(_contentType);
        if (contentTypeisApiProblem(contentType)) {
            const {title, type, detail} = await parseProblemDetails(httpDataReceived.response);
            throw new Error(`${title} (${detail ? detail : ""}) [${type ? type : ""}|${statusCode}]`);
        }

        const baseUrl = `${_baseUrl}`;
        ok(isSuccess, `message: ${statusMessage} | url: ${baseUrl} | type: ${_contentType} | code: ${+isFailure}${+isNetworkError}${+isAbort}${+isTimeout}`);
        if (!contentTypeisLsd(contentType)) {
            debug(`LSD ERROR: LSD status http request not return an lsd content-type but: (${_contentType})`);
        }

        const responseJson = await httpDataReceived.response.json();

        const newLsd = TaJsonDeserialize<LSD>(responseJson, LSD);
        return newLsd;
    }

    public async lsdReturn(lsd: LSD): Promise<LSD> {

        if (!lsd) {
            throw new Error("LCP LSD data is missing.");
        }
        if (!lsd.Links) {
            throw new Error("No LSD links!");
        }

        const licenseReturn = lsd.Links.find((link) => {
            return link.Rel === "return";
        });
        if (!licenseReturn) {
            throw new Error("No LSD return link!");
        }

        const deviceID = await this.deviceIdManager.getDeviceID();
        const deviceNAME = await this.deviceIdManager.getDeviceNAME();

        let returnURL: string = licenseReturn.Href;
        if (licenseReturn.Templated) {
            const urlTemplate = new URITemplate(returnURL);
            const uri1 = urlTemplate.expand({ id: deviceID, name: deviceNAME }, { strict: true });
            returnURL = uri1.toString();

            // url = url.replace("{?end,id,name}", ""); // TODO: smarter regexp?
            // url = new URI(url).setQuery("id", deviceID).setQuery("name", deviceNAME).toString();
        }
        debug("RETURN: " + returnURL);

        const locale = this.store.getState().i18n.locale;

        // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
        if (!returnURL || !isURL(returnURL)) {
            debug("isURL() NOK", returnURL);
            throw new Error("invalid return URL: " + returnURL);
        }
        const httpDataReceived = await httpPut(returnURL, undefined, undefined, locale);

        const {
            url: _baseUrl,
            contentType: _contentType, isSuccess, isFailure,
            isAbort, isNetworkError, isTimeout, statusMessage, statusCode,
        } = httpDataReceived;

        const contentType = parseContentType(_contentType);
        if (contentTypeisApiProblem(contentType)) {
            const {title, type, detail} = await parseProblemDetails(httpDataReceived.response);
            throw new Error(`${title} (${detail ? detail : ""}) [${type ? type : ""}|${statusCode}]`);
        }

        const baseUrl = `${_baseUrl}`;
        ok(isSuccess, `message: ${statusMessage} | url: ${baseUrl} | type: ${_contentType} | code: ${+isFailure}${+isNetworkError}${+isAbort}${+isTimeout}`);
        if (!contentTypeisLsd(contentType)) {
            debug(`LSD ERROR: LSD status http request not return an lsd content-type but: (${_contentType})`);
        }

        const responseJson = await httpDataReceived.response.json();

        const newLsd = TaJsonDeserialize<LSD>(responseJson, LSD);
        return newLsd;
    }
}
