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

import type { TextQuoteSelector } from '../types.js';
import type { Chunk, Chunker, ChunkRange } from './chunker.js';
import { chunkRangeEquals } from './chunker.js';
import { textQuoteSelectorMatcher } from './match-text-quote.js';
import type { RelativeSeeker } from './seeker.js';
import { TextSeeker } from './seeker.js';

/**
 * @public
 */
export interface DescribeTextQuoteOptions {
  /**
   * Keep prefix and suffix to the minimum that is necessary to disambiguate
   * the quote. Use only if robustness against text variations is not required.
   */
  minimalContext?: boolean;

  /**
   * Add prefix and suffix to quotes below this length, such that the total of
   * `prefix + exact + suffix` is at least this length.
   */
  minimumQuoteLength?: number;

  /**
   * When attempting to find a whitespace to make the prefix/suffix start/end
   * (resp.) at a word boundary, give up after this number of characters.
   */
  maxWordLength?: number;
}

/**
 * Returns a {@link TextQuoteSelector} that points at the target quote in the
 * given text.
 *
 * The selector will contain the exact target quote. In case this quote appears
 * multiple times in the text, sufficient context around the quote will be
 * included in the selector’s `prefix` and `suffix` attributes to disambiguate.
 * By default, more prefix and suffix are included than strictly required; both
 * in order to be robust against slight modifications, and in an attempt to not
 * end halfway a word (mainly for human readability).
 *
 * This is an abstract implementation of the function’s logic, which expects a
 * generic {@link Chunker} to represent the text, and a {@link ChunkRange} to
 * represent the target.
 *
 * See {@link dom.describeTextQuote} for a wrapper around this
 * implementation which applies it to the text of an HTML DOM.
 *
 * @param target - The range of characters that the selector should describe
 * @param scope - The text containing the target range; or, more accurately, a
 * function that produces {@link Chunker}s corresponding to this text.
 * @param options - Options to fine-tune the function’s behaviour.
 * @returns The {@link TextQuoteSelector} that describes `target`.
 *
 * @public
 */
export async function describeTextQuote<TChunk extends Chunk<string>>(
  target: ChunkRange<TChunk>,
  scope: () => Chunker<TChunk>,
  options: DescribeTextQuoteOptions = {},
): Promise<TextQuoteSelector> {
  const {
    minimalContext = false,
    minimumQuoteLength = 0,
    maxWordLength = 50,
  } = options;

  // Create a seeker to read the target quote and the context around it.
  // TODO Possible optimisation: as it need not be an AbsoluteSeeker, a
  // different implementation could provide direct ‘jump’ access in seekToChunk
  // (the scope’s Chunker would of course also have to support this).
  const seekerAtTarget = new TextSeeker(scope());

  // Create a second seeker so that we will be able to simultaneously read
  // characters near both the target and an unintended match, if we find any.
  const seekerAtUnintendedMatch = new TextSeeker(scope());

  // Read the target’s exact text.
  seekerAtTarget.seekToChunk(target.startChunk, target.startIndex);
  const exact = seekerAtTarget.readToChunk(target.endChunk, target.endIndex);

  // Start with an empty prefix and suffix.
  let prefix = '';
  let suffix = '';

  // If the quote is below the given minimum length, add some prefix & suffix.
  const currentQuoteLength = () => prefix.length + exact.length + suffix.length;
  if (currentQuoteLength() < minimumQuoteLength) {
    // Expand the prefix, but only to reach halfway towards the desired length.
    seekerAtTarget.seekToChunk(
      target.startChunk,
      target.startIndex - prefix.length,
    );
    const length = Math.floor((minimumQuoteLength - currentQuoteLength()) / 2);
    prefix = seekerAtTarget.read(-length, false, true) + prefix;

    // If needed, expand the suffix to achieve the minimum length.
    if (currentQuoteLength() < minimumQuoteLength) {
      seekerAtTarget.seekToChunk(
        target.endChunk,
        target.endIndex + suffix.length,
      );
      const length = minimumQuoteLength - currentQuoteLength();
      suffix = suffix + seekerAtTarget.read(length, false, true);

      // We might have to expand the prefix again (if at the end of the scope).
      if (currentQuoteLength() < minimumQuoteLength) {
        seekerAtTarget.seekToChunk(
          target.startChunk,
          target.startIndex - prefix.length,
        );
        const length = minimumQuoteLength - currentQuoteLength();
        prefix = seekerAtTarget.read(-length, false, true) + prefix;
      }
    }
  }

  // Expand prefix & suffix to avoid them ending somewhere halfway in a word.
  if (!minimalContext) {
    seekerAtTarget.seekToChunk(
      target.startChunk,
      target.startIndex - prefix.length,
    );
    prefix = readUntilWhitespace(seekerAtTarget, maxWordLength, true) + prefix;
    seekerAtTarget.seekToChunk(
      target.endChunk,
      target.endIndex + suffix.length,
    );
    suffix = suffix + readUntilWhitespace(seekerAtTarget, maxWordLength, false);
  }

  // Search for matches of the quote using the current prefix and suffix. At
  // each unintended match we encounter, we extend the prefix or suffix to
  // ensure it will no longer match.
  while (true) {
    const tentativeSelector: TextQuoteSelector = {
      type: 'TextQuoteSelector',
      exact,
      prefix,
      suffix,
    };

    const matches = textQuoteSelectorMatcher(tentativeSelector)(scope());
    let nextMatch = await matches.next();

    // If this match is the intended one, no need to act.
    // XXX This test is fragile: nextMatch and target are assumed to be normalised.
    if (!nextMatch.done && chunkRangeEquals(nextMatch.value, target)) {
      nextMatch = await matches.next();
    }

    // If there are no more unintended matches, our selector is unambiguous!
    if (nextMatch.done) return tentativeSelector;

    // Possible optimisation: A subsequent search could safely skip the part we
    // already processed, instead of starting from the beginning again. But we’d
    // need the matcher to start at the seeker’s position, instead of searching
    // in the whole current chunk. Then we could just seek back to just after
    // the start of the prefix: seeker.seekBy(-prefix.length + 1); (don’t forget
    // to also correct for any changes in the prefix we will make below)

    // We’ll have to add more prefix/suffix to disqualify this unintended match.
    const unintendedMatch = nextMatch.value;

    // Count how many characters we’d need as a prefix to disqualify this match.
    seekerAtTarget.seekToChunk(
      target.startChunk,
      target.startIndex - prefix.length,
    );
    seekerAtUnintendedMatch.seekToChunk(
      unintendedMatch.startChunk,
      unintendedMatch.startIndex - prefix.length,
    );
    let extraPrefix = readUntilDifferent(
      seekerAtTarget,
      seekerAtUnintendedMatch,
      true,
    );
    if (extraPrefix !== undefined && !minimalContext)
      extraPrefix =
        readUntilWhitespace(seekerAtTarget, maxWordLength, true) + extraPrefix;

    // Count how many characters we’d need as a suffix to disqualify this match.
    seekerAtTarget.seekToChunk(
      target.endChunk,
      target.endIndex + suffix.length,
    );
    seekerAtUnintendedMatch.seekToChunk(
      unintendedMatch.endChunk,
      unintendedMatch.endIndex + suffix.length,
    );
    let extraSuffix = readUntilDifferent(
      seekerAtTarget,
      seekerAtUnintendedMatch,
      false,
    );
    if (extraSuffix !== undefined && !minimalContext)
      extraSuffix =
        extraSuffix + readUntilWhitespace(seekerAtTarget, maxWordLength, false);

    if (minimalContext) {
      // Use either the prefix or suffix, whichever is shortest.
      if (
        extraPrefix !== undefined &&
        (extraSuffix === undefined || extraPrefix.length <= extraSuffix.length)
      ) {
        prefix = extraPrefix + prefix;
      } else if (extraSuffix !== undefined) {
        suffix = suffix + extraSuffix;
      } else {
        throw new Error(
          'Target cannot be disambiguated; how could that have happened‽',
        );
      }
    } else {
      // For redundancy, expand both prefix and suffix.
      if (extraPrefix !== undefined) prefix = extraPrefix + prefix;
      if (extraSuffix !== undefined) suffix = suffix + extraSuffix;
    }
  }
}

function readUntilDifferent(
  seeker1: RelativeSeeker,
  seeker2: RelativeSeeker,
  reverse: boolean,
): string | undefined {
  let result = '';
  while (true) {
    let nextCharacter: string;
    try {
      nextCharacter = seeker1.read(reverse ? -1 : 1);
    } catch (err) {
      return undefined; // Start/end of text reached: cannot expand result.
    }
    result = reverse ? nextCharacter + result : result + nextCharacter;

    // Check if the newly added character makes the result differ from the second seeker.
    let comparisonCharacter: string | undefined;
    try {
      comparisonCharacter = seeker2.read(reverse ? -1 : 1);
    } catch (err) {
      // A RangeError would merely mean seeker2 is exhausted.
      if (!(err instanceof RangeError)) throw err;
    }
    if (nextCharacter !== comparisonCharacter) return result;
  }
}

function readUntilWhitespace(
  seeker: RelativeSeeker,
  limit = Infinity,
  reverse = false,
): string {
  let result = '';
  while (result.length < limit) {
    let nextCharacter: string;
    try {
      nextCharacter = seeker.read(reverse ? -1 : 1);
    } catch (err) {
      if (!(err instanceof RangeError)) throw err;
      break; // End/start of text reached.
    }

    // Stop if we reached whitespace.
    if (isWhitespace(nextCharacter)) {
      seeker.seekBy(reverse ? 1 : -1); // ‘undo’ the last read.
      break;
    }

    result = reverse ? nextCharacter + result : result + nextCharacter;
  }
  return result;
}

function isWhitespace(s: string): boolean {
  return /^\s+$/.test(s);
}
