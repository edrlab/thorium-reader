import "./build.mjs";
import { installHarnessServerShutdown, startHarnessServer } from "./serve.mjs";

const port = Number(process.argv[2]) || 4173;
const server = await startHarnessServer(port);
installHarnessServerShutdown(server);
