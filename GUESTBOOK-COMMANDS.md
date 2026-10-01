<!-- ChatGPT: File made by ChatGPT. -->

# Guestbook command reference

Run these in your computer's terminal, not the website shell.

```sh
cd /Users/thomas/Code/shell-website
```

## View pending requests

```sh
npm run guestbook:requests
```

## View all notes (pending, approved, and rejected)

```sh
npm run guestbook:all
```

## Approve a note

```sh
npm run guestbook:approve -- filename.txt
```

## Permanently delete a note from the database

```sh
npm run guestbook:delete -- filename.txt
```

Replace `filename.txt` with the exact filename from the list. Deletion removes
the complete note record and frees its filename. This tool cannot undo it.

## Hide a note without deleting it

```sh
npm run guestbook:review -- reject filename.txt
```

These commands use the private `.env.local` database connection. The local and
live website currently share the same database, so changes affect live notes.
