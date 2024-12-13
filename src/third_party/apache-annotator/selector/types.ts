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
 * A {@link https://www.w3.org/TR/2017/REC-annotation-model-20170223/#selectors
 * | Selector} object of the Web Annotation Data Model.
 *
 * Corresponds to RDF class {@link http://www.w3.org/ns/oa#Selector}
 *
 * @public
 */
export interface Selector<T = any> {
  /**
   * A Selector can be refined by another Selector.
   *
   * See {@link https://www.w3.org/TR/2017/REC-annotation-model-20170223/#refinement-of-selection
   * | §4.2.9 Refinement of Selection} in the Web Annotation Data Model.
   *
   * Corresponds to RDF property {@link http://www.w3.org/ns/oa#refinedBy}
   */
  refinedBy?: Selector<T>;
}

/**
 * The {@link https://www.w3.org/TR/2017/REC-annotation-model-20170223/#css-selector
 * | CssSelector} of the Web Annotation Data Model.
 *
 * Corresponds to RDF class {@link http://www.w3.org/ns/oa#CssSelector}
 *
 * @public
 */
export interface CssSelector<T = any> extends Selector<T> {
  type: 'CssSelector';
  value: string;
}

/**
 * The {@link https://www.w3.org/TR/2017/REC-annotation-model-20170223/#text-quote-selector
 * | TextQuoteSelector} of the Web Annotation Data Model.
 *
 * Corresponds to RDF class {@link http://www.w3.org/ns/oa#TextQuoteSelector}
 *
 * @public
 */
export interface TextQuoteSelector<T = any> extends Selector<T> {
  type: 'TextQuoteSelector';
  exact: string;
  prefix?: string;
  suffix?: string;
}

/**
 * The {@link https://www.w3.org/TR/2017/REC-annotation-model-20170223/#text-position-selector
 * | TextPositionSelector} of the Web Annotation Data Model.
 *
 * Corresponds to RDF class {@link http://www.w3.org/ns/oa#TextPositionSelector}
 *
 * @public
 */
export interface TextPositionSelector<T = any> extends Selector<T> {
  type: 'TextPositionSelector';
  start: number; // more precisely: non-negative integer
  end: number; // more precisely: non-negative integer
}

/**
 * The {@link https://www.w3.org/TR/2017/REC-annotation-model-20170223/#range-selector
 * | RangeSelector} of the Web Annotation Data Model.
 *
 * Corresponds to RDF class {@link http://www.w3.org/ns/oa#RangeSelector}
 *
 * @public
 */
export interface RangeSelector<T = any> extends Selector<T> {
  type: 'RangeSelector';
  startSelector: T;
  endSelector: T;
}

/**
 * A function that finds the match(es) in the given (sub)document (the ‘scope’)
 * corresponding to some (prespecified) selector(s).
 *
 * @public
 */
export interface Matcher<TScope, TMatch> {
  (scope: TScope): AsyncGenerator<TMatch, void, void>;
}
