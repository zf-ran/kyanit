CREATE TABLE users (
	name         TEXT PRIMARY KEY,
	password     TEXT NOT NULL,
	display_name TEXT NOT NULL,
	about        TEXT,
	is_verified  BOOLEAN NOT NULL DEFAULT FALSE,
	created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
	id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	author_name   TEXT NOT NULL REFERENCES users(name) ON DELETE CASCADE,
	title         TEXT NOT NULL,
	content       TEXT NOT NULL,
	keywords      TEXT[] NOT NULL DEFAULT '{}',
	unlisted      BOOLEAN NOT NULL DEFAULT FALSE,
	thumbnail_url TEXT,
	views         INTEGER NOT NULL DEFAULT 0,
	created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
	id UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
	commenter_name    TEXT NOT NULL REFERENCES users(name) ON DELETE CASCADE,
	note_id           UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
	parent_comment_id UUID DEFAULT NULL REFERENCES comments(id) ON DELETE CASCADE,
	content           TEXT NOT NULL,
	created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comment_votes (
	comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
	note_id    UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
	voter_name TEXT NOT NULL REFERENCES users(name) ON DELETE CASCADE,
	value      INTEGER NOT NULL CHECK (value IN (1, -1))
);

CREATE TABLE note_ratings (
	rater_name   TEXT NOT NULL REFERENCES users(name) ON DELETE CASCADE,
	note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
	value        INTEGER NOT NULL CHECK (value in (1, 2, 3, 4, 5)),
	created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE note_collaborators (
	note_id               UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
	collaborator_name     TEXT NOT NULL REFERENCES users(name) ON DELETE CASCADE,

	can_publish           BOOLEAN NOT NULL DEFAULT FALSE,
	can_change_thumbnail  BOOLEAN NOT NULL DEFAULT FALSE,
	can_delete            BOOLEAN NOT NULL DEFAULT FALSE,
	can_change_title      BOOLEAN NOT NULL DEFAULT FALSE,
	can_change_keywords   BOOLEAN NOT NULL DEFAULT FALSE,
	can_change_visibility BOOLEAN NOT NULL DEFAULT FALSE,

	created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	PRIMARY KEY (note_id, collaborator_name)
);

CREATE TABLE short_links (
	id UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
	owner_name   TEXT REFERENCES users(name) ON UPDATE CASCADE ON DELETE CASCADE,
	original_url TEXT NOT NULL,
	slug         TEXT NOT NULL UNIQUE,
	title        TEXT,
	created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_links_slug ON short_links (slug);
CREATE INDEX idx_links_owner_name ON short_links (owner_name);