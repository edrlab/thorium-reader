import { apiActionFactory } from "../common/apiAction";
import { diRendererGet } from "./di";

export const apiAction = apiActionFactory(() => diRendererGet("store"));
