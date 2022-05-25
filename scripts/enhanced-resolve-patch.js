// https://github.com/valeriangalliat/fetch-cookie/issues/72

const fs = require('fs');
const path = require('path');

const filePath = path.join('node_modules', 'enhanced-resolve', 'lib', 'util', 'entrypoints.js');

let pkg = fs.readFileSync(filePath, { encoding: 'utf8' });

pkg = pkg.replace(/i !== last/m, 'false /* i !== last */');

fs.writeFileSync(filePath, pkg, { encoding: 'utf8' });
