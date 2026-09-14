// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// see https://github.com/readium/r2-testapp-swift/issues/220

// Certificate Revocation List (CRL)
export const CRL_URL = "http://crl.edrlab.telesec.de/rl/EDRLab_CA.crl";
// curl http://crl.edrlab.telesec.de/rl/EDRLab_CA.crl -s | openssl crl -inform DER -text -noout

// Authority Revocation List (ARL)
export const CRL_URL_ALT = "http://crl.edrlab.telesec.de/rl/Readium_LCP_Root_CA.crl";
// curl http://crl.edrlab.telesec.de/rl/Readium_LCP_Root_CA.crl -s | openssl crl -inform DER -text -noout

/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// run this at each new build to update the CRL:
node -e "const url='http://crl.edrlab.telesec.de/rl/EDRLab_CA.crl'; const tick=String.fromCharCode(96); const now=Date.now(); fetch(url).then(async r=>{ if(!r.ok) throw new Error('HTTP '+r.status); const buf=Buffer.from(await r.arrayBuffer()); const b64=buf.toString('base64').match(/.{1,64}/g).join('\n'); console.log('// Build-time CRL fallback generated from CRL_URL on '+new Date(now).toISOString()+'.'); console.log('export const BUILD_CRL_CACHED_AT = '+now+';'); console.log('export const BUILD_CRL = '+tick+'-----BEGIN X509 CRL-----\n'+b64+'\n-----END X509 CRL-----'+tick+';'); }).catch(e=>{ console.error(e); process.exit(1); });"
*/

// Build-time CRL fallback generated from CRL_URL on 2026-09-14T09:37:19.832Z.
export const BUILD_CRL_CACHED_AT = 1789378639832;
export const BUILD_CRL = `-----BEGIN X509 CRL-----
MIICkTCCAXkCAQEwDQYJKoZIhvcNAQELBQAwQjETMBEGA1UEChMKZWRybGFiLm9y
ZzEXMBUGA1UECxMOZWRybGFiLm9yZyBMQ1AxEjAQBgNVBAMTCUVEUkxhYiBDQRcN
MjYwOTEzMTQxNzA4WhcNMjYwOTE4MTQxNzA3WjCB0DAnAgg9/PrnYyy4ABcNMjYw
ODA1MjAyMTEzWjAMMAoGA1UdFQQDCgEBMCgCCQCoPyWN9DqSBhcNMjYwNTI1MDc1
NTAwWjAMMAoGA1UdFQQDCgEGMCgCCQCwrtK1lYNPKhcNMjYwODI4MTcyNzQ1WjAM
MAoGA1UdFQQDCgEGMCcCCAD7am95HSWbFw0yNjAzMjMxMjQ1NThaMAwwCgYDVR0V
BAMKAQYwKAIJAKjr9Zx5OfipFw0yNjAyMTIxMDE0MDJaMAwwCgYDVR0VBAMKAQag
MDAuMB8GA1UdIwQYMBaAFNxc/JPkH5/usLrqUgsrylJc4MmHMAsGA1UdFAQEAgIN
/jANBgkqhkiG9w0BAQsFAAOCAQEAhHCfMKjWaIORdex9iYL2WYOK/qOyRegPa+uT
TeS6SAqFPwT8EWuo0aa9dSt2GXtMNfPEmOyxioVvhV2gfYyjbmoDyUJDlkySUAcO
c4voHAuf4wT2y1GzuvI4pQNn3KkZu35HrWBy5pMFwrBkTSRlbTtYESpWlXAezrmD
YN/kMSjDLSyan15L9r1Hkp1gKMxTluUByQW4pm1zY3MR19Gkew8RivQWt5yPUfCD
3+HMgBYMnbHmxpUPi3LyfswTiMZxNT2BHiHy6Qdg3uC25tTQs3sq5ih1ErRMuCl/
MVZZnnZh4KBBFzgcZsSFf8Kggn5SW9BUZRGN4QHuAY9Sma4fAQ==
-----END X509 CRL-----`;