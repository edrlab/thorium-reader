import { combineReducers } from "redux";
import { i18n, I18NState } from "./i18n";

export interface IAppState {
  i18n: I18NState;
}

export const app = combineReducers({
  i18n,
});
