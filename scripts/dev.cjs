// ChatGPT: File made by ChatGPT.
// ChatGPT: A local server for the existing static files plus the same guestbook API used on Vercel.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const handler = require('../api/notes.js');
const assets = new Set(['index.html', 'styles.css', 'script.js', 'favicon.svg', 'aboutme.txt', 'projects.md', 'workouts.md', 'resume.pdf']);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8' };
http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/notes') {
        let body = '', size = 0;
        for await (const chunk of req) {
            size += chunk.length;
            if (size > 8192) { res.writeHead(413, { 'Content-Type': 'application/json' }); res.end('{"error":"That note is too large."}'); return; }
            body += chunk;
        }
        req.body = body;
        return handler(req, res);
    }
    const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    if (!assets.has(name)) { res.writeHead(404); res.end('Not found'); return; }
    res.setHeader('Content-Type', types[path.extname(name)]);
    res.setHeader('Cache-Control', 'no-store');
    fs.createReadStream(path.join(__dirname, '..', name)).pipe(res);
}).listen(Number(process.env.PORT || 8000), '127.0.0.1', () => console.log(`Website: http://localhost:${process.env.PORT || 8000}`));
