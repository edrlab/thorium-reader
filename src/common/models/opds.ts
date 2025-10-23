// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

const salt = crypto.randomBytes(16).toString("hex");
export const OPDS_AUTH_ENCRYPTION_KEY_BUFFER = crypto.pbkdf2Sync(uuidv4(), salt, 1000, 32, "sha256");
export const OPDS_AUTH_ENCRYPTION_KEY_HEX = OPDS_AUTH_ENCRYPTION_KEY_BUFFER.toString("hex");

const AES_BLOCK_SIZE = 16;
export const OPDS_AUTH_ENCRYPTION_IV_BUFFER = Buffer.from(uuidv4()).slice(0, AES_BLOCK_SIZE);
export const OPDS_AUTH_ENCRYPTION_IV_HEX = OPDS_AUTH_ENCRYPTION_IV_BUFFER.toString("hex");

export interface OpdsFeed {
    identifier?: string;
    title: string;
    url: string;
    authenticationUrl?: string;
    favorite?: boolean;
}
