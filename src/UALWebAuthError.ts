import { UALError, UALErrorType } from "universal-authenticator-library";
import { APIError } from "@greymass/eosio";
import { Name } from "./interfaces";

export class UALWebAuthError extends UALError {
    constructor(
        message: string,
        type: UALErrorType,
        cause: APIError | unknown | null
    ) {
        let m = message;
        let e: any = new Error(message);
        if (cause instanceof APIError) {
            if (cause.details && cause.details[0]) {
                m = cause.details[0].message;
                e = new Error(cause.details[0].message);
            }
            e.json = {
                code: 500,
                error: cause.error,
                message: "Internal Service Error",
            };
        }
        super(m, type, e, Name);
    }
}
