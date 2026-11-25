import { parseArgs } from "node:util";
import { packProfile, readPublicKey, verifyProfile } from "#profile-cli/profile";

const usage = `Usage:
  node thorium-profile.cjs pack --input <directory> --output <file.thorium> --private-key <private.pem> --public-key <public.pem>
  node thorium-profile.cjs verify --input <file.thorium> --public-key <public.pem>

Requires Node.js 22.2 or newer. Keys must use EC P-521 (secp521r1).
Output files are never overwritten. The output directory must already exist.`;

async function main() {
    const { values, positionals } = parseArgs({
        options: {
            input: { type: "string" },
            output: { type: "string" },
            "private-key": { type: "string" },
            "public-key": { type: "string" },
            help: { type: "boolean", short: "h" },
        },
        allowPositionals: true,
        strict: true,
    });
    if (values.help) {
        console.log(usage);
        return;
    }
    const [command] = positionals;
    if (positionals.length !== 1 || !values.input || !values["public-key"]) {
        throw new Error(usage);
    }
    if (command === "pack") {
        if (!values.output || !values["private-key"]) throw new Error(usage);
        const output = await packProfile(values.input, values.output, values["private-key"], values["public-key"]);
        console.log(`OUTPUT= ${output}`);
    } else if (command === "verify") {
        if (values.output || values["private-key"]) throw new Error(usage);
        await verifyProfile(values.input, await readPublicKey(values["public-key"]));
        console.log(`VERIFIED= ${values.input}`);
    } else {
        throw new Error(usage);
    }
}

main().catch((error: unknown) => {
    console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
});
