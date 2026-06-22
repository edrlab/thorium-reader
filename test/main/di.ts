import * as os from "os";
import * as path from "path";

export const userPublicationDirectoryConfigPath = path.join(
    os.tmpdir(),
    "thorium-test-user-publication-directory.json",
);

export const lcpHashesFilePath = path.join(os.tmpdir(), "thorium-test-lcp-hashes.json");
export const lcpLsdDevicesFilePath = path.join(os.tmpdir(), "thorium-test-lcp-lsd-devices.json");

export const diSymbolTable = new Proxy(
    {},
    {
        get: (_target, property) => property,
    },
);

export const diMainGet = (): never => {
    throw new Error("diMainGet is not available in this isolated Jest test stub");
};
