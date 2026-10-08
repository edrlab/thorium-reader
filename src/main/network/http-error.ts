// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { THttpNetworkErrorKind } from "readium-desktop/common/utils/http";

interface IErrorWithCode {
    code?: unknown;
    errno?: unknown;
    cause?: unknown;
}

const getStringCode = (error: unknown): string | undefined => {
    if (!error || typeof error !== "object") {
        return undefined;
    }

    const { code, errno } = error as IErrorWithCode;
    if (typeof code === "string" && code) {
        return code;
    }
    if (typeof errno === "string" && errno) {
        return errno;
    }
    return undefined;
};

/**
 * Extracts the machine-readable error code exposed by Node.js, node-fetch, or
 * the wrapped system error. The human-readable error message is intentionally
 * not inspected because its wording is not a stable API.
 *
 * @see https://nodejs.org/download/release/latest-v22.x/docs/api/errors.html#class-systemerror
 * @see https://github.com/node-fetch/node-fetch/blob/main/docs/ERROR-HANDLING.md
 */
export const getHttpNetworkErrorCode = (error: unknown): string | undefined => {
    const directCode = getStringCode(error);
    if (directCode) {
        return directCode;
    }

    const cause = error && typeof error === "object"
        ? (error as IErrorWithCode).cause
        : undefined;
    return getStringCode(cause);
};

/**
 * Identifies Node.js / OpenSSL certificate-validation error codes. These codes
 * are a security boundary: they must never permit an automatic HTTPS-to-HTTP
 * downgrade.
 *
 * OpenSSL defines verification constants with the `X509_V_ERR_` prefix, while
 * Node.js commonly exposes short forms such as `CERT_HAS_EXPIRED` through
 * `error.code`. The matcher accepts both representations.
 *
 * @see https://nodejs.org/download/release/v24.20.0/docs/api/errors.html#openssl-error-codes
 * @see https://nodejs.org/download/release/v24.20.0/docs/api/errors.html#err_tls_cert_altname_invalid
 * @see https://docs.openssl.org/3.5/man3/X509_STORE_CTX_get_error/
 * @see https://github.com/openssl/openssl/blob/master/include/openssl/x509_vfy.h.in
 */
export const isTlsCertificateValidationErrorCode = (errorCode: string | undefined): boolean => {
    if (!errorCode) {
        return false;
    }

    return /^(?:ERR_TLS_CERT_|ERR_OSSL_X509_|X509_V_ERR_|CERT_|CRL_|DEPTH_ZERO_SELF_SIGNED_CERT$|SELF_SIGNED_CERT_IN_CHAIN$|HOSTNAME_MISMATCH$|UNABLE_TO_(?:GET_ISSUER_CERT|GET_CRL|DECRYPT_CERT_SIGNATURE|DECRYPT_CRL_SIGNATURE|DECODE_ISSUER_PUBLIC_KEY|VERIFY_LEAF_SIGNATURE))/i.test(errorCode);
};

const DNS_ERROR_CODES = new Set([
    "EAI_AGAIN",
    "EAI_FAIL",
    "ENODATA",
    "ENOTFOUND",
]);

// https://nodejs.org/download/release/latest-v22.x/docs/api/errors.html#common-system-errors
const CONNECTION_ERROR_CODES = new Set([
    "ECONNREFUSED",
    "ECONNRESET",
    "EHOSTDOWN",
    "EHOSTUNREACH",
    "ENETDOWN",
    "ENETUNREACH",
    "EPIPE",
    "EPROTO",
    "ESOCKETTIMEDOUT",
    "ETIMEDOUT",
    "ERR_SOCKET_CLOSED",
    "ERR_SSL_HTTP_REQUEST",
    "ERR_SSL_UNKNOWN_PROTOCOL",
    "ERR_SSL_WRONG_VERSION_NUMBER",
    "UND_ERR_CONNECT_TIMEOUT",
    "UND_ERR_SOCKET",
]);

export const getHttpNetworkErrorKind = (
    errorCode: string | undefined,
    isTimeout: boolean,
): THttpNetworkErrorKind => {
    if (isTimeout) {
        return "timeout";
    }
    if (isTlsCertificateValidationErrorCode(errorCode)) {
        return "tls-certificate";
    }
    if (errorCode && DNS_ERROR_CODES.has(errorCode.toUpperCase())) {
        return "dns";
    }
    if (errorCode && CONNECTION_ERROR_CODES.has(errorCode.toUpperCase())) {
        return "connection";
    }
    return "unknown";
};
