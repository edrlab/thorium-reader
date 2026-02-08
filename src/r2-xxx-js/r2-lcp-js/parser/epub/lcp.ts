// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as bind from "bindings";
import * as crypto from "crypto";
import debug_ from "debug";
import * as fs from "fs";
import * as path from "path";
import * as request from "request";
// import * as requestPromise from "request-promise-native";
// https://github.com/edcarroll/ta-json
import { JsonElementType, JsonObject, JsonProperty } from "ta-json-x";

import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";

import { CRL_URL, DUMMY_CRL } from "./lcp-certificate";
import { Encryption } from "./lcp-encryption";
import { Link } from "./lcp-link";
import { Rights } from "./lcp-rights";
import { Signature } from "./lcp-signature";
import { User } from "./lcp-user";
import { LSD } from "./lsd";

const AES_BLOCK_SIZE = 16;

const debug = debug_("r2:lcp#parser/epub/lcp");

const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

let LCP_NATIVE_PLUGIN_PATH = path.join(process.cwd(), "LCP", "lcp.node");
export function setLcpNativePluginPath(filepath: string): boolean {
    LCP_NATIVE_PLUGIN_PATH = filepath;
    if (IS_DEV) {
        debug(LCP_NATIVE_PLUGIN_PATH);
    }

    const exists = fs.existsSync(LCP_NATIVE_PLUGIN_PATH);
    if (IS_DEV) {
        debug("LCP NATIVE PLUGIN: " + (exists ? "OKAY" : "MISSING"));
    }
    return exists;
}

export interface IDecryptedBuffer {
    buffer: Buffer;
    inflated: boolean;
}

@JsonObject()
export class LCP {
    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/license.schema.json#L11
    @JsonProperty("id")
    public ID!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/license.schema.json#L20
    @JsonProperty("provider")
    public Provider!: string;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/license.schema.json#L15
    @JsonProperty("issued")
    public Issued!: Date;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/license.schema.json#L25
    @JsonProperty("updated")
    public Updated!: Date;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/license.schema.json#L30
    @JsonProperty("encryption")
    public Encryption!: Encryption;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/license.schema.json#L97
    @JsonProperty("rights")
    public Rights!: Rights;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/license.schema.json#L122
    @JsonProperty("user")
    public User!: User;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/license.schema.json#L146
    @JsonProperty("signature")
    public Signature!: Signature;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/lcp-specs/blob/5828f83b6fffee23cbc38870f6f6431744191f21/schema/license.schema.json#L90
    @JsonProperty("links")
    @JsonElementType(Link)
    public Links!: Link[];

    public ZipPath: string | undefined;
    public JsonSource: string | undefined;

    public LSD: LSD | undefined;

    // JS impl
    public ContentKey: Buffer | undefined;

    // Native impl
    private _usesNativeNodePlugin: boolean | undefined = undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _lcpNative: any | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _lcpContext: any | undefined;

    public isNativeNodePlugin(): boolean {
        this.init();
        return this._usesNativeNodePlugin as boolean;
    }

    public isReady(): boolean {
        if (this.isNativeNodePlugin()) {
            return typeof this._lcpContext !== "undefined";
        }
        return typeof this.ContentKey !== "undefined";
    }

    public init() {

        if (typeof this._usesNativeNodePlugin !== "undefined") {
            return;
        }

        this.ContentKey = undefined;
        this._lcpContext = undefined;

        if (fs.existsSync(LCP_NATIVE_PLUGIN_PATH)) {
            if (IS_DEV) {
                debug("LCP _usesNativeNodePlugin");
            }
            const filePath = path.dirname(LCP_NATIVE_PLUGIN_PATH);
            const fileName = path.basename(LCP_NATIVE_PLUGIN_PATH);
            if (IS_DEV) {
                debug(filePath);
                debug(fileName);
            }
            this._usesNativeNodePlugin = true;
            this._lcpNative = bind({
                bindings: fileName,
                module_root: filePath,
                try: [[
                    "module_root",
                    "bindings",
                ]],
            });
        } else {
            if (IS_DEV) {
                debug("LCP JS impl");
            }
            this._usesNativeNodePlugin = false;
            this._lcpNative = undefined;
        }
    }

    public async decrypt(encryptedContent: Buffer, linkHref: string, needsInflating: boolean):
        Promise<IDecryptedBuffer> {

        // debug("linkHref => needsInflating: " + linkHref + " => " + needsInflating);

        // this.init();
        if (!this.isNativeNodePlugin()) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject("direct decrypt buffer only for native plugin");
        }
        if (!this._lcpContext) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject("LCP context not initialized (call tryUserKeys())");
        }

        return new Promise<IDecryptedBuffer>((resolve, reject) => {

            this._lcpNative.decrypt(
                this._lcpContext,
                encryptedContent,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (er: any, decryptedContent: any, inflated: boolean) => {
                    if (er) {
                        debug("decrypt ERROR");
                        debug(er);
                        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                        reject(er);
                        return;
                    }
                    let buff = decryptedContent;
                    if (!inflated) {
                        const padding = decryptedContent[decryptedContent.length - 1];
                        // debug(padding);
                        // const buff = Buffer.from(
                        //     decryptedContent,
                        //     0,
                        //     decryptedContent.length - padding);
                        buff = decryptedContent.slice(0, decryptedContent.length - padding);
                    }
                    resolve({
                        buffer: buff,
                        inflated: inflated ? true : false, // force bool (from potentially-undefined function parameter)
                    });
                },
                this.JsonSource,
                linkHref,
                needsInflating,
            );
        });
    }

    public async dummyCreateContext() {
        this.init();

        if (this._usesNativeNodePlugin) {
            const crlPem = await this.getCRLPem();

            // always generates USER_KEY_CHECK_INVALID = 141
            const sha256DummyPassphrase = "0".repeat(64);

            return new Promise<void>((resolve, reject) => {

                this._lcpNative.createContext(
                    this.JsonSource,
                    sha256DummyPassphrase,
                    crlPem,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (erro: any, _context: any) => {
                        if (erro) {
                            debug("dummyCreateContext ERROR");
                            debug(erro);
                            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                            reject(erro);
                            return;
                        }

                        // should never happen, as the userkey is fake (USER_KEY_CHECK_INVALID = 141)
                        resolve();
                    },
                );
            });
        }

        return Promise.resolve();
    }

    public async tryUserKeys(lcpUserKeys: string[]) {
        this.init();

        const check =
            (
            this.Encryption.Profile === "http://readium.org/lcp/basic-profile"
            ||
            this.Encryption.Profile === "http://readium.org/lcp/profile-1.0"
            ||
            (this.Encryption.Profile && /^http:\/\/readium\.org\/lcp\/profile-2\.[0-9]$/.test(this.Encryption.Profile))
            )
            &&
            this.Encryption.UserKey.Algorithm === "http://www.w3.org/2001/04/xmlenc#sha256"
            &&
            this.Encryption.ContentKey.Algorithm === "http://www.w3.org/2001/04/xmlenc#aes256-cbc"
            ;
        if (!check) {
            debug("Incorrect LCP fields.");
            debug(this.Encryption.Profile);
            debug(this.Encryption.ContentKey.Algorithm);
            debug(this.Encryption.UserKey.Algorithm);

            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject("Incorrect LCP fields.");
        }

        if (this._usesNativeNodePlugin) {

            const crlPem = await this.getCRLPem();

            return new Promise<void>((resolve, reject) => {

                this._lcpNative.findOneValidPassphrase(
                    this.JsonSource,
                    lcpUserKeys,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (err: any, validHashedPassphrase: any) => {
                        if (err) {
                            debug("findOneValidPassphrase ERROR");
                            debug(err);
                            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                            reject(err);
                            return;
                        }
                        // debug(validHashedPassphrase);

                        this._lcpNative.createContext(
                            this.JsonSource,
                            validHashedPassphrase,
                            crlPem,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (erro: any, context: any) => {
                                if (erro) {
                                    debug("createContext ERROR");
                                    debug(erro);
                                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                                    reject(erro);
                                    return;
                                }

                                // debug(context);
                                this._lcpContext = context;

                                // const userKey = Buffer.from(this.userPassphraseHex as string, "hex");
                                // const buff = Buffer.from(context.encryptedContentKey, "hex");
                                // const iv = buff.slice(0, AES_BLOCK_SIZE);
                                // const encrypted = buff.slice(AES_BLOCK_SIZE);
                                // const decryptStream = crypto.createDecipheriv("aes-256-cbc",
                                //     userKey,
                                //     iv);
                                // decryptStream.setAutoPadding(false);
                                // const decryptedContent = decryptStream.update(encrypted);
                                // const nPadding = decryptedContent[decryptedContent.length - 1];
                                // const size = decryptedContent.length - nPadding;
                                // this.ContentKey = decryptedContent.slice(0, size); // .toString("binary");

                                // this._lcpNative.decrypt(
                                //     context,
                                //     buff,
                                //     (er: any, decryptedContent: any) => {
                                //         if (er) {
                                //             debug(er);
                                //             resolve(false);
                                //             return;
                                //         }
                                //         const padding = decryptedContent[decryptedContent.length - 1];
                                //         this.ContentKey = Buffer.from(
                                //             decryptedContent,
                                //             0,
                                //             decryptedContent.length - padding);
                                //         resolve(true);
                                //     },
                                // );

                                resolve();
                            },
                        );
                    },
                );
            });
        }

        for (const lcpUserKey of lcpUserKeys) {
            try {
                if (this.tryUserKey(lcpUserKey)) {
                    return Promise.resolve();
                }
            } catch (_err) {
                // debug(err);
                // ignore
            }
        }
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(1); // "Passphrase fail."
    }

    private async getCRLPem(): Promise<string> {

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new Promise<any>(async (resolve, reject) => {

            const crlURL = CRL_URL;

            // Instead of using the hard-coded URLs,
            // instead we can discover the CRL distribution points from the certificates:
            // if (this.Encryption && this.Encryption.Profile && this.Signature && this.Signature.Certificate) {
                // This gives CRL_URL_ALT (ARL, not CRL)
                // const certPEM: string | undefined =
                //     (this.Encryption.Profile === "http://readium.org/lcp/profile-1.0") ?
                //         LCPCertificateProdProfile :
                //     (this.Encryption.Profile === "http://readium.org/lcp/basic-profile") ?
                //         LCPCertificateBasicProfile :
                //     undefined;

                // const certBase64 = this.Signature.Certificate;
                // debug(certBase64);
                // const certPEM = "-----BEGIN CERTIFICATE-----\n" +
                //     (certBase64.match(/.{0,64}/g) as RegExpMatchArray).join("\n") +
                //     "-----END CERTIFICATE-----";
                // debug(certPEM);

                // --------------------------------
                // WITH sshpk (works, although the recursive extraction from the CRL extension is a bit strange)
                // import { parseCertificate } from "sshpk";
                // const certDER = Buffer.from(certBase64, "base64");
                // // debug(certFromBase64.toString("hex"));
                // const cert = parseCertificate(certDER, "x509");
                // // const cert = parseCertificate(certPEM, "pem");
                // debug(cert);
                // const exts = (cert as any).getExtensions(); // incorrect TypeScript Typings :(
                // debug(exts);
                // // CRL Distribution Points === 2.5.29.31 === id_ce_CRLDistributionPoints
                // const ext = (cert as any).getExtension("2.5.29.31"); // incorrect TypeScript Typings :(
                // debug(ext);
                // const buff = forge.util.createBuffer(ext.data, "binary");
                // // const buff = Buffer.from(ext.data).toString("binary");
                // const certAsn1 = forge.asn1.fromDer(buff);
                // // debug(certAsn1);
                // console.log(util.inspect(certAsn1,
                // tslint:disable-next-line:max-line-length
                //     { breakLength: 1000, maxArrayLength: 1000, showHidden: false, depth: 1000, colors: true, customInspect: false }));
                // function extractCrlUrl(val: any): string | undefined {
                //     if (!val) {
                //         return undefined;
                //     }
                //     if (typeof val === "string") {
                //         return val;
                //     }
                //     if (val instanceof Array) {
                //         for (const v of val) {
                //             const ex = extractCrlUrl(v);
                //             if (ex) {
                //                 return ex;
                //             }
                //         }
                //     }
                //     if (typeof val === "object") {
                //         return extractCrlUrl(val.value);
                //     }
                //     return undefined;
                // }
                // const crlURL_ = extractCrlUrl(certAsn1.value);
                // debug(crlURL_);

                // --------------------------------
                // WITH forge (problem: ECDSA not supported, fails at forge.pki.certificateFromAsn1())
                // import * as forge from "node-forge";
                // const certDER = forge.util.decode64(certBase64);
                // // debug(forge.util.bytesToHex(certDER));
                // const certAsn1 = forge.asn1.fromDer(certDER);
                // debug(certAsn1);
                // if (certAsn1) {
                //     try {
                //         // const cert = forge.pki.certificateFromPem(certPEM);
                //         const cert = forge.pki.certificateFromAsn1(certAsn1); // FAILS WITH ECDSA
                //         // const certPEM = forge.pki.certificateToPem(cert);
                //         // debug(certPEM);
                //         const extDistributionPoints = cert.extensions.find((ext) => {
                //             if (ext.name === "cRLDistributionPoints") {
                //                 return true;
                //             }
                //             return false;
                //         });
                //         debug(extDistributionPoints);
                //         if (extDistributionPoints && extDistributionPoints.value) {
                //             const iHTTP = extDistributionPoints.value.indexOf("http");
                //             const urlStr = extDistributionPoints.value.substr(iHTTP);
                //             const url = new URL(urlStr);
                //             const crlURL_ = url.toString();
                //             debug("crlURL_");
                //             debug(crlURL_);
                //         }
                //     } catch (err) {
                //         debug(err);
                //     }
                // }

                // --------------------------------
                // WITH pkijs (does pass runtime, hard to integrate in TypeScript with NodeJS imports)
                // import { fromBER } from "asn1js";
                // import Certificate from "pkijs/src/Certificate";
                // const asn1 = fromBER(certDER.buffer);
                // const certificate = new Certificate({ schema: asn1.result });
                // debug(certificate);
            // }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const failure = (err: any) => {
                // // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                // reject(err);
                debug(err);
                resolve(DUMMY_CRL);
            };

            const success = async (response: request.RequestResponse) => {

                if (IS_DEV) {
                    Object.keys(response.headers).forEach((header: string) => {
                        debug(header + " => " + response.headers[header]);
                    });
                }

                if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                    let failBuff: Buffer;
                    try {
                        failBuff = await streamToBufferPromise(response);
                    } catch (buffErr) {
                        if (IS_DEV) {
                            debug(buffErr);
                        }
                        failure(response.statusCode);
                        return;
                    }
                    try {
                        const failStr = failBuff.toString("utf8");
                        if (IS_DEV) {
                            debug(failStr);
                        }
                        try {
                            const failJson = global.JSON.parse(failStr);
                            if (IS_DEV) {
                                debug(failJson);
                            }
                            failJson.httpStatusCode = response.statusCode;
                            failure(failJson);
                        } catch (jsonErr) {
                            if (IS_DEV) {
                                debug(jsonErr);
                            }
                            failure({ httpStatusCode: response.statusCode, httpResponseBody: failStr });
                        }
                    } catch (strErr) {
                        if (IS_DEV) {
                            debug(strErr);
                        }
                        failure(response.statusCode);
                    }
                    return;
                }

                let responseData: Buffer;
                try {
                    responseData = await streamToBufferPromise(response);
                } catch (err) {
                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                    reject(err);
                    return;
                }

                const lcplStr = "-----BEGIN X509 CRL-----\n" +
                    responseData.toString("base64") + "\n-----END X509 CRL-----";
                if (IS_DEV) {
                    debug(lcplStr);
                }
                resolve(lcplStr);
            };

            const headers = {
                // "Accept": "application/json,application/xml",
                // "Accept-Language": "en-UK,en-US;q=0.7,en;q=0.5",
            };

            // // No response streaming! :(
            // // https://github.com/request/request-promise/issues/90
            // const needsStreamingResponse = true;
            // if (needsStreamingResponse) {
                request.get({
                    headers,
                    method: "GET",
                    timeout: 2000,
                    uri: crlURL,
                })
                    .on("response", async (res) => {
                        try {
                            await success(res);
                        }
                        catch (successError) {
                            failure(successError);
                            return;
                        }
                    })
                    .on("error", failure);
            // } else {
            //     let response: requestPromise.FullResponse;
            //     try {
            //         // tslint:disable-next-line:await-promise no-floating-promises
            //         response = await requestPromise({
            //             headers,
            //             method: "GET",
            //             resolveWithFullResponse: true,
            //             uri: crlURL,
            //         });
            //     } catch (err) {
            //         failure(err);
            //         return;
            //     }

            //     await success(response);
            // }
        });
    }

    private tryUserKey(lcpUserKey: string): boolean {

        // const userKey = forge.util.hexToBytes(passPhrase);
        const userKey = Buffer.from(lcpUserKey, "hex");

        const keyCheck = Buffer.from(this.Encryption.UserKey.KeyCheck, "base64");
        // .toString("binary");

        // const keyCheck_ = forge.util.decode64(lcp.Encryption.UserKey.KeyCheck);
        // if (keyCheck !== keyCheck_) {
        //     debug(`ERROR LCP.Encryption.UserKey.KeyCheck base64: ${keyCheck} !== ${keyCheck_}`);
        // }
        // publication.AddToInternal("lcp_user_key_check", keyCheck);
        // debug("---LCP Encryption.UserKey.KeyCheck BASE64 decoded (forge BYTES TO HEX): "
        //     + forge.util.bytesToHex(keyCheck));

        const encryptedLicenseID = keyCheck;

        // const iv = encryptedLicenseID.substring(0, AES_BLOCK_SIZE);
        const iv = encryptedLicenseID.slice(0, AES_BLOCK_SIZE);

        // debug("=============== LCP ID");
        // debug(lcp.ID);
        // const lcpIDbuff = forge.util.createBuffer(lcp.ID, "utf8");
        // debug(lcpIDbuff.toHex());
        // debug(lcpIDbuff.toString());
        // debug(lcpIDbuff.bytes());

        // const aesCbcCipher = (forge as any).cipher.createCipher("AES-CBC", userKey);
        // aesCbcCipher.start({ iv, additionalData_: "binary-encoded string" });
        // aesCbcCipher.update(lcpIDbuff);
        // aesCbcCipher.finish();
        // debug("=============== LCP CYPHER");
        // // breakLength: 100  maxArrayLength: undefined
        // console.log(util.inspect(aesCbcCipher.output,
        //     { showHidden: false, depth: 1000, colors: true, customInspect: false }));
        // debug(aesCbcCipher.output.bytes());
        // debug(aesCbcCipher.output.toHex());
        // // debug(aesCbcCipher.output.toString());

        const encrypted = encryptedLicenseID.slice(AES_BLOCK_SIZE);

        const decrypteds: Buffer[] = [];
        const decryptStream = crypto.createDecipheriv("aes-256-cbc",
            userKey,
            iv);
        decryptStream.setAutoPadding(false);
        const buff1 = decryptStream.update(encrypted);
        // debug(buff1.toString("hex"));
        if (buff1) {
            decrypteds.push(buff1);
        }
        const buff2 = decryptStream.final();
        // debug(buff2.toString("hex"));
        if (buff2) {
            decrypteds.push(buff2);
        }
        const decrypted = Buffer.concat(decrypteds);

        const nPaddingBytes = decrypted[decrypted.length - 1];
        const size = encrypted.length - nPaddingBytes;

        const decryptedOut = decrypted.slice(0, size).toString("utf8");

        // const encrypted = encryptedLicenseID.substring(AES_BLOCK_SIZE);
        // const toDecrypt = forge.util.createBuffer(encrypted, "binary");
        // // const toDecrypt = aesCbcCipher.output;
        // const aesCbcDecipher = (forge as any).cipher.createDecipher("AES-CBC", userKey);
        // aesCbcDecipher.start({ iv, additionalData_: "binary-encoded string" });
        // aesCbcDecipher.update(toDecrypt);
        // aesCbcDecipher.finish();

        // // debug("=============== LCP DECYPHER");
        // // // breakLength: 100  maxArrayLength: undefined
        // // console.log(util.inspect(aesCbcDecipher.output,
        // //     { showHidden: false, depth: 1000, colors: true, customInspect: false }));
        // // debug(aesCbcDecipher.output.bytes());
        // // debug(aesCbcDecipher.output.toHex());
        // // // debug(aesCbcDecipher.output.toString());
        // const decryptedOut = aesCbcDecipher.output.toString();

        if (this.ID !== decryptedOut) {
            debug("Failed LCP ID check.");
            return false;
        }

        const encryptedContentKey =
            Buffer.from(this.Encryption.ContentKey.EncryptedValue, "base64");
        // .toString("binary");

        // const iv2 = encryptedContentKey.substring(0, AES_BLOCK_SIZE);
        const iv2 = encryptedContentKey.slice(0, AES_BLOCK_SIZE);

        const encrypted2 = encryptedContentKey.slice(AES_BLOCK_SIZE);

        const decrypteds2: Buffer[] = [];
        const decryptStream2 = crypto.createDecipheriv("aes-256-cbc",
            userKey,
            iv2);
        decryptStream2.setAutoPadding(false);
        const buff1_ = decryptStream2.update(encrypted2);
        // debug(buff1.toString("hex"));
        if (buff1_) {
            decrypteds2.push(buff1_);
        }
        const buff2_ = decryptStream2.final();
        // debug(buff2.toString("hex"));
        if (buff2_) {
            decrypteds2.push(buff2_);
        }
        const decrypted2 = Buffer.concat(decrypteds2);

        const nPaddingBytes2 = decrypted2[decrypted2.length - 1];
        const size2 = encrypted2.length - nPaddingBytes2;

        this.ContentKey = decrypted2.slice(0, size2); // .toString("binary");

        // const encrypted2 = encryptedContentKey.substring(AES_BLOCK_SIZE);
        // const toDecrypt2 =
        //     forge.util.createBuffer(encrypted2, "binary");
        // // const toDecrypt = aesCbcCipher.output;
        // const aesCbcDecipher2 = (forge as any).cipher.createDecipher("AES-CBC", userKey);
        // aesCbcDecipher2.start({ iv: iv2, additionalData_: "binary-encoded string" });
        // aesCbcDecipher2.update(toDecrypt2);
        // aesCbcDecipher2.finish();
        // const contentKey = Buffer.from(aesCbcDecipher2.output.bytes());

        // let userKey: string | undefined;
        // const lcpPass = this.findFromInternal("lcp_user_pass_hash");

        // if (lcpPass) {
        //     userKey = lcpPass.Value; // basic profile: user passphrase SHA256 hash digest
        // } else {
        //     const userPassPhrase = "dan"; // testing with my own WasteLand sample (LCP basic profile)
        //     const sha256 = forge.md.sha256.create();
        //     sha256.update(userPassPhrase, "utf8");
        //     const digest = sha256.digest();
        //     userKey = digest.bytes(); // 32 bytes => AES-256 key
        //     // publication.AddToInternal("lcp_user_key", userKey);
        //     // debug("---LCP user key == passphrase + SHA256 digest HEX: "
        //     //     + digest.toHex() + " // " + userKey.length);
        // }

        return true;
    }
}
