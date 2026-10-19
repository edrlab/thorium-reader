// Audit-only bundles. Inherit each renderer's loaders and runtime scope checker.
const path = require('node:path');
const fs = require('node:fs');
const webpack = require('webpack');
process.env.SKIP_CHECK_TYPESCRIPT = '1';
const log = console.log;
console.log = () => {};
const configs = ['library', 'reader'].map(runtime => {
    const config = require(`../../webpack.config.renderer-${runtime}.js`);
    config.entry = path.resolve(__dirname, `fixture-${runtime}.tsx`);
    config.output = { ...config.output, path: path.resolve('dist/accessibility-fixtures'), filename: `${runtime}.js`, publicPath: '' };
    config.devtool = false;
    config.plugins = config.plugins.filter(p => p.constructor.name === 'DefinePlugin');
    config.plugins.push(new webpack.NormalModuleReplacementPlugin(/createStore|apiAction/, resource => {
        const resolved = resource.request.startsWith('.') ? path.resolve(resource.context, resource.request).replaceAll('\\', '/') : resource.request;
        if (/renderer\/(library|reader)\/(createStore|apiAction)(\.ts)?$/.test(resolved)) {
            resource.request = path.resolve(__dirname, 'fixture-services.ts');
        }
    }));
    return config;
});
webpack(configs, (error, stats) => {
    console.log = log;
    if (error) throw error;
    const result = stats.toJson({ all: false, errors: true, warnings: true, timings: true });
    fs.mkdirSync('dist/accessibility-fixtures', { recursive: true });
    fs.writeFileSync('dist/accessibility-fixtures/build.json', JSON.stringify(result, null, 2));
    console.log(stats.toString({ all: false, errors: true, timings: true }));
    process.exitCode = stats.hasErrors() ? 1 : 0;
});
