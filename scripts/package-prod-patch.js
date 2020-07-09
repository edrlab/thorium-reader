const fs = require('fs');

let pkg = fs.readFileSync(process.argv[2], { encoding: 'utf8' });
if (!process.env.TRAVIS_OS_NAME_) {
    pkg = pkg.replace(/^ [ ]*"sqlite3": .*$/m, "");
    pkg = pkg.replace(/^ [ ]*"pouchdb-adapter-node-websql": .*$/m, "");
} else {
    pkg = pkg.replace(/^ [ ]*"leveldown": .*$/m, "");
    pkg = pkg.replace(/^ [ ]*"pouchdb-adapter-leveldb": .*$/m, "");
}
// console.log(pkg.substr(0, 100));
fs.writeFileSync(process.argv[2], pkg, { encoding: 'utf8' });
