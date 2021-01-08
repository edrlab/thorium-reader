// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { OPDSAuthenticationDoc } from "r2-opds-js/dist/es6-es2015/src/opds/opds2/opds2-authentication-doc";
import { channel } from "redux-saga";

const openFileFromCliChannel = channel<string>();

export const getOpenFileFromCliChannel = () => openFileFromCliChannel;

const openTitleFromCliChannel = channel<string>();

export const getOpenTitleFromCliChannel = () => openTitleFromCliChannel;

const openUrlFromMacEventChannel = channel<string>();

export const getOpenUrlFromMacEventChannel = () => openUrlFromMacEventChannel;

//
// OPDS2 authentication
//

export type TOpdsAuthenticationChannel = [doc: OPDSAuthenticationDoc, baseUrl: string];

const opdsAuthenticationChannel = channel<TOpdsAuthenticationChannel>();

export const getOpdsAuthenticationChannel = () => opdsAuthenticationChannel;
