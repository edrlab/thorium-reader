
import * as debug_ from "debug";
import { getSqliteDatabaseSync } from ".";
import { INoteState } from "src/common/redux/states/renderer/note";

const debug = debug_("readium-desktop:main:db:sqlite:note"); 


export const sqliteInitTableNote = () => {

    const database = getSqliteDatabaseSync();

    try {
        database.exec(`
            CREATE TABLE IF NOT EXISTS note_experimental (
            id INTEGER PRIMARY KEY,
            created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
            updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
            pub_id TEXT NOT NULL,
            note_id TEXT NOT NULL UNIQUE,
            note_json TEXT NOT NULL
            ) STRICT
        `);
    } catch (e) {
        debug("SQLITE INIT TABLE NOTE ERROR !!!");
        debug(e);

        throw new Error("Cannot instanciate sqlite database with the table 'note_experimental'");
    }


    debug("SQLITE INIT TABLE NOTE");

};


export const sqliteTableNoteInsert = (pubId: string, notes: INoteState[]): boolean => {

    const database = getSqliteDatabaseSync();

    try {
        const stm = database.prepare("INSERT OR IGNORE INTO note_experimental (pub_id, note_id, note_json) VALUES (?, ?, ?)");
        debug("SQLITE INSERT STATEMENT:", stm.sourceSQL);
        for (const note of notes) {
            const result = stm.run(pubId, note.uuid, JSON.stringify(note));
            debug(`TRYING TO INSERT ${note.uuid} in sqlite note_experimental table, result=`, result);
        }

    } catch (e) {
        debug(`SQLITE INSERT notes (${notes.length}) ERROR !!!`);
        debug(e);
        return false;
    }
    return true;
};

export const sqliteTableNoteUpdate = (note: INoteState): boolean => {

    const database = getSqliteDatabaseSync();

    try {
        const stm = database.prepare("UPDATE note_experimental SET updated_at=(strftime('%s','now')),note_json=? WHERE note_id=?");
        debug("SQLITE UPDATE STATEMENT:", stm.sourceSQL);
        const result = stm.run(JSON.stringify(note), note.uuid);
        debug(`TRYING TO UPDATE ${note.uuid} in sqlite note_experimental table, result=`, result);

    } catch (e) {
        debug(`SQLITE UPDATE note (${note.uuid}) ERROR !!!`);
        debug(e);
        return false;
    }

    return true;
};

export const sqliteTableSelectAllNotesWherePubId = (pubId: string): INoteState[] => {
    
    const database = getSqliteDatabaseSync();

    try {
        const stm = database.prepare("SELECT (note_json) FROM note_experimental where pub_id=? ORDER BY updated_at");
        debug("SQLITE SELECT STATEMENT:", stm.sourceSQL);
        const result = stm.all(pubId);
        debug(`TRYING TO SELECT all note from pubId=${pubId} in sqlite note_experimental table, result=`);
        // debug(JSON.stringify(result, null, 4)); // debug

        const notes_raw = result.map((rec) => rec["note_json"]);
        const notes = notes_raw.map((value) => typeof value === "string" ? JSON.parse(value) : undefined).filter((v) => !!v);

        // debug(JSON.stringify(notes, null, 4));

        return notes;


    } catch (e) {
        debug("SQLITE SELECT note ERROR !!!");
        debug(e);
    }
    return [];
};

export const sqliteTableNoteDelete = (noteId: string): boolean => {

    const database = getSqliteDatabaseSync();

    try {
        const stm = database.prepare("DELETE FROM note_experimental WHERE note_id=?");
        debug("SQLITE DELETE STATEMENT:", stm.sourceSQL);
        const result = stm.run(noteId);
        debug(`TRYING TO DELETE ${noteId} in sqlite note_experimental table, result=`, result);

    } catch (e) {
        debug(`SQLITE DELETE note (${noteId}) ERROR !!!`);
        debug(e);
        return false;
    }

    return true;
};
