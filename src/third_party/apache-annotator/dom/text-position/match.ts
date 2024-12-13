/**
 * @license
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-FileCopyrightText: The Apache Software Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Matcher, TextPositionSelector } from "../../selector/types.js";
import { textPositionSelectorMatcher as abstractTextPositionSelectorMatcher } from "../../selector/text/match-text-position.js";
import { TextNodeChunker } from "../text-node-chunker.js";

/**
 * Find the range of text corresponding to the given {@link
 * TextPositionSelector}.
 *
 * The start and end positions are measured relative to the first text character
 * in the given scope.
 *
 * The function is curried, taking first the selector and then the scope.
 *
 * Its end result is an (async) generator producing a single {@link https://developer.mozilla.org/en-US/docs/Web/API/Range
 * | Range} to represent the match (unlike e.g. a {@link TextQuoteSelector}, a
 * TextPositionSelector cannot have multiple matches).
 *
 * @example
 * ```
 * const selector = { type: 'TextPositionSelector', start: 702, end: 736 };
 * const scope = document.body;
 * const matches = textQuoteSelectorMatcher(selector)(scope);
 * const match = (await matches.next()).value;
 * // ⇒ Range { startContainer: #text, startOffset: 64, endContainer: #text,
 * //   endOffset: 98, … }
 * ```
 *
 * @param selector - The {@link TextPositionSelector} to be anchored.
 * @returns A {@link Matcher} function that applies `selector` within a given
 * `scope`.
 *
 * @public
 */
export function createTextPositionSelectorMatcher(
  selector: TextPositionSelector,
): Matcher<Node | Range, Range> {
  const abstractMatcher = abstractTextPositionSelectorMatcher(selector);

  return async function* matchAll(scope) {
    const textChunks = new TextNodeChunker(scope);

    const matches = abstractMatcher(textChunks);

    for await (const abstractMatch of matches) {
      yield textChunks.chunkRangeToRange(abstractMatch);
    }
  };
}
