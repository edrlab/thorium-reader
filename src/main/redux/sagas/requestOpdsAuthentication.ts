// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { randomUUID } from "node:crypto";
import { authActions } from "readium-desktop/common/redux/actions";
import { diMainGet } from "readium-desktop/main/di";
import type { OPDSAuthenticationDoc } from "@r2-opds-js/opds/opds2/opds2-authentication-doc";
import { actionChannel as actionChannelTyped, call as callTyped, delay as delayTyped,
    put as putTyped, race as raceTyped, take as takeTyped } from "typed-redux-saga/macro";
import { submitInlineAuthentication } from "./inlineAuthentication";

type TCompletionAction = authActions.promptResult.TAction | authActions.prompt.TAction | authActions.externalRequest.TAction;

export function* requestOpdsAuthentication(doc: OPDSAuthenticationDoc, url: string) {
    const view = diMainGet("opds-feed-view-converter").convertOpdsAuthToView(doc, url);
    if (!view.auth?.credentialsUrl) return false;
    const requestId = randomUUID();
    // Subscribe before showing the form, including synchronous replacements or cancellation.
    const submissions = yield* actionChannelTyped((action: { type: string }): action is authActions.submit.TAction =>
        action.type === authActions.submit.ID && (action as authActions.submit.TAction).payload.options?.promptId === requestId);
    const completions = yield* actionChannelTyped((action: { type: string }): action is TCompletionAction => {
        const event = action as TCompletionAction;
        return (event.type === authActions.promptResult.ID && event.payload.requestId === requestId)
            || (event.type === authActions.prompt.ID && !!event.payload.view && event.payload.requestId !== requestId)
            || (event.type === authActions.externalRequest.ID && event.payload.command !== "cancel"
                && event.payload.promptId !== requestId);
    });
    try {
        yield* putTyped(authActions.prompt.build(requestId, view));
        const result = yield* raceTyped({
            credentials: callTyped(function* () {
                while (true) {
                    const submission = yield* takeTyped(submissions);
                    if (yield* callTyped(submitInlineAuthentication, submission)) return true;
                }
            }),
            completion: takeTyped(completions),
            expired: delayTyped(240000),
        });
        return !!(result.credentials || (result.completion?.type === authActions.promptResult.ID
            && result.completion.payload.success));
    } finally {
        submissions.close();
        completions.close();
        yield* putTyped(authActions.prompt.build(requestId));
    }
}
