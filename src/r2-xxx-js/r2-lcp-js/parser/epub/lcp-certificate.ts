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

export const DUMMY_CRL = `-----BEGIN X509 CRL-----
MIICrTCBljANBgkqhkiG9w0BAQQFADBnMQswCQYDVQQGEwJGUjEOMAwGA1UEBxMF
UGFyaXMxDzANBgNVBAoTBkVEUkxhYjESMBAGA1UECxMJTENQIFRlc3RzMSMwIQYD
VQQDExpFRFJMYWIgUmVhZGl1bSBMQ1AgdGVzdCBDQRcNMTcwOTI2MTM1NTE1WhcN
MjcwOTI0MTM1NTE1WjANBgkqhkiG9w0BAQQFAAOCAgEA27f50xnlaKGUdqs6u6rD
WsR75z+tZrH4J2aA5E9I/K5fNe20FftQZb6XNjVQTNvawoMW0q+Rh9dVjDnV5Cfw
ptchu738ZQr8iCOLQHvIM6wqQj7XwMqvyNaaeGMZxfRMGlx7T9DOwvtWFCc5X0ik
YGPPV19CFf1cas8x9Y3LE8GmCtX9eUrotWLKRggG+qRTCri/SlaoicfzqhViiGeL
dW8RpG/Q6ox+tLHti3fxOgZarMgMbRmUa6OTh8pnxrfnrdtD2PbwACvaEMCpNCZR
aSTMRmIxw8UUbUA/JxDIwyISGn3ZRgbFAglYzaX80rSQZr6e0bFlzHl1xZtZ0Raz
GQWP9vvfH5ESp6FsD98g//VYigatoPz/EKU4cfP+1W/Zrr4jRSBFB37rxASXPBcx
L8cerb9nnRbAEvIqxnR4e0ZkhMyqIrLUZ3Jva0fC30kdtp09/KJ22mXKBz85wUQa
7ihiSz7pov0R9hpY93fvt++idHBECRNGOeBC4wRtGxpru8ZUa0/KFOD0HXHMQDwV
cIa/72T0okStOqjIOcWflxl/eAvUXwtet9Ht3o9giSl6hAObAeleMJOB37Bq9ASf
h4w7d5he8zqfsCGjaG1OVQNWVAGxQQViWVysfcJohny4PIVAc9KkjCFa/QrkNGjr
kUiV/PFCwL66iiF666DrXLY=
-----END X509 CRL-----`;
