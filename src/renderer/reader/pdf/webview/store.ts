
type TFn<Key extends keyof Second = any, First = any, Second = any, Ret = any> = (a: First) => (b: Second[Key]) => Ret;

type TNewStateRet<T, P extends keyof T> = T[P] | Promise<T[P]>;
type TNEWState<T> = {
    [P in keyof T]?: TNewStateRet<T, P>;
};

export interface IStore<T, T2> {
    getState: () => T;
    setState: (a: TNEWState<T>) => void;
    subscribe: <TK extends keyof T>(key: TK, fn: TFn<TK, T2, T>) => void;
    unsubscribe: (fn: TFn) => void;
    pipe: <TK extends keyof T>(key: TK, fn: TFn<TK, T2, T, Promise<T[TK]> | T[TK]>) => void;
    unpipe: (fn: TFn) => void;
}

export const storeInit = <TStateValue = {}, TCallbackInjection extends {} = {}>(
    state: TStateValue,
    di: TCallbackInjection = {} as TCallbackInjection,
    callbackArray: { [key: string]: Set<TFn> } = {},
    pipeArray: { [key: string]: Set<TFn> } = {},
): IStore<TStateValue, TCallbackInjection> => ({
    getState: () => state,
    setState: (newState) => (
        newState = Object.entries(newState)
            .reduce(
                (pv, [key, value]) => ({
                    ...pv,
                    [key]:
                        pipeArray[key]
                            ? Array.from(pipeArray[key])
                                .reduce(
                                    (vP, fn) =>
                                        vP.then((v) => Promise.resolve(fn(di)(v))),
                                    Promise.resolve(value),
                                )
                            : Promise.resolve(value),
                }),
                {},
            ),
        (Object.entries(newState) as Array<[string, Promise<unknown>]>)
            .forEach(([key, value]) =>
                value.then((v) => state = { ...state, [key]: v })),
        (Object.entries(newState) as Array<[string, Promise<unknown>]>)
            .forEach(([key, value]) =>
                callbackArray[key]?.forEach((fn) =>
                    (value as Promise<unknown>).then((v) => fn(di)(v)))),
        undefined
    ),
    subscribe: (key, fn) => (
        callbackArray[key as string] =
        (callbackArray[key as string] || new Set()).add(fn),
        undefined
    ),
    unsubscribe: (fn) => (
        Object.values(callbackArray).forEach((v) => v?.delete(fn)),
        undefined
    ),
    pipe: (key, fn) => (
        pipeArray[key as string] =
        (pipeArray[key as string] || new Set()).add(fn),
        undefined
    ),
    unpipe: (fn) => (
        Object.values(pipeArray).forEach((v) => v?.delete(fn)),
        undefined
    ),
});
