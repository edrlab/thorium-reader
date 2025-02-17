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

import { ISelector } from "readium-desktop/common/readium/annotation/annotationModel.type";
import type { Matcher, Selector } from "./types";

/**
 * A Refinable selector can have the `refinedBy` attribute, whose value must be
 * of the same type (possibly again refined, recursively).
 *
 * See {@link https://www.w3.org/TR/2017/REC-annotation-model-20170223/#refinement-of-selection
 * | §4.2.9 Refinement of Selection} in the Web Annotation Data Model.
 *
 * @example
 * Example value of type `Refinable<CssSelector, TextQuoteSelector>`:
 *
 *     {
 *       type: "CssSelector",
 *       …,
 *       refinedBy: {
 *         type: "TextQuoteSelector",
 *         …,
 *         refinedBy: { … }, // again either a CssSelector or TextQuoteSelector
 *       }
 *     }
 */
export type Refinable<T extends Selector> = T & { refinedBy?: Refinable<T> };

/**
 * Wrap a matcher creation function so that it supports refinement of selection.
 *
 * See {@link https://www.w3.org/TR/2017/REC-annotation-model-20170223/#refinement-of-selection
 * | §4.2.9 Refinement of Selection} in the Web Annotation Data Model.
 *
 * @param matcherCreator - The function to wrap; it will be executed both for
 * {@link Selector}s passed to the returned wrapper function, and for any
 * refining Selector those might contain (and any refinement of that, etc.).
 *
 * @public
 */
export function makeRefinable<
  TSelector extends ISelector,
  TScope,
  // To enable refinement, the implementation’s Match object must be usable as a
  // Scope object itself.
  TMatch extends TScope
>(
  matcherCreator: (selector: TSelector) => Matcher<TScope, TMatch>,
): (selector: TSelector) => Matcher<TScope, TMatch> {
  return function createMatcherWithRefinement(
    sourceSelector: TSelector,
  ): Matcher<TScope, TMatch> {
    const matcher = matcherCreator(sourceSelector);

    if (sourceSelector.refinedBy) {
      const refiningSelector = createMatcherWithRefinement(
        sourceSelector.refinedBy,
      );

      return async function* matchAll(scope) {
        for await (const match of matcher(scope)) {
          yield* refiningSelector(match);
        }
      };
    }

    return matcher;
  };
}
