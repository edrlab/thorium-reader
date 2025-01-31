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

import type { Chunk, Chunker } from "./chunker";
import { chunkEquals } from "./chunker";

const E_END = "Iterator exhausted before seek ended.";

/**
 * Abstraction to seek (jump) or read to a position inside a ‘file’ consisting of a
 * sequence of data chunks.
 *
 * This interface is a combination of three interfaces in one: for seeking to a
 * relative position, an absolute position, or a specific chunk. These three are
 * defined separately for clarity and flexibility, but normally used together.
 *
 * A Seeker internally maintains a pointer to the chunk it is currently ‘in’ and
 * the offset position within that chunk.
 *
 * @typeParam TChunk - Type of chunks the file consists of.
 * @typeParam TData - Type of data this seeker’s read methods will return (not
 * necessarily the same as the `TData` parameter of {@link Chunk}, see e.g.
 * {@link CodePointSeeker})
 *
 * @public
 */
export interface Seeker<
  TChunk extends Chunk<any>,
  TData extends Iterable<any> = string
>
  extends RelativeSeeker<TData>,
    AbsoluteSeeker<TData>,
    ChunkSeeker<TChunk, TData> {}

/**
 * Seeks/reads by a given number of characters.
 *
 * @public
 */
export interface RelativeSeeker<TData extends Iterable<any> = string> {
  /**
   * Move forward or backward by a number of characters.
   *
   * @param length - The number of characters to pass. A negative number moves
   * backwards in the file.
   * @throws RangeError if there are not enough characters in the file. The
   * pointer is left at the end/start of the file.
   */
  seekBy(length: number): void;

  /**
   * Read forward or backward by a number of characters.
   *
   * Equal to {@link seekBy}, but returning the characters passed.
   *
   * @param length - The number of characters to read. A negative number moves
   * backwards in the file.
   * @param roundUp - If true, then, after reading the given number of
   * characters, read further until the end (or start) of the current chunk.
   * @param lessIsFine - If true, and there are not enough characters in the
   * file, return the result so far instead of throwing an error.
   * @returns The characters passed (in their normal order, even when moving
   * backwards)
   * @throws RangeError if there are not enough characters in the file (unless
   * `lessIsFine` is true). The pointer is left at the end/start of the file.
   */
  read(length?: number, roundUp?: boolean, lessIsFine?: boolean): TData;
}

/**
 * Seek/read to absolute positions in the file.
 *
 * @public
 */
export interface AbsoluteSeeker<TData extends Iterable<any> = string> {
  /**
   * The current position in the file in terms of character count: i.e. the
   * number of characters before the place currently being pointed at.
   */
  readonly position: number;

  /**
   * Move to the given position in the file.
   *
   * @param target - The position to end up at.
   * @throws RangeError if the given position is beyond the end/start of the
   * file. The pointer is left at the end/start of the file.
   */
  seekTo(target: number): void;

  /**
   * Read forward or backward from the current to the given position in the
   * file, returning the characters that have been passed.
   *
   * Equal to {@link seekTo}, but returning the characters passed.
   *
   * @param target - The position to end up at.
   * @param roundUp - If true, then, after reading to the target position, read
   * further until the end (or start) of the current chunk.
   * @returns The characters passed (in their normal order, even when moving
   * backwards)
   * @throws RangeError if the given position is beyond the end/start of the
   * file. The pointer is left at the end/start of the file.
   */
  readTo(target: number, roundUp?: boolean): TData;
}

/**
 * Seek/read to (and within) specfic chunks the file consists of; and access the
 * chunk and offset in that chunk corresponding to the current position.
 *
 * Note that all offset numbers in this interface are representing units of the
 * {@link Chunk.data | data type of `TChunk`}; which might differ from that of
 * `TData`.
 *
 * @public
 */
export interface ChunkSeeker<
  TChunk extends Chunk<any>,
  TData extends Iterable<any> = string
> {
  /**
   * The chunk containing the current position.
   *
   * When the position falls at the edge between two chunks, `currentChunk` is
   * always the later one (thus {@link offsetInChunk} would be zero). Note that
   * an empty chunk (for which position zero is at both its edges) can
   * hence never be the current chunk unless it is the last chunk in the file.
   */
  readonly currentChunk: TChunk;

  /**
   * The offset inside `currentChunk` corresponding to the current position.
   * Can be between zero and the length of the chunk (inclusive; but it could
   * equal the length of the chunk only if currentChunk is the last chunk).
   */
  readonly offsetInChunk: number;

  /**
   * Move to the start of a given chunk, or to an offset relative to that.
   *
   * @param chunk - The chunk of the file to move to.
   * @param offset - The offset to move to, relative to the start of `chunk`.
   * Defaults to zero.
   * @throws RangeError if the given chunk is not found in the file.
   */
  seekToChunk(chunk: TChunk, offset?: number): void;

  /**
   * Read to the start of a given chunk, or to an offset relative to that.
   *
   * Equal to {@link seekToChunk}, but returning the characters passed.
   *
   * @param chunk - The chunk of the file to move to.
   * @param offset - The offset to move to, relative to the start of `chunk`.
   * Defaults to zero.
   * @returns The characters passed (in their normal order, even when moving
   * backwards)
   * @throws RangeError if the given chunk is not found in the file.
   */
  readToChunk(chunk: TChunk, offset?: number): TData;
}

/**
 * A TextSeeker is constructed around a {@link Chunker}, to let it be treated as
 * a continuous sequence of characters.
 *
 * Seeking to a given numeric position will cause a `TextSeeker` to pull chunks
 * from the underlying `Chunker`, counting their lengths until the requested
 * position is reached. `Chunks` are not stored but simply read again when
 * seeking backwards.
 *
 * The `Chunker` is presumed to read an unchanging file. If a chunk’s length
 * would change while seeking, a TextSeeker’s absolute positioning would be
 * incorrect.
 *
 * See {@link CodePointSeeker} for a {@link Seeker} that counts Unicode *code
 * points* instead of Javascript’s ‘normal’ characters.
 *
 * @public
 */
export class TextSeeker<TChunk extends Chunk<string>>
  implements Seeker<TChunk> {
  // The chunk containing our current text position.
  get currentChunk(): TChunk {
    return this.chunker.currentChunk;
  }

  // The index of the first character of the current chunk inside the text.
  private currentChunkPosition = 0;

  // The position inside the chunk where the last seek ended up.
  offsetInChunk = 0;

  // The current text position (measured in code units)
  get position(): number {
    return this.currentChunkPosition + this.offsetInChunk;
  }

  constructor(protected chunker: Chunker<TChunk>) {
    // Walk to the start of the first non-empty chunk inside the scope.
    this.seekTo(0);
  }

  read(length: number, roundUp = false, lessIsFine = false): string {
    return this._readOrSeekTo(
      true,
      this.position + length,
      roundUp,
      lessIsFine,
    );
  }

  readTo(target: number, roundUp = false): string {
    return this._readOrSeekTo(true, target, roundUp);
  }

  seekBy(length: number): void {
    this.seekTo(this.position + length);
  }

  seekTo(target: number): void {
    this._readOrSeekTo(false, target);
  }

  seekToChunk(target: TChunk, offset = 0): void {
    this._readOrSeekToChunk(false, target, offset);
  }

  readToChunk(target: TChunk, offset = 0): string {
    return this._readOrSeekToChunk(true, target, offset);
  }

  private _readOrSeekToChunk(
    read: true,
    target: TChunk,
    offset?: number,
  ): string;
  private _readOrSeekToChunk(
    read: false,
    target: TChunk,
    offset?: number,
  ): void;
  private _readOrSeekToChunk(
    read: boolean,
    target: TChunk,
    offset = 0,
  ): string | void {
    const oldPosition = this.position;
    let result = "";

    // Walk to the requested chunk.
    if (!this.chunker.precedesCurrentChunk(target)) {
      // Search forwards.
      while (!chunkEquals(this.currentChunk, target)) {
        const [data, nextChunk] = this._readToNextChunk();
        if (read) result += data;
        if (nextChunk === null) throw new RangeError(E_END);
      }
    } else {
      // Search backwards.
      while (!chunkEquals(this.currentChunk, target)) {
        const [data, previousChunk] = this._readToPreviousChunk();
        if (read) result = data + result;
        if (previousChunk === null) throw new RangeError(E_END);
      }
    }

    // Now we know where the chunk is, walk to the requested offset.
    // Note we might have started inside the chunk, and the offset could even
    // point at a position before or after the chunk.
    const targetPosition = this.currentChunkPosition + offset;
    if (!read) {
      this.seekTo(targetPosition);
    } else {
      if (targetPosition >= this.position) {
        // Read further until the target.
        result += this.readTo(targetPosition);
      } else if (targetPosition >= oldPosition) {
        // We passed by our target position: step back.
        this.seekTo(targetPosition);
        result = result.slice(0, targetPosition - oldPosition);
      } else {
        // The target precedes our starting position: read backwards from there.
        this.seekTo(oldPosition);
        result = this.readTo(targetPosition);
      }
      return result;
    }
  }

  private _readOrSeekTo(
    read: true,
    target: number,
    roundUp?: boolean,
    lessIsFine?: boolean,
  ): string;
  private _readOrSeekTo(
    read: false,
    target: number,
    roundUp?: boolean,
    lessIsFine?: boolean,
  ): void;
  private _readOrSeekTo(
    read: boolean,
    target: number,
    roundUp = false,
    lessIsFine = false,
  ): string | void {
    let result = "";

    if (this.position <= target) {
      while (true) {
        const endOfChunk =
          this.currentChunkPosition + this.currentChunk.data.length;
        if (endOfChunk <= target) {
          // The target is beyond the current chunk.
          // (we use ≤ not <: if the target is *at* the end of the chunk, possibly
          // because the current chunk is empty, we prefer to take the next chunk)

          const [data, nextChunk] = this._readToNextChunk();
          if (read) result += data;
          if (nextChunk === null) {
            if (this.position === target || lessIsFine) break;
            else throw new RangeError(E_END);
          }
        } else {
          // The target is within the current chunk.
          const newOffset = roundUp
            ? this.currentChunk.data.length
            : target - this.currentChunkPosition;
          if (read)
            result += this.currentChunk.data.substring(
              this.offsetInChunk,
              newOffset,
            );
          this.offsetInChunk = newOffset;

          // If we finish end at the end of the chunk, seek to the start of the next non-empty node.
          // (TODO decide: should we keep this guarantee of not finishing at the end of a chunk?)
          if (roundUp) this.seekBy(0);

          break;
        }
      }
    } else {
      // Similar to the if-block, but moving backward in the text.
      while (this.position > target) {
        if (this.currentChunkPosition <= target) {
          // The target is within the current chunk.
          const newOffset = roundUp ? 0 : target - this.currentChunkPosition;
          if (read)
            result =
              this.currentChunk.data.substring(newOffset, this.offsetInChunk) +
              result;
          this.offsetInChunk = newOffset;
          break;
        } else {
          const [data, previousChunk] = this._readToPreviousChunk();
          if (read) result = data + result;
          if (previousChunk === null) {
            if (lessIsFine) break;
            else throw new RangeError(E_END);
          }
        }
      }
    }

    if (read) return result;
  }

  // Read to the start of the next chunk, if any; otherwise to the end of the current chunk.
  _readToNextChunk(): [string, TChunk | null] {
    const data = this.currentChunk.data.substring(this.offsetInChunk);
    const chunkLength = this.currentChunk.data.length;
    const nextChunk = this.chunker.nextChunk();
    if (nextChunk !== null) {
      this.currentChunkPosition += chunkLength;
      this.offsetInChunk = 0;
    } else {
      this.offsetInChunk = chunkLength;
    }
    return [data, nextChunk];
  }

  // Read backwards to the end of the previous chunk, if any; otherwise to the start of the current chunk.
  _readToPreviousChunk(): [string, TChunk | null] {
    const data = this.currentChunk.data.substring(0, this.offsetInChunk);
    const previousChunk = this.chunker.previousChunk();
    if (previousChunk !== null) {
      this.currentChunkPosition -= this.currentChunk.data.length;
      this.offsetInChunk = this.currentChunk.data.length;
    } else {
      this.offsetInChunk = 0;
    }
    return [data, previousChunk];
  }
}
