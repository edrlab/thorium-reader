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

import type { Chunk, Chunker, ChunkRange } from "../selector/text/chunker";
import { normalizeRange } from "./normalize-range";
import { ownerDocument } from "./owner-document";
import { toRange } from "./to-range";

export interface PartialTextNode extends Chunk<string> {
  readonly node: Text;
  readonly startOffset: number;
  readonly endOffset: number;
}

export class EmptyScopeError extends TypeError {
  constructor(message?: string) {
    super(message || "Scope contains no text nodes.");
  }
}

export class OutOfScopeError extends TypeError {
  constructor(message?: string) {
    super(
      message ||
        "Cannot convert node to chunk, as it falls outside of chunker’s scope.",
    );
  }
}

//@ts-expect-error thorium quick hack typing 
export class TextNodeChunker implements Chunker<PartialTextNode> {
  private scope: Range;
  private iter: NodeIterator;

  get currentChunk(): PartialTextNode {
    const node = this.iter.referenceNode;

    // This test should not actually be needed, but it keeps TypeScript happy.
    if (!isText(node)) throw new EmptyScopeError();

    return this.nodeToChunk(node);
  }

  nodeToChunk(node: Text): PartialTextNode {
    if (!this.scope.intersectsNode(node)) throw new OutOfScopeError();

    const startOffset =
      node === this.scope.startContainer ? this.scope.startOffset : 0;
    const endOffset =
      node === this.scope.endContainer ? this.scope.endOffset : node.length;

    return {
      node,
      startOffset,
      endOffset,
      data: node.data.substring(startOffset, endOffset),
      equals(other) {
        return (
          other.node === this.node &&
          other.startOffset === this.startOffset &&
          other.endOffset === this.endOffset
        );
      },
    };
  }

//@ts-expect-error thorium quick hack typing 
  rangeToChunkRange(range: Range): ChunkRange<PartialTextNode> {
    range = range.cloneRange();

    // Take the part of the range that falls within the scope.
    if (range.compareBoundaryPoints(Range.START_TO_START, this.scope) === -1)
      range.setStart(this.scope.startContainer, this.scope.startOffset);
    if (range.compareBoundaryPoints(Range.END_TO_END, this.scope) === 1)
      range.setEnd(this.scope.endContainer, this.scope.endOffset);

    // Ensure it starts and ends at text nodes.
    const textRange = normalizeRange(range, this.scope);

    const startChunk = this.nodeToChunk(textRange.startContainer);
    const startIndex = textRange.startOffset - startChunk.startOffset;
    const endChunk = this.nodeToChunk(textRange.endContainer);
    const endIndex = textRange.endOffset - endChunk.startOffset;

    return { startChunk, startIndex, endChunk, endIndex };
  }

//@ts-expect-error thorium quick hack typing
  chunkRangeToRange(chunkRange: ChunkRange<PartialTextNode>): Range {
    const range = ownerDocument(this.scope).createRange();
    // The `+…startOffset` parts are only relevant for the first chunk, as it
    // might start within a text node.
    range.setStart(
      chunkRange.startChunk.node,
      chunkRange.startIndex + chunkRange.startChunk.startOffset,
    );
    range.setEnd(
      chunkRange.endChunk.node,
      chunkRange.endIndex + chunkRange.endChunk.startOffset,
    );
    return range;
  }

  /**
   * @param scope A Range that overlaps with at least one text node.
   */
  constructor(scope: Node | Range) {
    this.scope = toRange(scope);
    this.iter = ownerDocument(scope).createNodeIterator(
      this.scope.commonAncestorContainer,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node: Text) => {
          return this.scope.intersectsNode(node)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      },
    );

    // Move the iterator to after the start (= root) node.
    this.iter.nextNode();
    // If the start node is not a text node, move it to the first text node.
    if (!isText(this.iter.referenceNode)) {
      const nextNode = this.iter.nextNode();
      if (nextNode === null) throw new EmptyScopeError();
    }
  }

  nextChunk(): PartialTextNode | null {
    // Move the iterator to after the current node, so nextNode() will cause a jump.
    if (this.iter.pointerBeforeReferenceNode) this.iter.nextNode();

    if (this.iter.nextNode()) return this.currentChunk;
    else return null;
  }

  previousChunk(): PartialTextNode | null {
    if (!this.iter.pointerBeforeReferenceNode) this.iter.previousNode();

    if (this.iter.previousNode()) return this.currentChunk;
    else return null;
  }

  precedesCurrentChunk(chunk: PartialTextNode): boolean {
    if (this.currentChunk === null) return false;
    return !!(
      this.currentChunk.node.compareDocumentPosition(chunk.node) &
      Node.DOCUMENT_POSITION_PRECEDING
    );
  }
}

function isText(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}
