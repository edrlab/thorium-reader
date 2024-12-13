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

import type { TextPositionSelector } from "../../selector/types.js";
import { describeTextPosition as abstractDescribeTextPosition } from "../../selector/text/describe-text-position.js";
import { ownerDocument } from "../owner-document.js";
import { TextNodeChunker } from "../text-node-chunker.js";
import { toRange } from "../to-range.js";

/**
 * Returns a {@link TextPositionSelector} that points at the target text within
 * the given scope.
 *
 * When no scope is given, the position is described relative to the document
 * as a whole. Note this means all the characters in all Text nodes are counted
 * to determine the target’s position, including those in the `<head>` and
 * whitespace, hence even a minor modification could make the selector point to
 * a different text than its original target.
 *
 * @example
 * ```
 * const target = window.getSelection().getRangeAt(0);
 * const selector = await describeTextPosition(target);
 * console.log(selector);
 * // {
 * //   type: 'TextPositionSelector',
 * //   start: 702,
 * //   end: 736
 * // }
 * ```
 *
 * @param range - The {@link https://developer.mozilla.org/en-US/docs/Web/API/Range
 * | Range} whose text content will be described.
 * @param scope - A Node or Range that serves as the ‘document’ for purposes of
 * finding occurrences and determining prefix and suffix. Defaults to the full
 * Document that contains `range`.
 * @returns The selector describing `range` within `scope`.
 *
 * @public
 */
export async function describeTextPosition(
  range: Range,
  scope?: Node | Range,
): Promise<TextPositionSelector> {
  scope = toRange(scope ?? ownerDocument(range));

  const textChunks = new TextNodeChunker(scope);
  if (textChunks.currentChunk === null)
    throw new RangeError("Scope does not contain any Text nodes.");

  return await abstractDescribeTextPosition(
    textChunks.rangeToChunkRange(range),
    textChunks,
  );
}
