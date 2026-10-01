// ChatGPT: File made by ChatGPT.
// ChatGPT: Local moderation uses your private database connection, never a public admin endpoint.
const { neon } = require('@neondatabase/serverless');
const fs = require('node:fs');
async function main() {
    if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL. Pull the Vercel environment into .env.local first.');
    const sql = neon(process.env.DATABASE_URL);
    const [action = 'list', filename, ...extra] = process.argv.slice(2);
    // ChatGPT: Require one exact filename for mutations; never interpret wildcards or extra arguments.
    if (extra.length || (['approve', 'reject', 'delete'].includes(action) &&
        (!filename || !/^[a-z0-9][a-z0-9_-]{0,47}\.txt$/.test(filename)))) {
        throw new Error('Provide exactly one full filename, for example hello-thomas.txt.');
    }
    if (action === 'setup') {
        const statements = fs.readFileSync(__dirname + '/guestbook.sql', 'utf8').split(';').map(text => text.trim()).filter(Boolean);
        await sql.transaction(statements.map(statement => sql.query(statement)));
        console.log('Guestbook tables are ready.');
    }else if (action === 'list') {
        const notes = await sql`SELECT filename, author, message, created_at FROM guestbook_notes WHERE status = 'pending' ORDER BY created_at`;
        console.log(JSON.stringify(notes, null, 2));
    }else if (action === 'all') {
        // ChatGPT: Include status so approved and rejected notes can also be found for deletion.
        const notes = await sql`SELECT filename, author, message, status, created_at FROM guestbook_notes ORDER BY created_at DESC`;
        console.log(JSON.stringify(notes, null, 2));
    }else if (action === 'delete') {
        // ChatGPT: Permanently delete the complete note row, not just its public approval status.
        const rows = await sql`DELETE FROM guestbook_notes WHERE filename = ${filename} RETURNING filename`;
        console.log(rows.length ? `${filename}: permanently deleted from the database` : 'Note not found.');
    }else if (['approve', 'reject'].includes(action) && filename) {
        const status = action === 'approve' ? 'approved' : 'rejected';
        const rows = await sql`UPDATE guestbook_notes SET status = ${status} WHERE filename = ${filename} RETURNING filename`;
        console.log(rows.length ? `${filename}: ${status}` : 'Note not found.');
    }else{
        throw new Error('Usage: npm run guestbook:review -- [list | all | approve filename.txt | reject filename.txt | delete filename.txt]');
    }
}
main().catch(error => { console.error(error.code || error.message); process.exitCode = 1; });
