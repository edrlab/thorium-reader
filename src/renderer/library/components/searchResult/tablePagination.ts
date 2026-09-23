// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export const getNextPageIndex = (
    pageIndex: number,
    pageCount: number,
    criteriaChanged: boolean,
): number => criteriaChanged
    ? 0
    : Math.max(0, Math.min(pageIndex, pageCount - 1));
