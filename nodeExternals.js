// const nodeExternals = require("webpack-node-externals");
// module.exports = nodeExternals;

// https://raw.githubusercontent.com/liady/webpack-node-externals/master/index.js

var fs = require("fs");
var path = require("path");

var scopedModuleRegex = new RegExp('@[a-zA-Z0-9][\\w-.]+\/[a-zA-Z0-9][\\w-.]+([a-zA-Z0-9.\/]+)?', 'g');
var atPrefix = new RegExp('^@', 'g');
function contains(arr, val) {
    return arr && arr.indexOf(val) !== -1;
}

function readDir(dirName) {
    try {
        return fs.readdirSync(dirName).map(function(module) {
            if (atPrefix.test(module)) {
                // reset regexp
                atPrefix.lastIndex = 0;
                try {
                    return fs.readdirSync(path.join(dirName, module)).map(function(scopedMod) {
                        return module + '/' + scopedMod;
                    });
                } catch (e) {
                    return [module];
                }
            }
            return module
        }).reduce(function(prev, next) {
            return prev.concat(next);
        }, []);
    } catch (e) {
        console.log(e);
        return [];
    }
}

function readFromPackageJson() {
    var packageJson;
    try {
        var packageJsonString = fs.readFileSync(path.join(process.cwd(), './package.json'), 'utf8');
        packageJson = JSON.parse(packageJsonString);
    } catch (e){
        return [];
    }
    var sections = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
    var deps = {};
    sections.forEach(function(section){
        Object.keys(packageJson[section] || {}).forEach(function(dep){
            deps[dep] = true;
        });
    });
    return Object.keys(deps);
}

function containsPattern(arr, val) {
    return arr && arr.some(function(pattern){
        if(pattern instanceof RegExp){
            return pattern.test(val);
        } else if (typeof pattern === 'function') {
            return pattern(val);
        } else {
            return pattern == val;
        }
    });
}

function getModuleName(request, includeAbsolutePaths) {
    var req = request;
    var delimiter = '/';

    if (includeAbsolutePaths) {
        req = req.replace(/^.*?\/node_modules\//, '');
    }
    // check if scoped module
    if (scopedModuleRegex.test(req)) {
        // reset regexp
        scopedModuleRegex.lastIndex = 0;
        return req.split(delimiter, 2).join(delimiter);
    }
    return req.split(delimiter)[0];
}

module.exports = function nodeExternals(options) {

    options = options || {};
    var processName = options.processName || '??';
    var whitelist = [].concat(options.whitelist || []);
    var binaryDirs = [].concat(options.binaryDirs || ['.bin']);
    var importType = options.importType || 'commonjs';
    var modulesDir = options.modulesDir || 'node_modules';
    var modulesFromFile = !!options.modulesFromFile;
    var includeAbsolutePaths = !!options.includeAbsolutePaths;

    // helper function
    function isNotBinary(x) {
        return !contains(binaryDirs, x);
    }

    // create the node modules list
    var nodeModules = modulesFromFile ? readFromPackageJson() : readDir(modulesDir).filter(isNotBinary);

    const alreadyProcessed = [];

    // return an externals function
    return function(context, request, callback){

        const debug = true;

        const isR2 = /^r2-.+-js/.test(request); // EXTERNAL
        const isRDesk = request.indexOf("readium-desktop/") === 0; // BUNDLE

         // EXTERNAL (built-ins)
        const isElectron = request.indexOf("electron") === 0;
        const isNode = request.indexOf("fs") === 0 ||
                       request.indexOf("path") === 0;

        const isRelative = request.indexOf(".") === 0;
        const isRelativeInNodeModules = isRelative && context.indexOf("/node_modules/") >= 0;

        const token = isRelative ? context + request : request;
        const isAlready = alreadyProcessed.indexOf(token) >= 0;
        if (!isAlready) {
            alreadyProcessed.push(token);
        }

        // doesn't necessarily mean that WebPack will bundle, just that it won't externalize
        const makeBundle = !isR2 && !isRelativeInNodeModules &&
            (isRDesk || isRelative || isElectron || isNode ||
                request === "xxxpouchdb-core" // No need to force-bundle, as we now fixed di.ts to test for "default" property
            );
        let makeExternal = !makeBundle;
        if (makeExternal &&
            !isR2 && !isRelativeInNodeModules) {
            const moduleName = getModuleName(request, includeAbsolutePaths);
            makeExternal = contains(nodeModules, moduleName) && !containsPattern(whitelist, request);
            if (debug &&
                !makeExternal &&
                !isAlready) {
                console.log(processName + "__ LOOKUP: [" + request + "] " + context + " (" + moduleName + ")");
            }
        }


        if (makeExternal) {

            if (debug &&
                !isAlready &&
                !isR2) {
                console.log(processName + "__ EXTERNAL: [" + request + "] " + context);
            }

            // mark this module as external
            // https://webpack.github.io/docs/configuration.html#externals
            // https://webpack.js.org/configuration/externals/

            //  MAKES NO DIFFERENCE
            // if (request === "pouchdb-core") {
            //     console.log("pouchdb-core CommonJS2");
            //     return callback(null, "commonjs2 " + request);
            // }

            return callback(null, importType + " " + request);
        };


        if (debug &&
            !isAlready &&
            !isRDesk &&
            !isElectron &&
            !isNode) {
            console.log(processName + "__ BUNDLE: [" + request + "] " + context);
        }
        callback();
    }
}
