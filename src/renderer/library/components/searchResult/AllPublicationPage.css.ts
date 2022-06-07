// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { createTheme, style } from "@vanilla-extract/css";

// https://vanilla-extract.style/documentation/

export const [classThemeExample, vars] = createTheme({
    color: {
        brand: "blue",
    },
    font: {
        main: "arial",
    },
});

export const classStyleExample = style({
    backgroundColor: vars.color.brand,
    fontFamily: vars.font.main,
    color: "white",
    padding: 10,
});
