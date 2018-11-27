import * as util from "util";

// Dump object
export function dump(obj: any) {
    return util.inspect(
        obj,
        {
            showHidden: false,
            depth: 10,
            colors: true,
            customInspect: true
        }
    );
}
