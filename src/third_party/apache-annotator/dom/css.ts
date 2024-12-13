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

import { uniqueCssSelector as finder } from "@r2-navigator-js/electron/renderer/common/cssselector2-3";

import type { CssSelector, Matcher } from "../selector/types.js";
import { ownerDocument } from "./owner-document.js";
import { toRange } from "./to-range.js";

/**
 * Find the elements corresponding to the given {@link
 * CssSelector}.
 *
 * The given CssSelector returns all elements within `scope` that it matches.
 *
 * The function is curried, taking first the selector and then the scope.
 *
 * As there may be multiple matches for a given selector, the matcher will
 * return an (async) iterable that produces each match in the order they are
 * found in the document.
 *
 * Note that the Web Annotation specification does not mention whether an
 * ‘ambiguous’ CssSelector should indeed match all elements that match the
 * selector value, or perhaps only the first. This implementation returns all
 * matches to give users the freedom to follow either interpretation. This is
 * also in line with more clearly defined behaviour of the TextQuoteSelector:
 *
 * > “If […] the user agent discovers multiple matching text sequences, then the
 * > selection SHOULD be treated as matching all of the matches.”
 *
 * Note that if `scope` is *not* a Document, the [Web Annotation Data Model](https://www.w3.org/TR/2017/REC-annotation-model-20170223/#css-selector)
 * leaves the behaviour undefined. This implementation will, in such a case,
 * evaluate the selector relative to the document containing the scope, but only
 * return those matches that are fully enclosed within the scope. There might be
 * edge cases where this is not a perfect inverse of {@link describeCss}.
 *
 * @example
 * ```
 * const matches = createCssSelectorMatcher({
 *   type: 'CssSelector',
 *   value: '#target',
 * });
 * for await (const match of matches) {
 *   console.log(match);
 * }
 * // <div id="target" …>
 * ```
 *
 * @param selector - The {@link CssSelector} to be anchored.
 * @returns A {@link Matcher} function that applies `selector` to a given
 * `scope`.
 *
 * @public
 */
export function createCssSelectorMatcher(
  selector: CssSelector,
): Matcher<Node | Range, Element> {
  return async function* matchAll(scope) {
    scope = toRange(scope);
    const document = ownerDocument(scope);
    for (const element of document.querySelectorAll(selector.value)) {
      const range = document.createRange();
      range.selectNode(element);

      if (
        scope.isPointInRange(range.startContainer, range.startOffset) &&
        scope.isPointInRange(range.endContainer, range.endOffset)
      ) {
        yield element;
      }
    }
  };
}

/**
 * Returns a {@link CssSelector} that unambiguously describes the given
 * element, within the given scope.
 *
 * @example
 * ```
 * const target = document.getElementById('targetelement').firstElementChild;
 * const selector = await describeCss(target);
 * console.log(selector);
 * // {
 * //   type: 'CssSelector',
 * //   value: '#targetelement > :nth-child(1)'
 * // }
 * ```
 *
 * @param element - The element that the selector should describe.
 * @param scope - The node that serves as the ‘document’ for purposes of finding
 * an unambiguous selector. Defaults to the Document that contains `element`.
 * @returns The selector unambiguously describing `element` within `scope`.
 */
export async function describeCss(
  element: HTMLElement,
  scope: Element = element.ownerDocument.documentElement,
): Promise<CssSelector> {
  const selector = finder(element, element.ownerDocument, { root: scope });
  return {
    type: "CssSelector",
    value: selector,
  };
}
