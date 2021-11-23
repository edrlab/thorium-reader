const fs = require('fs');
let pkg = fs.readFileSync('package-lock.json', { encoding: 'utf8' });
pkg = pkg.replace(/"git\+ssh:\/\/git@github\.com\//g, '"git+https://github.com/');
pkg = pkg.replace(/(\/readium\/divina-player-js\.git[^"]+",)[\r\n\s]+"integrity": "[^"]+",$/gm, "$1");
fs.writeFileSync('package-lock.json', pkg, { encoding: 'utf8' });
