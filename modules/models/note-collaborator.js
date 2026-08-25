const { neon } = require('@neondatabase/serverless');

const { PG_HOST, PG_DATABASE, PG_USER, PG_PASSWORD } = process.env;
const sql = neon(`postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}/${PG_DATABASE}?sslmode=require`);

//* NOTE AUTHOR
/**
 * @typedef {Object} NoteCollaborator
 * @property {string} collaboratorName
 * @property {boolean} canPublish
 * @property {boolean} canDelete
 * @property {boolean} canChangeTitle
 * @property {boolean} canChangeKeywords
 * @property {boolean} canChangeThumbnail
 * @property {boolean} canChangeVisibility
 */

/**
 * @param {string} noteId
 * @returns {Promise<NoteCollaborator[]>}
 */
function getNoteCollaborators(noteId) {
	return sql`
		SELECT
			c.collaborator_name     AS "name",
			u.display_name          AS "displayName",
			c.can_publish           AS "canPublish",
			c.can_delete            AS "canDelete",
			c.can_change_title      AS "canChangeTitle",
			c.can_change_keywords   AS "canChangeKeywords",
			c.can_change_thumbnail  AS "canChangeThumbnail",
			c.can_change_visibility AS "canChangeVisibility"
		FROM note_collaborators c
		JOIN users u ON c.collaborator_name = u.name
		WHERE c.note_id = ${noteId};
	`;
}

/**
 * @param {string} noteId
 * @param {string} collaboratorName
 * @returns {Promise<NoteCollaborator|null>}
 */
getNoteCollaborators.permission = async function (noteId, collaboratorName) {
	const [permission] = await sql`
		SELECT
			COALESCE(c.collaborator_name, n.author_name)                            AS "collaboratorName",
			(n.author_name = ${collaboratorName} OR c.can_publish = true)           AS "canPublish",
			(n.author_name = ${collaboratorName} OR c.can_delete = true)            AS "canDelete",
			(n.author_name = ${collaboratorName} OR c.can_change_title = true)      AS "canChangeTitle",
			(n.author_name = ${collaboratorName} OR c.can_change_keywords = true)   AS "canChangeKeywords",
			(n.author_name = ${collaboratorName} OR c.can_change_thumbnail = true)  AS "canChangeThumbnail",
			(n.author_name = ${collaboratorName} OR c.can_change_visibility = true) AS "canChangeVisibility"
		FROM notes n
		LEFT JOIN note_collaborators c
			ON n.id = c.note_id AND c.collaborator_name = ${collaboratorName}
		WHERE n.id = ${noteId}
			AND (n.author_name = ${collaboratorName} OR c.collaborator_name = ${collaboratorName});
	`;

	return permission || null;
};

module.exports = {
	getNoteCollaborators,
};