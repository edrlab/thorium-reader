import * as React from "react";
import { ReactReduxContext} from 'react-redux'
import { Action } from "../../../common/models/redux";

export function useDispatch(action: Action) {

    const {store} = React.useContext(ReactReduxContext);
    const actionReturned = store.dispatch(action);
    return actionReturned;
}