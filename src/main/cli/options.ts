// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export const SHARED_COMPUTER_CLI_OPTION = "shared-computer";
export const SHARED_COMPUTER_CLI_SWITCH = `--${SHARED_COMPUTER_CLI_OPTION}`;
export const SHARED_COMPUTER_CLI_NEGATED_SWITCH = `--no-${SHARED_COMPUTER_CLI_OPTION}`;

export const isSharedComputerCliSwitch = (str: string) => [
    SHARED_COMPUTER_CLI_SWITCH,
    SHARED_COMPUTER_CLI_NEGATED_SWITCH,
].includes(str) || str.startsWith(`${SHARED_COMPUTER_CLI_SWITCH}=`);
