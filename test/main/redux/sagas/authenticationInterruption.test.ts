import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { runSaga, stdChannel } from "redux-saga";
import { take } from "redux-saga/effects";
import { authActions } from "readium-desktop/common/redux/actions";
import { requestOpdsAuthentication } from "readium-desktop/main/redux/sagas/requestOpdsAuthentication";
import type { OPDSAuthenticationDoc } from "@r2-opds-js/opds/opds2/opds2-authentication-doc";

jest.mock("typed-redux-saga/macro", () => jest.requireActual("typed-redux-saga"));
jest.mock("readium-desktop/main/di", () => ({ diMainGet: () => ({
    convertOpdsAuthToView: (_doc: unknown, url: string) => ({ title: "Download", auth: { credentialsUrl: url } }),
}) }));
jest.mock("readium-desktop/main/redux/sagas/inlineAuthentication", () => ({
    submitInlineAuthentication: function* (action: authActions.submit.TAction) {
        yield take("VALIDATED");
        return action.payload.password === "valid";
    },
}));

const url = "https://example.org/download";
const flush = () => new Promise<void>(resolve => setImmediate(resolve));
const running: ReturnType<typeof runSaga>[] = [];
const fixture = (onPrompt?: (action: authActions.prompt.TAction) => void) => {
    const input = stdChannel();
    const actions: any[] = [];
    const dispatch = (action: any) => {
        actions.push(action);
        input.put(action);
        if (action.type === authActions.prompt.ID && action.payload.view) onPrompt?.(action);
    };
    const request = () => {
        const task = runSaga({ dispatch, channel: input }, requestOpdsAuthentication, {} as OPDSAuthenticationDoc, url);
        running.push(task);
        const id = actions.filter(action => action.type === authActions.prompt.ID && action.payload.view).at(-1).payload.requestId;
        return { task, id };
    };
    return { input, actions, request };
};
afterEach(async () => {
    for (const task of running.splice(0)) { task.cancel(); await task.toPromise(); }
    jest.useRealTimers();
});

describe("download inline authentication", () => {
    it("interrupts only the replaced download when two requests use the same URL", async () => {
        const f = fixture(); const first = f.request(); const second = f.request();
        expect(await first.task.toPromise()).toBe(false);
        expect(second.task.isRunning()).toBe(true);
        f.input.put(authActions.promptResult.build(first.id, true));
        expect(second.task.isRunning()).toBe(true);
        f.input.put(authActions.promptResult.build(second.id, true));
        expect(await second.task.toPromise()).toBe(true);
        expect(f.actions).not.toContainEqual(authActions.cancel.build());
    });

    it("waits for its own credential submission and allows another attempt after rejection", async () => {
        const f = fixture(); const request = f.request();
        f.input.put(authActions.submit.build(url, "reader", "valid", { promptId: "unrelated" }));
        f.input.put(authActions.done.build());
        expect(request.task.isRunning()).toBe(true);
        f.input.put(authActions.submit.build(url, "reader", "wrong", { promptId: request.id }));
        f.input.put({ type: "VALIDATED" }); await flush();
        expect(request.task.isRunning()).toBe(true);
        f.input.put(authActions.submit.build(url, "reader", "valid", { promptId: request.id }));
        f.input.put({ type: "VALIDATED" });
        expect(await request.task.toPromise()).toBe(true);
        expect(f.actions.at(-1)).toEqual(authActions.prompt.build(request.id));
    });

    it("cancels an in-flight submission when the user dismisses the form", async () => {
        const f = fixture(); const request = f.request();
        f.input.put(authActions.submit.build(url, "reader", "valid", { promptId: request.id }));
        f.input.put(authActions.promptResult.build(request.id, false));
        expect(await request.task.toPromise()).toBe(false);
        expect(f.actions.at(-1)).toEqual(authActions.prompt.build(request.id));
    });

    it("releases a download when a catalog login replaces it", async () => {
        const f = fixture(); const request = f.request();
        f.input.put(authActions.externalRequest.build(url, "catalog", "start"));
        expect(await request.task.toPromise()).toBe(false);
    });

    it("keeps the request pending while its external login starts or retries", async () => {
        const f = fixture(); const request = f.request();
        for (const command of ["start", "retry"] as const) {
            f.input.put(authActions.externalRequest.build(url, request.id, command, undefined, request.id));
            expect(request.task.isRunning()).toBe(true);
        }
        f.input.put(authActions.promptResult.build(request.id, true));
        expect(await request.task.toPromise()).toBe(true);
    });

    it("does not miss a dismissal dispatched while showing the prompt", async () => {
        let f: ReturnType<typeof fixture>;
        f = fixture(action => f.input.put(authActions.promptResult.build(action.payload.requestId, false)));
        const request = f.request();
        expect(await request.task.toPromise()).toBe(false);
    });

    it("clears the inline prompt when the download itself is cancelled", async () => {
        const f = fixture(); const request = f.request();
        request.task.cancel(); await request.task.toPromise();
        expect(f.actions.at(-1)).toEqual(authActions.prompt.build(request.id));
    });

    it("expires an abandoned credential prompt", async () => {
        jest.useFakeTimers({ doNotFake: ["setImmediate"] });
        const f = fixture(); const request = f.request();
        await jest.advanceTimersByTimeAsync(240000);
        expect(await request.task.toPromise()).toBe(false);
        expect(f.actions.at(-1)).toEqual(authActions.prompt.build(request.id));
    });
});
