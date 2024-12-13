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

import type { TextPositionSelector } from '../types.js';
import type { Chunk, ChunkRange, Chunker } from './chunker.js';
import { CodePointSeeker } from './code-point-seeker.js';
import { TextSeeker } from './seeker.js';

/**
 * Find the range of text corresponding to the given {@link TextPositionSelector}.
 *
 * This is an abstract implementation of the function’s logic, which expects a
 * generic {@link Chunker} to represent the text, and returns an (async)
 * generator producing a single {@link ChunkRange} to represent the match.
 * (unlike e.g. TextQuoteSelector, it cannot result in multiple matches).
 *
 * See {@link dom.createTextPositionSelectorMatcher} for a
 * wrapper around this implementation which applies it to the text of an HTML
 * DOM.
 *
 * The function is curried, taking first the selector and then the text.
 *
 * @example
 * ```
 * const selector = { type: 'TextPositionSelector', start: 702, end: 736 };
 * const matches = textPositionSelectorMatcher(selector)(textChunks);
 * const match = (await matches.next()).value;
 * console.log(match);
 * // ⇒ { startChunk: { … }, startIndex: 64, endChunk: { … }, endIndex: 98 }
 * ```
 *
 * @param selector - the {@link TextPositionSelector} to be anchored
 * @returns a {@link Matcher} function that applies `selector` to a given text
 *
 * @public
 */
export function textPositionSelectorMatcher(
  selector: TextPositionSelector,
): <TChunk extends Chunk<any>>(
  scope: Chunker<TChunk>,
) => AsyncGenerator<ChunkRange<TChunk>, void, void> {
  const { start, end } = selector;

  return async function* matchAll<TChunk extends Chunk<string>>(
    textChunks: Chunker<TChunk>,
  ) {
    const codeUnitSeeker = new TextSeeker(textChunks);
    const codePointSeeker = new CodePointSeeker(codeUnitSeeker);

    codePointSeeker.seekTo(start);
    const startChunk = codeUnitSeeker.currentChunk;
    const startIndex = codeUnitSeeker.offsetInChunk;
    codePointSeeker.seekTo(end);
    const endChunk = codeUnitSeeker.currentChunk;
    const endIndex = codeUnitSeeker.offsetInChunk;

    yield { startChunk, startIndex, endChunk, endIndex };
  };
}
