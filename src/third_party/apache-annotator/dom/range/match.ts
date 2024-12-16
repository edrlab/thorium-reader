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

import type {
  Matcher,
  RangeSelector,
  Selector,
} from "../../selector/types";

import { ownerDocument } from "../owner-document";
import { toRange } from "../to-range";
import { cartesian } from "./cartesian";

/**
 * Find the range(s) corresponding to the given {@link RangeSelector}.
 *
 * As a RangeSelector itself nests two further selectors, one needs to pass a
 * `createMatcher` function that will be used to process those nested selectors.
 *
 * The function is curried, taking first the `createMatcher` function, then the
 * selector, and then the scope.
 *
 * As there may be multiple matches for the start & end selectors, the resulting
 * matcher will return an (async) iterable, that produces a match for each
 * possible pair of matches of the nested selectors (except those where its end
 * would precede its start). *(Note that this behaviour is a rather free
 * interpretation of the Web Annotation Data Model spec, which is silent about
 * the possibility of multiple matches for RangeSelectors)*
 *
 * @example
 * By using a matcher for {@link TextQuoteSelector}s, one
 * could create a matcher for text quotes with ellipsis to select a phrase
 * “ipsum … amet,”:
 * ```
 * const selector = {
 *   type: 'RangeSelector',
 *   startSelector: {
 *     type: 'TextQuoteSelector',
 *     exact: 'ipsum ',
 *   },
 *   endSelector: {
 *     type: 'TextQuoteSelector',
 *     // Because the end of a RangeSelector is *exclusive*, we will present the
 *     // latter part of the quote as the *prefix* so it will be part of the
 *     // match.
 *     exact: '',
 *     prefix: ' amet,',
 *   }
 * };
 * const createRangeSelectorMatcher =
 *   makeCreateRangeSelectorMatcher(createTextQuoteMatcher);
 * const match = createRangeSelectorMatcher(selector)(document.body);
 * console.log(match)
 * // ⇒ Range { startContainer: #text, startOffset: 6, endContainer: #text,
 * //   endOffset: 27, … }
 * ```
 *
 * @example
 * To support RangeSelectors that might themselves contain RangeSelectors,
 * recursion can be created by supplying the resulting matcher creator function
 * as the `createMatcher` parameter:
 * ```
 * const createWhicheverMatcher = (selector) => {
 *   const innerCreateMatcher = {
 *     TextQuoteSelector: createTextQuoteSelectorMatcher,
 *     TextPositionSelector: createTextPositionSelectorMatcher,
 *     RangeSelector: makeCreateRangeSelectorMatcher(createWhicheverMatcher),
 *   }[selector.type];
 *   return innerCreateMatcher(selector);
 * });
 * ```
 *
 * @param createMatcher - The function used to process nested selectors.
 * @returns A function that, given a RangeSelector `selector`, creates a {@link
 * Matcher} function that can apply it to a given `scope`.
 *
 * @public
 */
export function makeCreateRangeSelectorMatcher<T extends Selector>(
  createMatcher: <TMatch extends Node | Range>(
    selector: T,
  ) => Matcher<Node | Range, TMatch>,
): (selector: RangeSelector<T>) => Matcher<Node | Range, Range> {
  return function createRangeSelectorMatcher(selector) {
    const startMatcher = createMatcher(selector.startSelector);
    const endMatcher = createMatcher(selector.endSelector);

    return async function* matchAll(scope) {
      const startMatches = startMatcher(scope);
      const endMatches = endMatcher(scope);

      const pairs = cartesian(startMatches, endMatches);

      for await (let [start, end] of pairs) {
        start = toRange(start);
        end = toRange(end);

        const result = ownerDocument(scope).createRange();
        result.setStart(start.startContainer, start.startOffset);
        // Note that a RangeSelector’s match *excludes* the endSelector’s match,
        // hence we take the end’s startContainer & startOffset.
        result.setEnd(end.startContainer, end.startOffset);

        if (!result.collapsed) yield result;
      }
    };
  };
}
