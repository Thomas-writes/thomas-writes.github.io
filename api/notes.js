// ChatGPT: File made by ChatGPT.
// ChatGPT: This is the only public database endpoint; pending notes never leave it.
const { neon } = require('@neondatabase/serverless');
const { createHmac } = require('node:crypto');

const allowedOrigins = new Set([
    'https://thomas-writes.github.io',
    'https://thomas.savasten.com'
]);

module.exports = async function handler(req, res) {
    const origin = req.headers.origin;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (origin && !allowedOrigins.has(origin)) {
        res.statusCode = 403;
        return res.end(JSON.stringify({
            error: 'Origin not allowed.'
        }));
    }

    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        return res.end();
    }
    const reply = (status, data) => { res.statusCode = status; res.end(JSON.stringify(data)); };
    if (!['GET', 'POST'].includes(req.method)) {
        res.setHeader('Allow', 'GET, POST');
        return reply(405, { error: 'Method not allowed.' });
    }
    if (!process.env.DATABASE_URL) return reply(503, { error: 'The guestbook is not connected yet. Your note has not been saved.' });
    const sql = neon(process.env.DATABASE_URL);
    try {
        if (req.method === 'GET') {
            const filename = new URL(req.url, 'https://thomas.savasten.com').searchParams.get('filename');
            if (filename !== null) {
                const rows = await sql`SELECT filename, author, message, created_at AS "createdAt" FROM guestbook_notes WHERE filename = ${filename} AND status = 'approved'`;
                return rows.length ? reply(200, { note: rows[0] }) : reply(404, { error: 'Note not found. Only approved notes are public.' });
            }
            const notes = await sql`SELECT filename FROM guestbook_notes WHERE status = 'approved' ORDER BY created_at DESC LIMIT 100`;
            return reply(200, { notes });
        }
        if (!req.headers['content-type']?.startsWith('application/json')) return reply(415, { error: 'Send plain text fields as JSON.' });
        if (Number(req.headers['content-length'] || 0) > 8192) return reply(413, { error: 'That note is too large.' });
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch { return reply(400, { error: 'Invalid note.' }); }
        }
        if (!body || Array.isArray(body) || typeof body !== 'object') return reply(400, { error: 'Invalid note.' });
        const { filename, author, message, requestId } = body;
        if (typeof filename !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,47}\.txt$/.test(filename)) return reply(400, { error: 'Choose a valid .txt filename.' });
        if (typeof author !== 'string' || author.length > 60 || typeof message !== 'string' || !message.trim() || message.length > 1000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(author + message)) return reply(400, { error: 'Use a name up to 60 characters and a message of 1–1,000 characters.' });
        if (typeof requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) return reply(400, { error: 'Invalid submission ID. Start a new note.' });
        // ChatGPT: Vercel supplies the forwarding header. Hash addresses before storing rate-limit counters.
        const ip = process.env.VERCEL ? String(req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim() : req.socket?.remoteAddress || 'local';
        const client = createHmac('sha256', process.env.DATABASE_URL).update(ip).digest('hex');
        const existing = await sql`SELECT filename, author, message, client_hash FROM guestbook_notes WHERE request_id = ${requestId}`;
        if (existing.length) {
            const note = existing[0];
            if (note.filename !== filename || note.author !== (author.trim() || 'Anonymous') || note.message !== message.trim() || note.client_hash !== client) return reply(409, { error: 'This submission ID is already used. Start a new note.' });
            return reply(202, { saved: true });
        }
        const bucket = Math.floor(Date.now() / 3600000);
        const counts = await sql`INSERT INTO guestbook_limits (client_hash, hour, attempts) VALUES (${client}, ${bucket}, 1) ON CONFLICT (client_hash, hour) DO UPDATE SET attempts = guestbook_limits.attempts + 1 WHERE guestbook_limits.attempts < 3 RETURNING attempts`;
        if (!counts.length) {
            res.setHeader('Retry-After', String(3600 - Math.floor(Date.now() / 1000) % 3600));
            return reply(429, { error: 'Please wait before sending another note. Limit: three submissions per hour.' });
        }
        await sql`INSERT INTO guestbook_notes (filename, author, message, request_id, client_hash) VALUES (${filename}, ${author.trim() || 'Anonymous'}, ${message.trim()}, ${requestId}, ${client}) ON CONFLICT (request_id) DO NOTHING`;
        // ChatGPT: Old counters are disposable; cleanup must not turn a saved note into a reported failure.
        try { await sql`DELETE FROM guestbook_limits WHERE hour < ${bucket - 24}`; } catch { /* Retry cleanup on the next submission. */ }
        return reply(202, { saved: true });
    } catch (error) {
        if (error.code === '23505') return reply(409, { error: 'That filename is taken. Please choose another.' });
        console.error('Guestbook request failed:', error.code || error.name);
        return reply(503, { error: 'The guestbook is temporarily unavailable. Please retry; duplicate submissions will not create duplicate notes.' });
    }
};
