// https://github.com/piecyk/tsc-webpack-plugin/blob/main/index.js

const path = require("path");
const os = require("os");

// package.json BETA!
// "node-pty": "^1.1.0-beta34",
// const pty = require("node-pty");
const { spawn } = require("child_process");

class TsgoError extends Error {
  constructor(message) {
    super(message);
    this.name = "TsgoError";
    this.stack = "";
  }
}

const removeNewLinesAtEnd = (str) => str.replace(/(\r\n|\n|\r)+$/g, "");

const PLUGIN_NAME = "tsgo-plugin";

class TsgoWebpackPlugin {
  constructor(options = {}) {
    this.name = options.name;
    if (options.name) {
        options.name = undefined;
        delete options.name;
    }
    this.options = options;
    this.initialized = false;
  }
  async apply(compiler) {
    const isWatch = await new Promise((resolve) => {
      compiler.hooks.run.tap(PLUGIN_NAME, () => {
        if (!this.initialized) {
          this.initialized = true;

          resolve(false);
        }
      });

      compiler.hooks.watchRun.tap(PLUGIN_NAME, () => {
        if (!this.initialized) {
          this.initialized = true;

          resolve(true);
        }
      });
    });

    const file = path.resolve(
      compiler.context,
      `./node_modules/.bin/tsgo${os.platform() === "win32" ? ".exe" : ""}`
    );

    const options = {
      ...this.options,
      ...(isWatch ? { watch: "", preserveWatchOutput: "" } : {}),
    };

    const args = [
      ...new Set(
        Object.keys(options)
          .reduce((acc, key) => [...acc, `--${key}`, String(options[key])], [])
          .filter(Boolean)
      ),
    ];

    // const ptyProcess = pty.spawn(file, args, {
    //   name: "xterm-color",
    // });
    const childProcess = spawn(file, args);

    process.once("exit", () => {
      // ptyProcess.emit("exit");
      childProcess.kill();
    });

    const logger = compiler.getInfrastructureLogger(PLUGIN_NAME);

    let messages = [];

    const onData = (data_) => {
        const data = data_.toString();
        const d = removeNewLinesAtEnd(data);
        if (!d.includes("build starting") && (!d.includes("build finished") || d.includes("error"))) {
            process.stderr.write("\x07"); // beep
        }

        // console.log(`==TSGO[${this.name}] data:`);
        // logger.info(`--TSGO[${this.name}] data:`);
        // console.log(d);
        logger.info(d);
        if (!isWatch) {
            messages.push(data);
        }
    };

    // ptyProcess.onData(onData);
    childProcess.stdout.on('data', onData);
    childProcess.stderr.on('data', onData);

    if (isWatch) {
      // console.log(`==TSGO[${this.name}] start (watch)...`);
      logger.info(`--TSGO[${this.name}] start (watch)...`);

      // ptyProcess.onExit((e) => {
      //   process.exit(e.exitCode);
      // });
      childProcess.on('close', (code) => {
        process.exit(code);
      });
    } else {
      // console.log(`==TSGO[${this.name}] start (not watch)...`);
      logger.info(`--TSGO[${this.name}] start (not watch)...`);

      compiler.hooks.afterEmit.tapPromise(PLUGIN_NAME, async (compilation) => {
        // console.log(`==TSGO[${this.name}] compiler.hooks.afterEmit.tapPromise...`);
        logger.info(`--TSGO[${this.name}] compiler.hooks.afterEmit.tapPromise...`);

        await new Promise((resolve) => {
          // ptyProcess.onExit(() => {
          //   resolve();
          // });
          childProcess.on('close', () => {
            resolve();
          });
        });

        if (messages.length > 0) {
          // console.log(`==TSGO[${this.name}] ${messages.length} errors!`);
          logger.info(`--TSGO[${this.name}] ${messages.length} errors!`);

          messages
            .map((m) =>
              removeNewLinesAtEnd(
                m
                  .split("\r\n")
                  .map((s) => s.replace(/^Found \d+ errors?\b.$/, ""))
                  .join("\r\n")
              )
            )
            .filter(Boolean)
            .map((m) => compilation.errors.push(new TsgoError(m)));

          messages = [];
        } else {
          // console.log(`--TSGO[${this.name}] zero errors.`);
          logger.info(`==TSGO[${this.name}] zero errors.`);
        }
      });
    }
  }
}

module.exports = TsgoWebpackPlugin;
