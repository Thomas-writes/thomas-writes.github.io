<!-- ChatGPT: File made by ChatGPT. -->

# Guestbook

The website keeps its existing HTML, CSS, and JavaScript. Notes are stored in the
free Neon database (existing provisioned resource), connected to the Vercel project
`thomas-personal-website`.

## Run locally

Use Node.js 24. From this folder:

```sh
npm ci
npm run dev
```

Open http://localhost:8000. Stop any old server on that port first, or run
`PORT=8001 npm run dev`. The Python static server can display the site but cannot
run the guestbook API.

The ignored `.env.local` contains the database credentials. Never commit it.
The current development and production connections point to the same database,
so local notes are real notes too.

## Leave and read notes

```text
cd /guestbook
touch hello-thomas.txt
ls /guestbook
cat /guestbook/hello-thomas.txt
```

The filename is required. The writing flow asks for an optional author name and a
message. You can also use `touch /guestbook/hello-thomas.txt` from any directory. A preview asks for `y` before submission. Escape or Ctrl+C cancels.
Filenames are lowercase, with spaces converted to hyphens and `.txt` added.
A filename can contain 1–48 letters, digits, hyphens, or underscores before `.txt`.
Filenames must be unique. Authors may use up to 60 characters, messages up to
1,000. Submissions are limited to three attempts per IP per hour; addresses are
stored as keyed hashes, not raw IP addresses. Successful retries do not duplicate
notes. Failed requests retain the draft in the current page.

New notes are pending. Public reads return only approved notes. `ls` shows the
latest 100 approved filenames; older approved notes remain readable by filename.
Startup runs `neofetch` and `help`. The header explains the note-writing flow.
There are no `guestbook` or `leave-note` commands; use `cd`, `ls`, `cat`, and `touch`.

## Review notes

Run these locally from this folder, using your private `.env.local` connection:

```sh
npm run guestbook:requests
npm run guestbook:all
npm run guestbook:approve -- hello-thomas.txt
npm run guestbook:delete -- hello-thomas.txt
```

`requests` lists pending submissions. `all` lists every note with its status,
including approved and rejected notes. `approve` makes the named note public.
`delete` permanently removes the entire named note row from the database,
including its message, author, status, request ID, and client hash. It works for
any status and frees the filename for reuse. There is no undo in this tool.
Existing independent hourly abuse-limit counters are unaffected.

Run these in your local project terminal, not the website's simulated shell.
There is no public moderation endpoint or admin password in the website.
The original `guestbook:review` commands still work, including `reject` if you
want to hide a note while retaining it privately instead of deleting it.

## Deployment

The database and its development/production tables have been provisioned.
Commit and deploy the source changes to enable the guestbook on the public site.
The build copies only website assets into `public/`; Vercel builds `api/notes.js`
as a separate Node.js function. Package settings select Node.js 24.

For a newly connected database, pull its credentials and run:

```sh
npm run guestbook:setup
```

The setup is safe to rerun. The schema is in `scripts/guestbook.sql`.
