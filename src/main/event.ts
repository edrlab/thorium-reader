// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { channel } from "redux-saga";

import { OPDSAuthenticationDoc } from "@r2-opds-js/opds/opds2/opds2-authentication-doc";

const openFileFromCliChannel = channel<string>();

export const getOpenFileFromCliChannel = () => openFileFromCliChannel;

const openTitleFromCliChannel = channel<string>();

export const getOpenTitleFromCliChannel = () => openTitleFromCliChannel;

const openUrlWithThoriumSchemeFromMacEventChannel = channel<string>();

export const getOpenUrlWithThoriumSchemeFromMacEventChannel = () => openUrlWithThoriumSchemeFromMacEventChannel;

const openUrlWithOpdsSchemeEventChannel = channel<string>();

export const getOpenUrlWithOpdsSchemeEventChannel = () => openUrlWithOpdsSchemeEventChannel;

//
// OPDS2 authentication
//

export type TOpdsAuthenticationChannel = [doc: OPDSAuthenticationDoc, baseUrl: string];

const opdsAuthenticationChannel = channel<TOpdsAuthenticationChannel>();

export const getOpdsAuthenticationChannel = () => opdsAuthenticationChannel;

const opdsNewCatalogsStringUrlChannel = channel<string>();

export const getOpdsNewCatalogsStringUrlChannel = () => opdsNewCatalogsStringUrlChannel;

