const builder = require("electron-builder");
const jsonPackage = require("../package.json");

const packager = new builder.Packager({
    config: jsonPackage.build,
});

packager
    .build()
    .then(() => {
        console.log('done');
    }).catch((error) => {
        console.log(error);
    })
