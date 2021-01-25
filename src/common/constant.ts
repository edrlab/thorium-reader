// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { _PACKAGING } from "readium-desktop/preprocessor-directives";
import * as path from "path";

export const ABOUT_BOOK_TITLE_PREFIX = "_______________";

export const pdfJsFolderPath = (() => {

        const pdfjsFolder = "assets/lib/pdfjs";

        let folderPath = path.join(__dirname, pdfjsFolder);
        if (_PACKAGING === "0") {
            folderPath = path.join(process.cwd(), "dist", pdfjsFolder);
        }

        return folderPath;
})();
