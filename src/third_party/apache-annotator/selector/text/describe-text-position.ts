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

import type { TextPositionSelector } from "../types";
import type { Chunk, Chunker, ChunkRange } from "./chunker";
import { CodePointSeeker } from "./code-point-seeker";
import { TextSeeker } from "./seeker";

/**
 * Returns a {@link TextPositionSelector} that points at the target text within
 * the given scope.
 *
 * This is an abstract implementation of the function’s logic, which expects a
 * generic {@link Chunker} to represent the text, and a {@link ChunkRange} to
 * represent the target.
 *
 * See {@link dom.describeTextPosition} for a wrapper around
 * this implementation which applies it to the text of an HTML DOM.
 *
 * @param target - The range of characters that the selector should describe
 * @param scope - The text, presented as a {@link Chunker}, which contains the
 * target range, and relative to which its position will be measured
 * @returns The {@link TextPositionSelector} that describes `target` relative
 * to `scope`
 *
 * @public
 */
export async function describeTextPosition<TChunk extends Chunk<string>>(
  target: ChunkRange<TChunk>,
  scope: Chunker<TChunk>,
): Promise<TextPositionSelector> {
  const codeUnitSeeker = new TextSeeker(scope);
  const codePointSeeker = new CodePointSeeker(codeUnitSeeker);

  codePointSeeker.seekToChunk(target.startChunk, target.startIndex);
  const start = codePointSeeker.position;
  codePointSeeker.seekToChunk(target.endChunk, target.endIndex);
  const end = codePointSeeker.position;
  return {
    type: "TextPositionSelector",
    start,
    end,
  };
}
