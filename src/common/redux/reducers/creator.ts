// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { creatorActions } from "../actions";
import { IAnnotationCreator } from "../states/creator";
import { v4 as uuidv4 } from "uuid";
import { userInfo } from "os";

// // Generated by llama-3.1-sonar-large
// not needed seems to works fine with os.userInfo on windows
// export async function creatorInitGetUsernameFromWin32Promise() {

//   let username = "";
//   if (process.platform === 'win32') {
//     const powershell = spawn('powershell.exe', ['[System.Security.Principal.WindowsIdentity]::GetCurrent().Name']);
//       let usernameFromPS = await new Promise<string | undefined>((resolve) => {
//       let data = '';
//       powershell.stdout.on('data', (chunk) => {
//         data += chunk.toString();
//       });
//       powershell.on('close', () => {
//         resolve(data);
//       });
//     });

//     const indexOfBackslash = usernameFromPS?.indexOf('\\');
//     username = usernameFromPS?.slice(indexOfBackslash + 1).replace(/\r\n/g, '');
//   }

//   return username;
// }

let username = "";
try {
    username = process.env.USERNAME || process.env.USER || userInfo().username;
} catch {
    // ignore
}

const initialState: IAnnotationCreator = {
    id: uuidv4(),
    type: "Organization",
    name: username,
};

function creatorReducer_(
    state = initialState,
    action: creatorActions.set.TAction,
): IAnnotationCreator {

    switch (action.type) {
        case creatorActions.set.ID:
            return {
                // state: state.state,
                id: state.id,
                type: action.payload.type,
                name: action.payload.name,
            };
        default:
            return state;
    }
}

export const creatorReducer = creatorReducer_ as Reducer<ReturnType<typeof creatorReducer_>>;
