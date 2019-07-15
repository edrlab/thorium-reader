// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app } from "electron";
import { ICli, ICliParam } from "readium-desktop/main/cli/commandLine";
import { Arguments } from "yargs";

declare const __APP_NAME__: string;
declare const __APP_VERSION__: string;

// Logger
const debug = debug_("readium-desktop:cli");

export async function processCommandLine(commandLine: ICli[], argv: Arguments): Promise<boolean> {

    const param: ICliParam = {
        argv,
        quit: false,
    };
    debug("param: ", param);
    let returnCode = 0;

    // assign arg and remove $0
    const arg = Object.keys(argv);
    arg.splice(arg.indexOf("$0"), 1);

    // print help and quit
    if (arg.indexOf("help") > -1 || arg.indexOf("h") > -1) {
        process.stdout.write(`${__APP_NAME__} ${__APP_VERSION__}\n`);
        process.stdout.write("\n");
        process.stdout.write(`Usage: ${argv.$0} [options][paths...]\n`);
        process.stdout.write("\n");
        process.stdout.write(`Options\n`);
        commandLine.map((v) => {
            if (v.help.length) {
                process.stdout.write(` ${v.help[0]}\t\t${v.help[1] ? v.help[1] : ""}\n`);
            }
        });
        param.quit = true;
    } else {
        // execute all commands
        const commandPromiseTab = arg.map((command) => {
            const op = commandLine.find((c) => c.name === command);
            if (op && (op.name !== "_" || argv._.length)) {
                    return op.fct(param);
            }
        });

        try {
            const commandRes = await Promise.all(commandPromiseTab);
            const ifFalse = commandRes.indexOf(false);
            returnCode = ifFalse < 0 ? 0 : 1;
        } catch (e) {
            returnCode = 1;
        }
    }

    if (param.quit) {
        app.exit(returnCode);
        return true;
    }
    return false;
}
