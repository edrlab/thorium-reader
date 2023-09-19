import * as React from "react";
import { ReactReduxContext, ReactReduxContextValue } from "react-redux";

export function useSelector<State, Selected>(selector: (state: State) => Selected): Selected {

    const {store} = React.useContext<ReactReduxContextValue<State>>(ReactReduxContext);
    const selected = React.useSyncExternalStore(store.subscribe, () => selector(store.getState()));
    return selected;
}
