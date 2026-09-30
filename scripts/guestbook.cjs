// ChatGPT: File made by ChatGPT.
// ChatGPT: Local moderation uses your private database connection, never a public admin endpoint.
const { neon } = require('@neondatabase/serverless');
const fs = require('node:fs');
async function main() {
    if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL. Pull the Vercel environment into .env.local first.');
    const sql = neon(process.env.DATABASE_URL);
    const [action = 'list', filename] = process.argv.slice(2);
    if (action === 'setup') {
        const statements = fs.readFileSync(__dirname + '/guestbook.sql', 'utf8').split(';').map(text => text.trim()).filter(Boolean);
        await sql.transaction(statements.map(statement => sql.query(statement)));
        console.log('Guestbook tables are ready.');
    }else if (action === 'list') {
        const notes = await sql`SELECT filename, author, message, created_at FROM guestbook_notes WHERE status = 'pending' ORDER BY created_at`;
        console.log(JSON.stringify(notes, null, 2));
    }else if (['approve', 'reject'].includes(action) && filename) {
        const status = action === 'approve' ? 'approved' : 'rejected';
        const rows = await sql`UPDATE guestbook_notes SET status = ${status} WHERE filename = ${filename} RETURNING filename`;
        console.log(rows.length ? `${filename}: ${status}` : 'Note not found.');
    }else{
        throw new Error('Usage: npm run guestbook:review -- [list | approve filename.txt | reject filename.txt]');
    }
}
main().catch(error => { console.error(error.code || error.message); process.exitCode = 1; });
