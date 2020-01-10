import { apiSubscribeFactory } from "../common/apiSubscribe";
import { diLibraryGet } from "./di";

export const apiSubscribe = apiSubscribeFactory(() => diLibraryGet("store"));
