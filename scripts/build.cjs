// ChatGPT: File made by ChatGPT.
// ChatGPT: Publish only site assets; database credentials and moderation tools stay private.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const files = ['index.html', 'styles.css', 'script.js', 'favicon.svg', 'aboutme.txt', 'projects.md', 'workouts.md', 'resume.pdf'];
fs.mkdirSync(path.join(root, 'public'), { recursive: true });
for (const file of files) fs.copyFileSync(path.join(root, file), path.join(root, 'public', file));
console.log('Copied website assets to public/.');
