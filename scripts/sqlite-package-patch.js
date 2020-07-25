const fs = require('fs');

try {
    let pkg = fs.readFileSync(process.argv[2], { encoding: 'utf8' });
    pkg = pkg.replace(/^ [ ]*"sqlite3": .*$/m, " \"sqlite3\": \"^5.0.0\",");
    // console.log(pkg.substr(0, 100));
    fs.writeFileSync(process.argv[2], pkg, { encoding: 'utf8' });
} catch (err) {
    console.log(err);
}
