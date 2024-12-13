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

/**
 * Represents a piece of text in any kind of ‘file’.
 *
 * Its purpose is to enable generic algorithms to deal with text content of any
 * type of ‘file’ that consists of many pieces of text (e.g. a DOM, PDF, …).
 * Each Chunk represents one piece of text ({@link Chunk.data}). An object
 * implementing this interface would typically have other attributes as well to
 * map the chunk back to its position in the file (e.g. a Text node in the DOM).
 *
 * @typeParam TData - Piece of text, typically `string`
 *
 * @public
 */
export interface Chunk<TData> {
  /**
   * The piece of text this chunk represents.
   */
  readonly data: TData;
  equals?(otherChunk: this): boolean;
}

/**
 * Test two {@link Chunk}s for equality.
 *
 * Equality here means that both represent the same piece of text (i.e. at the
 * same position) in the file. It compares using the custom {@link Chunk.equals}
 * method if either chunk defines one, and falls back to checking the objects’
 * identity (i.e. `chunk1 === chunk2`).
 *
 * @public
 */
export function chunkEquals(chunk1: Chunk<any>, chunk2: Chunk<any>): boolean {
  if (chunk1.equals) return chunk1.equals(chunk2);
  if (chunk2.equals) return chunk2.equals(chunk1);
  return chunk1 === chunk2;
}

/**
 * Points at a range of characters between two points inside {@link Chunk}s.
 *
 * Analogous to the DOM’s ({@link https://developer.mozilla.org/en-US/docs/Web/API/AbstractRange
 * | Abstract}){@link https://developer.mozilla.org/en-US/docs/Web/API/Range |
 * Range}. Each index expresses an offset inside the value of the corresponding
 * {@link Chunk.data}, and can equal the length of that data in order to point
 * to the position right after the chunk’s last character.
 *
 * @public
 */
export interface ChunkRange<TChunk extends Chunk<any>> {
  startChunk: TChunk;
  startIndex: number;
  endChunk: TChunk;
  endIndex: number;
}

/**
 * Test two {@link ChunkRange}s for equality.
 *
 * Equality here means equality of each of their four properties (i.e.
 * {@link startChunk}, {@link startIndex},
 * {@link endChunk}, and {@link endIndex}).
 * For the `startChunk`s and `endChunk`s, this function uses the custom
 * {@link Chunk.equals} method if defined.
 *
 * Note that if the start/end of one range points at the end of a chunk, and the
 * other to the start of a subsequent chunk, they are not considered equal, even
 * though semantically they may be representing the same range of characters. To
 * test for such semantic equivalence, ensure that both inputs are normalised:
 * typically this means the range is shrunk to its narrowest equivalent, and (if
 * it is empty) positioned at its first equivalent.
 *
 * @public
 */
export function chunkRangeEquals(
  range1: ChunkRange<any>,
  range2: ChunkRange<any>,
): boolean {
  return (
    chunkEquals(range1.startChunk, range2.startChunk) &&
    chunkEquals(range1.endChunk, range2.endChunk) &&
    range1.startIndex === range2.startIndex &&
    range1.endIndex === range2.endIndex
  );
}

/**
 * Presents the pieces of text contained in some underlying ‘file’ as a sequence
 * of {@link Chunk}s.
 *
 * Rather than presenting a list of all pieces, the `Chunker` provides methods
 * to walk through the file piece by piece. This permits implementations to read
 * and convert the file to `Chunk`s lazily.
 *
 * For those familiar with the DOM APIs, it is similar to a NodeIterator (but
 * unlike NodeIterator, it has no concept of being ‘before’ or ‘after’ a chunk).
 *
 * @typeParam TChunk - (sub)type of `Chunk` being used.
 *
 * @public
 */
export interface Chunker<TChunk extends Chunk<any>> {
  /**
   * The chunk currently being pointed at.
   *
   * Initially, this should normally be the first chunk in the file.
   */
  readonly currentChunk: TChunk;

  /**
   * Point {@link currentChunk} at the chunk following it, and return that chunk.
   * If there are no chunks following it, keep `currentChunk` unchanged and
   * return null.
   */
  nextChunk(): TChunk | null;

  /**
   * Point {@link currentChunk} at the chunk preceding it, and return that chunk.
   * If there are no chunks preceding it, keep `currentChunk` unchanged and
   * return null.
   */
  previousChunk(): TChunk | null;

  /**
   * Test if a given `chunk` is before the {@link currentChunk|current
   * chunk}.
   *
   * Returns true if `chunk` is before `this.currentChunk`, false otherwise
   * (i.e. if `chunk` follows it or is the current chunk).
   *
   * The given `chunk` need not necessarily be obtained from the same `Chunker`,
   * but the chunkers would need to represent the same file. Otherwise behaviour
   * is unspecified (an implementation might throw or just return `false`).
   *
   * @param chunk - A chunk, typically obtained from the same `Chunker`.
   */
  precedesCurrentChunk(chunk: TChunk): boolean;
}
