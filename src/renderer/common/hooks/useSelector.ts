import * as React from "react";
import { ReactReduxContext, ReactReduxContextValue } from "react-redux";
import { useSyncExternalStore } from "./useSyncExternalStore";

export function useSelector<State, Selected>(selector: (state: State) => Selected): Selected {

    const {store} = React.useContext<ReactReduxContextValue<State>>(ReactReduxContext);
    const selected = useSyncExternalStore(store.subscribe, () => selector(store.getState()));
    return selected;
}
