import { injectable} from "inversify";

import { CodeError } from "readium-desktop/common/errors";

@injectable()
export class ActionSerializer {
    public serialize(action: any) {
        if (action.error && action.payload instanceof CodeError) {
            return Object.assign(
                {},
                action,
                {
                    payload: action.payload.toJson(),
                },
            );
        } else {
            return action;
        }
    }

    public deserialize(json: any): any {
        if (json.error &&
            json.payload.class &&
            json.payload.class === "CodeError"
        ) {
            return Object.assign(
                {},
                json,
                {
                    payload: new CodeError(
                        json.payload.code,
                        json.payload.message,
                    ),
                },
            );
        } else {
            return json;
        }
    }
}
