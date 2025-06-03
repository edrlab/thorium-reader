// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export const THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL = "thoriumhttps";

export const THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_STREAMER = "0.0.0.0";
// SHOULD be identical, see headers.referer assignment in streamProtocolHandler() in main/streamer/streamerNoHttp.ts
export const THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_EXTRACT_PDF = THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_STREAMER;
export const THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_PUB_NOTES = THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_STREAMER;

export const OPDS_MEDIA_SCHEME = "opds-media";
export const OPDS_MEDIA_SCHEME__IP_ORIGIN_OPDS_MEDIA = "0.0.0.0";
// MUST be identical, see schemePrefix filtering in opdsRequestMediaFlow() in main/redux/sagas/auth.ts
export const OPDS_MEDIA_SCHEME__IP_ORIGIN_COVER_IMG = OPDS_MEDIA_SCHEME__IP_ORIGIN_OPDS_MEDIA;
