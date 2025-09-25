
import * as debug_ from "debug";
import { getSqliteDatabaseSync } from ".";
import { INoteState } from "readium-desktop/common/redux/states/renderer/note";

const debug = debug_("readium-desktop:main:db:sqlite:note"); 


export const sqliteInitTableNote = () => {

    const database = getSqliteDatabaseSync();

    try {
        database.exec(`
            CREATE TABLE IF NOT EXISTS notes (
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

        throw new Error("Cannot instanciate sqlite database with the table 'notes'");
    }


    debug("SQLITE INIT TABLE NOTE");

};


export const sqliteTableNoteInsert = (pubId: string, notes: INoteState[]): boolean => {

    const database = getSqliteDatabaseSync();

    try {
        const stm = database.prepare("INSERT OR IGNORE INTO notes (pub_id, note_id, note_json) VALUES (?, ?, ?)");
        debug("SQLITE INSERT STATEMENT:", stm.sourceSQL);
        for (const note of notes) {
            const result = stm.run(pubId, note.uuid, JSON.stringify(note));
            debug(`TRYING TO INSERT ${note.uuid} from ${pubId} in sqlite notes table, result=`, result);
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
        const stm = database.prepare("UPDATE notes SET updated_at=(strftime('%s','now')),note_json=? WHERE note_id=?");
        debug("SQLITE UPDATE STATEMENT:", stm.sourceSQL);
        const result = stm.run(JSON.stringify(note), note.uuid);
        debug(`TRYING TO UPDATE ${note.uuid} in sqlite notes table, result=`, result);

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
        const stm = database.prepare("SELECT (note_json) FROM notes where pub_id=? ORDER BY updated_at");
        debug("SQLITE SELECT STATEMENT:", stm.sourceSQL);
        const result = stm.all(pubId);
        debug(`TRYING TO SELECT all note from pubId=${pubId} in sqlite notes table, result=`);
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

export const sqliteTableSelectLastModifiedDateWherePubId = (pubId: string): number => {

    const database = getSqliteDatabaseSync();

        try {
        const stm = database.prepare("SELECT (updated_at) FROM notes where pub_id=? ORDER BY updated_at DESC LIMIT 1");
        debug("SQLITE SELECT STATEMENT:", stm.sourceSQL);
        const result = stm.all(pubId);
        debug(`TRYING TO SELECT last updated_at(modified) from pubId=${pubId} in sqlite notes table, result=`);
        // debug(JSON.stringify(result, null, 4)); // debug

        const updated_at = (result[0]?.updated_at || 0) as number * 1000 + 999; // json epoch is in ms sqlite is in second, so let's add artificially less than 1sec to trigger sqlite as winner between both
        return updated_at;


    } catch (e) {
        debug("SQLITE SELECT note ERROR !!!");
        debug(e);
    }
    return 0;
};

export const sqliteTableNoteDelete = (noteId: string): boolean => {

    const database = getSqliteDatabaseSync();

    try {
        const stm = database.prepare("DELETE FROM notes WHERE note_id=?");
        debug("SQLITE DELETE STATEMENT:", stm.sourceSQL);
        const result = stm.run(noteId);
        debug(`TRYING TO DELETE ${noteId} in sqlite notes table, result=`, result);

    } catch (e) {
        debug(`SQLITE DELETE note (${noteId}) ERROR !!!`);
        debug(e);
        return false;
    }

    return true;
};

export const sqliteTableNoteDeleteWherePubId = (pubId: string): boolean => {

    const database = getSqliteDatabaseSync();

    try {
        const stm = database.prepare("DELETE FROM notes WHERE pub_id=?");
        debug("SQLITE DELETE STATEMENT:", stm.sourceSQL);
        const result = stm.run(pubId);
        debug(`TRYING TO DELETE all notes attached to ${pubId} publicationId in sqlite notes table, result=`, result);

    } catch (e) {
        debug(`SQLITE DELETE note (${pubId}) ERROR !!!`);
        debug(e);
        return false;
    }

    return true;
};

