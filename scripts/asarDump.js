// console.log(process.argv);
// console.log(process.mainModule.filename);
// console.log(__filename);
// console.log(__dirname);

var fs = require("fs");
var path = require("path");
var pickle = require('chromium-pickle-js');

var readArchiveHeaderSync = function (archive) {
    var fd = fs.openSync(archive, 'r');
    var size;
    var headerBuf;
    try {
        var sizeBuf = new Buffer(8);
        if (fs.readSync(fd, sizeBuf, 0, 8, null) !== 8) {
            throw new Error('header size');
        }
        // console.log(sizeBuf.toString("hex"));

        var sizePickle = pickle.createFromBuffer(sizeBuf);
        size = sizePickle.createIterator().readUInt32();
        // console.log(size);

        headerBuf = new Buffer(size);
        if (fs.readSync(fd, headerBuf, 0, size, null) !== size) {
            throw new Error('header');
        }
    } finally {
        fs.closeSync(fd);
    }

    var headerPickle = pickle.createFromBuffer(headerBuf);
    var header = headerPickle.createIterator().readString();
    return { header: header, headerSize: size };
}
var asarHeader = readArchiveHeaderSync(path.join(process.cwd(), process.argv[2]));
// console.log(asarHeader);

var head = asarHeader.header.replace(/"offset":"[^"]+"/g, '"offset":"0"');
console.log(JSON.stringify(JSON.parse(head), null, 2) + "\n");
