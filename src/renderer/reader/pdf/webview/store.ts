
export interface IStore<T> {
    getState: () => T;
    setState: (a: Partial<T>) => T;
}

export const storeInit = <TStateValue = {}>(state: TStateValue): IStore<TStateValue> => ({
    getState: () => state,
    setState: (newState: Partial<TStateValue>) => (state = { ...state, ...newState }, state),
});
