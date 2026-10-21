// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { ToastType } from "readium-desktop/common/models/toast";
import { toastActions } from "readium-desktop/common/redux/actions";
import { getTranslator } from "readium-desktop/common/services/translator";
import { TTranslatorKeyParameter } from "readium-desktop/typings/en.translation-keys";
import { SagaGenerator } from "typed-redux-saga";
import { call as callTyped, put as putTyped, getContext as getContextTyped } from "typed-redux-saga/macro";

const debug = debug_("readium-desktop:main:saga:api:operation");

// Opt in at the API operation boundary, leaving internal service calls and
// background reads free to recover or display their own inline errors.
export function withErrorNotification<Args extends unknown[], Result>(
    operation: (...args: Args) => SagaGenerator<Result>,
    message: TTranslatorKeyParameter,
): (...args: Args) => SagaGenerator<Result> {
    return function* notifyOperation(...args: Args): SagaGenerator<Result> {
        try {
            return yield* callTyped(operation, ...args);
        } catch (error) {
            debug("Operation failed", message, error);
            // Nested calls may be part of an import retry or background cleanup.
            // Only the operation requested by the renderer presents this failure.
            const owner = yield* getContextTyped<unknown>("apiNotificationOwner");
            if (owner === notifyOperation) {
                const windowIdentifier = yield* getContextTyped<string | undefined>("toastWindowIdentifier");
                yield* putTyped({
                    ...toastActions.openRequest.build(ToastType.Error, getTranslator().translate(message)),
                    ...(windowIdentifier ? { destination: { identifier: windowIdentifier } } : {}),
                });
            }
            throw error;
        }
    };
}
