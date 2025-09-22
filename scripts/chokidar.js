const chokidar = require("chokidar");

const wellKnownFolder = process.argv[2] || "/tmp/chokidar";

const watcher = chokidar.watch(wellKnownFolder, {
  persistent: true, // default true

  usePolling: false, // default false
  alwaysStat: false, // default false

  depth: 0, // only current directory

  // keep .thor files
  ignored: (file, stats) => stats?.isFile() && !file.endsWith('.thor'),

  awaitWriteFinish: true, // emit single event when chunked writes are completed
  atomic: true, // emit proper events when "atomic writes" (mv _tmp file) are used // default true

  // The options also allow specifying custom intervals in ms
  // awaitWriteFinish: {
  //   stabilityThreshold: 2000,
  //   pollInterval: 100
  // },
  // atomic: 100,

//   interval: 100,
//   binaryInterval: 300,

//   cwd: '.',
//   depth: 99,

  followSymlinks: true, // symlinks are authorized !?
//   ignoreInitial: true, // doesn't emit when instanciate
  ignorePermissionErrors: true, // If watching fails due to EPERM or EACCES with this set to true, the errors will be suppressed silently.
});


watcher
  .on('add', (path) => console.log(`File ${path} has been added`))
  .on('change', (path) => console.log(`File ${path} has been changed`))
  .on('unlink', (path) => console.log(`File ${path} has been removed`));

// More possible events.
watcher
  .on('addDir', (path) => console.log(`Directory ${path} has been added`))
  .on('unlinkDir', (path) => console.log(`Directory ${path} has been removed`))
  .on('error', (error) => console.log(`Watcher error: ${error}`))
  .on('ready', () => console.log('Initial scan complete. Ready for changes in ' + wellKnownFolder))
  .on('raw', (event, path, details) => {
    // internal
    console.log('Raw event info:', event, path, details);

    // do not used
  });