// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { writeFileSync } from "fs";
import { IW3CAnnotationModelSet } from "./annotationModel.type";

export function saveW3CAnnotationModelSetFromFilePath(filePath: string, data: IW3CAnnotationModelSet) {
    try {
        const jsonData = JSON.stringify(data, null, 2);
        writeFileSync(filePath, jsonData, "utf-8");
    
        console.log(`Data successfully written to ${filePath}`);
      } catch (error) {
        console.error(`Error writing data to ${filePath}: ${error}`);
      }
}
