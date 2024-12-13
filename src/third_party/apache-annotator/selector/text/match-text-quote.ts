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

import type { TextQuoteSelector } from "../types.js";
import type { Chunk, Chunker, ChunkRange } from "./chunker.js";

/**
 * Find occurrences in a text matching the given {@link TextQuoteSelector}.
 *
 * This performs an exact search the selector’s quote (including prefix and
 * suffix) within the given text.
 *
 * Note the match is based on strict character-by-character equivalence, i.e.
 * it is sensitive to whitespace, capitalisation, etc.
 *
 * This is an abstract implementation of the function’s logic, which expects a
 * generic {@link Chunker} to represent the text, and returns an (async)
 * generator of {@link ChunkRange}s to represent the matches.
 *
 * See {@link dom.createTextQuoteSelectorMatcher} for a
 * wrapper around this implementation which applies it to the text of an HTML
 * DOM.
 *
 * The function is curried, taking first the selector and then the text.
 *
 * As there may be multiple matches for a given selector (when its prefix and
 * suffix attributes are not sufficient to disambiguate it), the matcher will
 * return an (async) generator that produces each match in the order they are
 * found in the text.
 *
 * *XXX Modifying the Chunks while the search is still running can mess up and
 * result in an error or an infinite loop. See [issue #112](https://github.com/apache/incubator-annotator/issues/112).*
 *
 * @example
 * ```
 * const selector = { type: 'TextQuoteSelector', exact: 'banana' };
 * const matches = textQuoteSelectorMatcher(selector)(textChunks);
 * for await (match of matches) console.log(match);
 * // ⇒ { startChunk: { … }, startIndex: 187, endChunk: { … }, endIndex: 193 }
 * // ⇒ { startChunk: { … }, startIndex: 631, endChunk: { … }, endIndex: 637 }
 * ```
 *
 * @param selector - The {@link TextQuoteSelector} to be anchored
 * @returns a {@link Matcher} function that applies `selector` to a given text
 *
 * @public
 */
export function textQuoteSelectorMatcher(
  selector: TextQuoteSelector,
): <TChunk extends Chunk<any>>(
  scope: Chunker<TChunk>,
) => AsyncGenerator<ChunkRange<TChunk>, void, void> {
  return async function* matchAll<TChunk extends Chunk<string>>(
    textChunks: Chunker<TChunk>,
  ) {
    const exact = selector.exact;
    const prefix = selector.prefix || "";
    const suffix = selector.suffix || "";
    const searchPattern = prefix + exact + suffix;

    // The code below essentially just performs string.indexOf(searchPattern),
    // but on a string that is chopped up in multiple chunks. It runs a loop
    // containing three steps:
    // 1. Continue checking any partial matches from the previous chunk(s).
    // 2. Try find the whole pattern in the chunk (possibly multiple times).
    // 3. Check if this chunk ends with a partial match (or even multiple partial matches).

    interface PartialMatch {
      startChunk?: TChunk;
      startIndex?: number;
      endChunk?: TChunk;
      endIndex?: number;
      charactersMatched: number;
    }
    let partialMatches: PartialMatch[] = [];

    let isFirstChunk = true;
    do {
      const chunk = textChunks.currentChunk;
      const chunkValue = chunk.data;

      // 1. Continue checking any partial matches from the previous chunk(s).
      const remainingPartialMatches: typeof partialMatches = [];
      for (const partialMatch of partialMatches) {
        const charactersMatched = partialMatch.charactersMatched;

        // If the current chunk contains the start and/or end of the match, record these.
        if (partialMatch.endChunk === undefined) {
          const charactersUntilMatchEnd =
            prefix.length + exact.length - charactersMatched;
          if (charactersUntilMatchEnd <= chunkValue.length) {
            partialMatch.endChunk = chunk;
            partialMatch.endIndex = charactersUntilMatchEnd;
          }
        }
        if (partialMatch.startChunk === undefined) {
          const charactersUntilMatchStart = prefix.length - charactersMatched;
          if (
            charactersUntilMatchStart < chunkValue.length ||
            partialMatch.endChunk !== undefined // handles an edge case: an empty quote at the end of a chunk.
          ) {
            partialMatch.startChunk = chunk;
            partialMatch.startIndex = charactersUntilMatchStart;
          }
        }

        const charactersUntilSuffixEnd =
          searchPattern.length - charactersMatched;
        if (charactersUntilSuffixEnd <= chunkValue.length) {
          if (
            chunkValue.startsWith(searchPattern.substring(charactersMatched))
          ) {
            yield partialMatch as ChunkRange<TChunk>; // all fields are certainly defined now.
          }
        } else if (
          chunkValue ===
          searchPattern.substring(
            charactersMatched,
            charactersMatched + chunkValue.length,
          )
        ) {
          // The chunk is too short to complete the match; comparison has to be completed in subsequent chunks.
          partialMatch.charactersMatched += chunkValue.length;
          remainingPartialMatches.push(partialMatch);
        }
      }
      partialMatches = remainingPartialMatches;

      // 2. Try find the whole pattern in the chunk (possibly multiple times).
      if (searchPattern.length <= chunkValue.length) {
        let fromIndex = 0;
        while (fromIndex <= chunkValue.length) {
          const patternStartIndex = chunkValue.indexOf(
            searchPattern,
            fromIndex,
          );
          if (patternStartIndex === -1) break;
          fromIndex = patternStartIndex + 1;

          // Handle edge case: an empty searchPattern would already have been yielded at the end of the last chunk.
          if (
            patternStartIndex === 0 &&
            searchPattern.length === 0 &&
            !isFirstChunk
          )
            continue;

          yield {
            startChunk: chunk,
            startIndex: patternStartIndex + prefix.length,
            endChunk: chunk,
            endIndex: patternStartIndex + prefix.length + exact.length,
          };
        }
      }

      // 3. Check if this chunk ends with a partial match (or even multiple partial matches).
      let newPartialMatches: number[] = [];
      const searchStartPoint = Math.max(
        chunkValue.length - searchPattern.length + 1,
        0,
      );
      for (let i = searchStartPoint; i < chunkValue.length; i++) {
        const character = chunkValue[i];
        newPartialMatches = newPartialMatches.filter(
          (partialMatchStartIndex) =>
            character === searchPattern[i - partialMatchStartIndex],
        );
        if (character === searchPattern[0]) newPartialMatches.push(i);
      }
      for (const partialMatchStartIndex of newPartialMatches) {
        const charactersMatched = chunkValue.length - partialMatchStartIndex;
        const partialMatch: PartialMatch = {
          charactersMatched,
        };
        if (charactersMatched >= prefix.length + exact.length) {
          partialMatch.endChunk = chunk;
          partialMatch.endIndex =
            partialMatchStartIndex + prefix.length + exact.length;
        }
        if (
          charactersMatched > prefix.length ||
          partialMatch.endChunk !== undefined // handles an edge case: an empty quote at the end of a chunk.
        ) {
          partialMatch.startChunk = chunk;
          partialMatch.startIndex = partialMatchStartIndex + prefix.length;
        }
        partialMatches.push(partialMatch);
      }

      isFirstChunk = false;
    } while (textChunks.nextChunk() !== null);
  };
}
