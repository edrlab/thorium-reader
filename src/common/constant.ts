// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";

import { app } from "electron";
const debug = debug_("readium-desktop:main");

export const ABOUT_BOOK_TITLE_PREFIX = "EDRLAB.ThoriumReader-";

export const WINDOW_MIN_WIDTH = 700;
export const WINDOW_MIN_HEIGHT = 600;

export const WINDOW_DEFAULT_WIDTH = 1024;
export const WINDOW_DEFAULT_HEIGHT = 768;

export const FORCE_PROD_DB_IN_DEV = false;

export const USER_DATA_FOLDER = app.getPath("userData");
debug("set userData folder to", USER_DATA_FOLDER);

export const TIMEOUT_BROWSER_WINDOW_INITIALISATION = 20000;
