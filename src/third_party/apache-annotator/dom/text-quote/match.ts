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

import type { Matcher, TextQuoteSelector } from "../../selector/types";
import { textQuoteSelectorMatcher as abstractTextQuoteSelectorMatcher } from "../../selector/text/match-text-quote";
import { TextNodeChunker, EmptyScopeError } from "../text-node-chunker";

/**
 * Find occurrences in a text matching the given {@link
 * TextQuoteSelector}.
 *
 * This performs an exact search for the selector’s quote (including prefix and
 * suffix) within the text contained in the given scope (a  {@link
 * https://developer.mozilla.org/en-US/docs/Web/API/Range | Range}).
 *
 * Note the match is based on strict character-by-character equivalence, i.e.
 * it is sensitive to whitespace, capitalisation, etc.
 *
 * The function is curried, taking first the selector and then the scope.
 *
 * As there may be multiple matches for a given selector (when its prefix and
 * suffix attributes are not sufficient to disambiguate it), the matcher will
 * return an (async) generator that produces each match in the order they are
 * found in the text.
 *
 * *XXX Modifying the DOM (e.g. to highlight the text) while the search is still
 * running can mess up and result in an error or an infinite loop. See [issue
 * #112](https://github.com/apache/incubator-annotator/issues/112).*
 *
 * @example
 * ```
 * // Find the word ‘banana’.
 * const selector = { type: 'TextQuoteSelector', exact: 'banana' };
 * const scope = document.body;
 *
 * // Read all matches.
 * const matches = textQuoteSelectorMatcher(selector)(scope);
 * for await (match of matches) console.log(match);
 * // ⇒ Range { startContainer: #text, startOffset: 187, endContainer: #text,
 * //   endOffset: 193, … }
 * // ⇒ Range { startContainer: #text, startOffset: 631, endContainer: #text,
 * //   endOffset: 637, … }
 * ```
 *
 * @param selector - The {@link TextQuoteSelector} to be anchored.
 * @returns A {@link Matcher} function that applies `selector` within a given
 * `scope`.
 *
 * @public
 */
export function createTextQuoteSelectorMatcher(
  selector: TextQuoteSelector,
): Matcher<Node | Range, Range> {
  const abstractMatcher = abstractTextQuoteSelectorMatcher(selector);

  return async function* matchAll(scope) {
    let textChunks;
    try {
      textChunks = new TextNodeChunker(scope);
    } catch (err) {
      // An empty range contains no matches.
      if (err instanceof EmptyScopeError) return;
      else throw err;
    }

    for await (const abstractMatch of abstractMatcher(textChunks)) {
      yield textChunks.chunkRangeToRange(abstractMatch);
    }
  };
}
