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

import type {
  TextQuoteSelector,
} from "../../selector/types.js";
import { describeTextQuote as abstractDescribeTextQuote, type DescribeTextQuoteOptions } from "../../selector/text/describe-text-quote.js";
import { ownerDocument } from "../owner-document.js";
import { TextNodeChunker } from "../text-node-chunker.js";
import { toRange } from "../to-range.js";

/**
 * Returns a {@link TextQuoteSelector} that unambiguously describes the given
 * range of text, within the given scope.
 *
 * The selector will contain the *exact* target quote, and in case this quote
 * appears multiple times in the text, sufficient context around the quote will
 * be included in the selector’s *prefix* and *suffix* attributes to
 * disambiguate. By default, more prefix and suffix are included than strictly
 * required; both in order to be robust against slight modifications, and in an
 * attempt to not end halfway a word (mainly for the sake of human readability).
 *
 * @example
 * ```
 * const target = window.getSelection().getRangeAt(0);
 * const selector = await describeTextQuote(target);
 * console.log(selector);
 * // {
 * //   type: 'TextQuoteSelector',
 * //   exact: 'ipsum',
 * //   prefix: 'Lorem ',
 * //   suffix: ' dolor'
 * // }
 * ```
 *
 * @param range - The {@link https://developer.mozilla.org/en-US/docs/Web/API/Range
 * | Range} whose text content will be described
 * @param scope - A Node or Range that serves as the ‘document’ for purposes of
 * finding occurrences and determining prefix and suffix. Defaults to the full
 * Document that contains `range`.
 * @param options - Options to fine-tune the function’s behaviour.
 * @returns The selector unambiguously describing `range` within `scope`.
 *
 * @public
 */
export async function describeTextQuote(
  range: Range,
  scope?: Node | Range,
  options: DescribeTextQuoteOptions = {},
): Promise<TextQuoteSelector> {
  const scopeAsRange = toRange(scope ?? ownerDocument(range));

  const chunker = new TextNodeChunker(scopeAsRange);

  return await abstractDescribeTextQuote(
    chunker.rangeToChunkRange(range),
    () => new TextNodeChunker(scopeAsRange),
    options,
  );
}
