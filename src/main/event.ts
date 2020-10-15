// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { channel } from "redux-saga";

const openFileFromCliChannel = channel<string>();

export const getOpenFileFromCliChannel = () => openFileFromCliChannel;

const openTitleFromCliChannel = channel<string>();

export const getOpenTitleFromCliChannel = () => openTitleFromCliChannel;

const openUrlFromMacEventChannel = channel<string>();

export const getOpenUrlFromMacEventChannel = () => openUrlFromMacEventChannel;
