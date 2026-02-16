// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import { JsonObject, JsonProperty, OnDeserialized } from "ta-json-x";

// tslint:disable-next-line:max-line-length
// https://github.com/opds-community/drafts/blob/abc6cd444e5e727b127317ecf1f0b9071ecd4272/schema/properties.schema.json#L22
export enum OPDSCurrencyEnum {
    // tslint:disable-next-line:max-line-length
    AED = "AED", AFN = "AFN", ALL = "ALL", AMD = "AMD", ANG = "ANG", AOA = "AOA", ARS = "ARS", AUD = "AUD", AWG = "AWG", AZN = "AZN", BAM = "BAM", BBD = "BBD", BDT = "BDT", BGN = "BGN", BHD = "BHD", BIF = "BIF", BMD = "BMD", BND = "BND", BOB = "BOB", BOV = "BOV", BRL = "BRL", BSD = "BSD", BTN = "BTN", BWP = "BWP", BYN = "BYN", BZD = "BZD", CAD = "CAD", CDF = "CDF", CHE = "CHE", CHF = "CHF", CHW = "CHW", CLF = "CLF", CLP = "CLP", CNY = "CNY", COP = "COP", COU = "COU", CRC = "CRC", CUC = "CUC", CUP = "CUP", CVE = "CVE", CZK = "CZK", DJF = "DJF", DKK = "DKK", DOP = "DOP", DZD = "DZD", EGP = "EGP", ERN = "ERN", ETB = "ETB", EUR = "EUR", FJD = "FJD", FKP = "FKP", GBP = "GBP", GEL = "GEL", GHS = "GHS", GIP = "GIP", GMD = "GMD", GNF = "GNF", GTQ = "GTQ", GYD = "GYD", HKD = "HKD", HNL = "HNL", HRK = "HRK", HTG = "HTG", HUF = "HUF", IDR = "IDR", ILS = "ILS", INR = "INR", IQD = "IQD", IRR = "IRR", ISK = "ISK", JMD = "JMD", JOD = "JOD", JPY = "JPY", KES = "KES", KGS = "KGS", KHR = "KHR", KMF = "KMF", KPW = "KPW", KRW = "KRW", KWD = "KWD", KYD = "KYD", KZT = "KZT", LAK = "LAK", LBP = "LBP", LKR = "LKR", LRD = "LRD", LSL = "LSL", LYD = "LYD", MAD = "MAD", MDL = "MDL", MGA = "MGA", MKD = "MKD", MMK = "MMK", MNT = "MNT", MOP = "MOP", MRU = "MRU", MUR = "MUR", MVR = "MVR", MWK = "MWK", MXN = "MXN", MXV = "MXV", MYR = "MYR", MZN = "MZN", NAD = "NAD", NGN = "NGN", NIO = "NIO", NOK = "NOK", NPR = "NPR", NZD = "NZD", OMR = "OMR", PAB = "PAB", PEN = "PEN", PGK = "PGK", PHP = "PHP", PKR = "PKR", PLN = "PLN", PYG = "PYG", QAR = "QAR", RON = "RON", RSD = "RSD", RUB = "RUB", RWF = "RWF", SAR = "SAR", SBD = "SBD", SCR = "SCR", SDG = "SDG", SEK = "SEK", SGD = "SGD", SHP = "SHP", SLL = "SLL", SOS = "SOS", SRD = "SRD", SSP = "SSP", STN = "STN", SVC = "SVC", SYP = "SYP", SZL = "SZL", THB = "THB", TJS = "TJS", TMT = "TMT", TND = "TND", TOP = "TOP", TRY = "TRY", TTD = "TTD", TWD = "TWD", TZS = "TZS", UAH = "UAH", UGX = "UGX", USD = "USD", USN = "USN", UYI = "UYI", UYU = "UYU", UZS = "UZS", VEF = "VEF", VES = "VES", VND = "VND", VUV = "VUV", WST = "WST", XAF = "XAF", XAG = "XAG", XAU = "XAU", XBA = "XBA", XBB = "XBB", XBC = "XBC", XBD = "XBD", XCD = "XCD", XDR = "XDR", XOF = "XOF", XPD = "XPD", XPF = "XPF", XPT = "XPT", XSU = "XSU", XTS = "XTS", XUA = "XUA", XXX = "XXX", YER = "YER", ZAR = "ZAR", ZMW = "ZMW", ZWL = "ZWL",
}

// tslint:disable-next-line:max-line-length
// https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/properties.schema.json#L12
@JsonObject()
export class OPDSPrice {

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/properties.schema.json#L20
    @JsonProperty("currency")
    public Currency!: string; // see CurrencyEnum

    // tslint:disable-next-line:max-line-length
    // https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/properties.schema.json#L16
    @JsonProperty("value")
    public Value!: number;

    @OnDeserialized()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: TS6133 (is declared but its value is never read.)
    protected _OnDeserialized() {
        // tslint:disable-next-line:max-line-length
        // https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/properties.schema.json#L41
        if (!this.Currency) {
            console.log("OPDSPrice.Currency is not set!");
        }
        // tslint:disable-next-line:max-line-length
        // https://github.com/opds-community/drafts/blob/2d027051a725ae62defdc7829b597564e5b8e9e5/schema/properties.schema.json#L42
        if (!this.Value) {
            console.log("OPDSPrice.Value is not set!");
        }
    }
}
