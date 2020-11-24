
export interface IStore<T> {
    getState: () => T;
    setState: (a: Partial<T>) => T;
    subscribe: (key: keyof T, fn: (...a: any[]) => any) => void;
    unsubscribe: (fn: (...a: any[]) => any) => void;
}

export const storeInit = <TStateValue = {}, TCallbackInjection extends {} = {}>(
    state: TStateValue,
    di: TCallbackInjection = {} as TCallbackInjection,
    callbackArray: {[key: string]: Set<(...a: any[]) => any>} = {},
): IStore<TStateValue> => ({
    getState: () => state,
    setState: (newState: Partial<TStateValue>) => (
        state = { ...state, ...newState },
        Object.keys(newState).forEach((key) => callbackArray[key]?.forEach((fn) => fn ? fn(di) : undefined)),
        state
    ),
    subscribe: (key: keyof TStateValue, fn: (di: TCallbackInjection) => any) =>
        (callbackArray[key as string] =
            (callbackArray[key as string] || new Set<(a: any[]) => any>()).add(fn), undefined),
    unsubscribe: (fn: (...a: any[]) => any) => Object.values(callbackArray).forEach((v) => v?.delete(fn)),
});
