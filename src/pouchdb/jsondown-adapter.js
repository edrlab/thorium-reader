import CoreLevelPouch from "pouchdb-adapter-leveldb-core";

import jsondown from "jsondown";

function JsonDownPouch(opts, callback) {
    var newOpts = Object.assign({
        db: jsondown,
    }, opts);

    CoreLevelPouch.call(this, newOpts, callback);
}

// overrides for normal LevelDB behavior on Node
JsonDownPouch.valid = function () {
    return true;
};
JsonDownPouch.use_prefix = false;

export default function (PouchDB) {
    PouchDB.adapter("jsondown", JsonDownPouch, true);
}
