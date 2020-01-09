import { apiActionFactory } from "../common/apiAction";
import { diReaderGet } from "./di";

export const apiAction = apiActionFactory(() => diReaderGet("store"));
