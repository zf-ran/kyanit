CREATE TABLE note_collaborator (
	note_id					UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
	collaborator_name		TEXT NOT NULL REFERENCES users(name) ON DELETE CASCADE,

	can_publish				BOOLEAN NOT NULL DEFAULT FALSE,
	can_delete				BOOLEAN NOT NULL DEFAULT FALSE,
	can_change_title		BOOLEAN NOT NULL DEFAULT FALSE,
	can_change_keywords		BOOLEAN NOT NULL DEFAULT FALSE,
	can_change_thumbnail	BOOLEAN NOT NULL DEFAULT FALSE,
	can_change_visibility	BOOLEAN NOT NULL DEFAULT FALSE,

	created_at				TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (note_id, collaborator_name)
);