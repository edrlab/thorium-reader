// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import { marked as markedOrigin } from "marked";
import { markedEmoji, MarkedEmojiOptions } from "marked-emoji";
import { emojis } from "./emojis";

const options: MarkedEmojiOptions<string> = {
	emojis,
	renderer: (token) => token.emoji,
};

export const marked = markedOrigin.use(markedEmoji(options));
