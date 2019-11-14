const fs = require('fs');
let pkg = fs.readFileSync(process.argv[2], { encoding: 'utf8' });
pkg = pkg.replace(/^  "version": "(.+)",$/m, `  "version": "$1.${process.argv[3]}",`);
pkg = pkg.replace(/^ [ ]*"leveldown": .*$/m, "");
pkg = pkg.replace(/^ [ ]*"pouchdb-adapter-leveldb": .*$/m, "");
pkg = pkg.replace(/^ [ ]*"appx",$/m, "");
// console.log(pkg.substr(0, 100));
fs.writeFileSync(process.argv[2], pkg, { encoding: 'utf8' });
