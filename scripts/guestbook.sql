-- ChatGPT: File made by ChatGPT.
CREATE TABLE IF NOT EXISTS guestbook_notes (
    filename text PRIMARY KEY CHECK (filename ~ '^[a-z0-9][a-z0-9_-]{0,47}\.txt$'),
    author text NOT NULL CHECK (char_length(author) BETWEEN 1 AND 60),
    message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 1000),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at timestamptz NOT NULL DEFAULT now(),
    request_id uuid UNIQUE NOT NULL,
    client_hash text NOT NULL
);
CREATE INDEX IF NOT EXISTS guestbook_status_date ON guestbook_notes (status, created_at DESC);
CREATE TABLE IF NOT EXISTS guestbook_limits (
    client_hash text NOT NULL,
    hour bigint NOT NULL,
    attempts integer NOT NULL,
    PRIMARY KEY (client_hash, hour)
);
