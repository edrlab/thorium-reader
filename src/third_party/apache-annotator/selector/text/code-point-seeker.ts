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

import type { Chunk } from "./chunker.js";
import type { Seeker } from "./seeker.js";

/**
 * Seeks through text counting Unicode *code points* instead of *code units*.
 *
 * Javascript characters correspond to 16 bits *code units*, hence two such
 * ‘characters’ might together constitute a single Unicode character (i.e. a
 * *code point*). The {@link CodePointSeeker} allows to ignore this
 * variable-length encoding, by counting code points instead.
 *
 * It is made to wrap a {@link Seeker} that counts code units (presumably a
 * {@link TextSeeker}), which must be passed to its {@link constructor}.
 *
 * When reading from the `CodePointSeeker`, the returned values is not a string
 * but an array of strings, each containing one code point (thus each having a
 * `length` that is either 1 or 2).
 *
 * @public
 */
export class CodePointSeeker<TChunk extends Chunk<string>>
  implements Seeker<TChunk, string[]> {
  position = 0;

  /**
   *
   * @param raw  The {@link Seeker} to wrap, which counts in code *units* (e.g.
   * a {@link TextSeeker}). It should have {@link Seeker.position | position}
   * `0` and its methods must no longer be used directly if the
   * `CodePointSeeker`’s position is to remain correct.
   */
  constructor(public readonly raw: Seeker<TChunk>) {}

  seekBy(length: number): void {
    this.seekTo(this.position + length);
  }

  seekTo(target: number): void {
    this._readOrSeekTo(false, target);
  }

  read(length: number, roundUp?: boolean): string[] {
    return this.readTo(this.position + length, roundUp);
  }

  readTo(target: number, roundUp?: boolean): string[] {
    return this._readOrSeekTo(true, target, roundUp);
  }

  get currentChunk(): TChunk {
    return this.raw.currentChunk;
  }

  get offsetInChunk(): number {
    return this.raw.offsetInChunk;
  }

  seekToChunk(target: TChunk, offset = 0): void {
    this._readOrSeekToChunk(false, target, offset);
  }

  readToChunk(target: TChunk, offset = 0): string[] {
    return this._readOrSeekToChunk(true, target, offset);
  }

  private _readOrSeekToChunk(
    read: true,
    target: TChunk,
    offset?: number,
  ): string[];
  private _readOrSeekToChunk(
    read: false,
    target: TChunk,
    offset?: number,
  ): void;
  private _readOrSeekToChunk(read: boolean, target: TChunk, offset = 0) {
    const oldRawPosition = this.raw.position;

    let s = this.raw.readToChunk(target, offset);

    const movedForward = this.raw.position >= oldRawPosition;

    if (movedForward && endsWithinCharacter(s)) {
      this.raw.seekBy(-1);
      s = s.slice(0, -1);
    } else if (!movedForward && startsWithinCharacter(s)) {
      this.raw.seekBy(1);
      s = s.slice(1);
    }

    const result = [...s];

    this.position = movedForward
      ? this.position + result.length
      : this.position - result.length;

    if (read) return result;
    return undefined;
  }

  private _readOrSeekTo(
    read: true,
    target: number,
    roundUp?: boolean,
  ): string[];
  private _readOrSeekTo(read: false, target: number, roundUp?: boolean): void;
  private _readOrSeekTo(
    read: boolean,
    target: number,
    roundUp = false,
  ): string[] | void {
    let result: string[] = [];

    if (this.position < target) {
      let unpairedSurrogate = "";
      let characters: string[] = [];
      while (this.position < target) {
        let s = unpairedSurrogate + this.raw.read(1, true);
        if (endsWithinCharacter(s)) {
          unpairedSurrogate = s.slice(-1); // consider this half-character part of the next string.
          s = s.slice(0, -1);
        } else {
          unpairedSurrogate = "";
        }
        characters = [...s];
        this.position += characters.length;
        if (read) result = result.concat(characters);
      }
      if (unpairedSurrogate) this.raw.seekBy(-1); // align with the last complete character.
      if (!roundUp && this.position > target) {
        const overshootInCodePoints = this.position - target;
        const overshootInCodeUnits = characters
          .slice(-overshootInCodePoints)
          .join("").length;
        this.position -= overshootInCodePoints;
        this.raw.seekBy(-overshootInCodeUnits);
      }
    } else {
      // Nearly equal to the if-block, but moving backward in the text.
      let unpairedSurrogate = "";
      let characters: string[] = [];
      while (this.position > target) {
        let s = this.raw.read(-1, true) + unpairedSurrogate;
        if (startsWithinCharacter(s)) {
          unpairedSurrogate = s[0];
          s = s.slice(1);
        } else {
          unpairedSurrogate = "";
        }
        characters = [...s];
        this.position -= characters.length;
        if (read) result = characters.concat(result);
      }
      if (unpairedSurrogate) this.raw.seekBy(1);
      if (!roundUp && this.position < target) {
        const overshootInCodePoints = target - this.position;
        const overshootInCodeUnits = characters
          .slice(0, overshootInCodePoints)
          .join("").length;
        this.position += overshootInCodePoints;
        this.raw.seekBy(overshootInCodeUnits);
      }
    }

    if (read) return result;
  }
}

function endsWithinCharacter(s: string) {
  const codeUnit = s.charCodeAt(s.length - 1);
  return 0xd800 <= codeUnit && codeUnit <= 0xdbff;
}

function startsWithinCharacter(s: string) {
  const codeUnit = s.charCodeAt(0);
  return 0xdc00 <= codeUnit && codeUnit <= 0xdfff;
}
