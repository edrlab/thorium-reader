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
        var packageJsonString = fs.readFileSync(path.join(process.cwd(), './package.json'), { encoding: 'utf8' });
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
    var alias = options.alias || {};
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

        let forceDebug = false;
        const debug = true;

        const isR2 = /^r2-.+-js/.test(request); // EXTERNAL
        const isRDesk = request.indexOf("readium-desktop/") === 0; // BUNDLE

        // EXTERNAL (built-ins)
        const isElectron = request.indexOf("electron") === 0;
        const isNode = request.indexOf("fs") === 0 ||
            request.indexOf("path") === 0;

        const isRelative = request.indexOf(".") === 0;
        const isRelativeInNodeModules = isRelative && context.indexOf("/node_modules/") >= 0;

        const isWebPack = request.indexOf("webpack") >= 0 ||
            isRelative && context.indexOf("/node_modules/webpack") >= 0;

        const isCSSLoader = request.indexOf("css-loader") >= 0 || request.indexOf("css-hot-loader") >= 0;

        const isCSS = request.endsWith(".css");
        const isSVG = request.endsWith(".svg");

        const token = isRelative ? context + request : request;
        const isAlready = alreadyProcessed.indexOf(token) >= 0;
        if (!isAlready) {
            alreadyProcessed.push(token);
        }

        const isR2Alias = /^@r2-.+-js/.test(request); // EXTERNAL
        if (isR2Alias || isRelativeInNodeModules || isWebPack || isSVG || isCSS || isCSSLoader) {
            forceDebug = true;
        }

        // doesn't necessarily mean that WebPack will bundle, just that it won't externalize
        const makeBundle = isWebPack || isSVG || isCSS || isCSSLoader ||
            (!isR2 && !isR2Alias && !isRelativeInNodeModules &&
            (isRDesk || isRelative || isElectron || isNode));
        let makeExternal = !makeBundle;
        if (makeExternal &&
            !isR2 && !isR2Alias && !isRelativeInNodeModules) {
            const moduleName = getModuleName(request, includeAbsolutePaths);
            makeExternal = contains(nodeModules, moduleName) && !containsPattern(whitelist, request);
            if (forceDebug ||
                (debug &&
                !makeExternal &&
                !isAlready)) {
                console.log(processName + "__ LOOKUP: [" + request + "] " + context + " (" + moduleName + ")");
            }
        }


        if (makeExternal) {

            if (forceDebug ||
                (debug &&
                !isAlready &&
                !isR2 && !isR2Alias)) {
                console.log(processName + "__ EXTERNAL: [" + request + "] " + context);
            }

            // mark this module as external
            // https://webpack.github.io/docs/configuration.html#externals
            // https://webpack.js.org/configuration/externals/

            let request_ = request;
            if (isR2Alias && alias) {
                const iSlash = request.indexOf("/");
                const key = request.substr(0, (iSlash >= 0) ? iSlash : request.length);
                if (alias[key]) {
                    request_ = request.replace(key, alias[key]);

                    if (forceDebug || debug) {
                        console.log(processName + "__ ALIAS: [" + request + "] => " + request_);
                    }
                }
            } else if (isRelativeInNodeModules) {
                request_ = request_.replace("./", "");
                request_ = context + "/" + request_;
                request_ = request_.replace(/^.*?\/node_modules\//, '');
                if (forceDebug || debug) {
                    console.log(processName + "__ RELATIVE: [" + request + "] => " + request_);
                }
            }
            return callback(null, importType + " " + request_);
        };


        if (forceDebug ||
            (debug &&
            !isAlready &&
            !isRDesk &&
            !isElectron &&
            !isNode)) {
            console.log(processName + "__ BUNDLE: [" + request + "] " + context);
        }
        callback();
    }
}
