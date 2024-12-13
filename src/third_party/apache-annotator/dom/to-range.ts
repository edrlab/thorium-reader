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

import { ownerDocument } from './owner-document.js';

/**
 * Returns a range that exactly selects the contents of the given node.
 *
 * This function is idempotent: If the given argument is already a range, it
 * simply returns that range.
 *
 * @param nodeOrRange The node/range to convert to a range if it is not already
 * a range.
 */
export function toRange(nodeOrRange: Node | Range): Range {
  if (isRange(nodeOrRange)) {
    return nodeOrRange;
  } else {
    const node = nodeOrRange;
    const range = ownerDocument(node).createRange();
    range.selectNodeContents(node);
    return range;
  }
}

function isRange(nodeOrRange: Node | Range): nodeOrRange is Range {
  return 'startContainer' in nodeOrRange;
}
