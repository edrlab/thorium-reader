import { apiSubscribeFactory } from "../common/apiSubscribe";
import { diReaderGet } from "./di";

export const apiSubscribe = apiSubscribeFactory(() => diReaderGet("store"));
