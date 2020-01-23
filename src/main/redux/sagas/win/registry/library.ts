// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { syncIpc, winIpc } from "readium-desktop/common/ipc";
import { i18nActions } from "readium-desktop/common/redux/actions";
import { selectTyped } from "readium-desktop/common/redux/typed-saga";
import { savedLibraryWindowInDi, getReaderWindowFromDi } from "readium-desktop/main/di";
import { winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { all, call, takeEvery } from "redux-saga/effects";
