import * as crypto from "crypto";

export function toSha256Hex(data: string) {
    const checkSum = crypto.createHash("sha256");
    checkSum.update(data);
    return checkSum.digest("hex");
}
