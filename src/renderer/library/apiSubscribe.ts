import { apiSubscribeFactory } from "../common/apiSubscribe";
import { diRendererGet } from "./di";

export const apiSubscribe = apiSubscribeFactory(() => diRendererGet("store"));
