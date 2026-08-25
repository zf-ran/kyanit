const { neon } = require('@neondatabase/serverless');

const { PG_HOST, PG_DATABASE, PG_USER, PG_PASSWORD } = process.env;
const sql = neon(`postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}/${PG_DATABASE}?sslmode=require`);

//* NOTE
/**
 * @typedef {Object} Note
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {string[]} keywords
 * @property {string|null} thumbnailURL
 * @property {number} views
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {boolean} unlisted
 * @property {string} authorName
 * @property {string} authorDisplayName
 * @property {boolean} isAuthorVerified
 * @property {number} rating
 * @property {number} rateCount
 */

/**
 * @typedef {Object} Note.Rating
 * @property {string} raterName
 * @property {number} value
 */

/**
 * @typedef {Omit<Note, 'content' | 'updatedAt' | 'unlisted' | 'authorName'>} Note.Card
 */

/**
 * @typedef {Pick<Note, 'id' | 'title' | 'authorName' | 'content' | 'keywords' | 'unlisted' | 'thumbnailURL'>} Note.Edit
 */

/**
 * @typedef {Pick<NoteDetail, 'id' | 'title' | 'keywords' | 'thumbnailURL' | 'views' | 'createdAt' | 'updatedAt'>} Note.Profile
 */

/**
 * @param {string} noteId
 * @returns {Promise<Note|null>}
 */
async function getNote(noteId) {
	const notes = await sql`
		SELECT
			n.id,
			n.title,
			n.content,
			n.keywords,
			n.thumbnail_url AS "thumbnailURL",
			n.views,
			n.created_at AS "createdAt",
			n.updated_at AS "updatedAt",
			n.unlisted,
			n.author_name AS "authorName",
			u.display_name AS "authorDisplayName",
			u.is_verified AS "isAuthorVerified"
		FROM notes n
		JOIN users u
			ON n.author_name = u.name
		WHERE id = ${noteId};
	`;

	return notes[0] || null;
}

/**
 * @param {string} noteId
 * @returns {Promise<Note.Rating[]>}
 */
getNote.ratings = function (noteId) {
	return sql`
		SELECT
			rater_name AS "raterName",
			value
		FROM note_ratings
		WHERE note_id = ${noteId}
		ORDER BY value DESC;
	`;
};

/**
 * @param {string} noteId
 * @returns {Promise<number>}
 */
getNote.commentCount = async function (noteId) {
	const output = await sql`
		SELECT COUNT(*)
		FROM comments
		WHERE note_id = ${noteId};
	`;

	return parseInt(output[0]?.count || 0);
};

//- CARDS
/**
 * @returns {Promise<Note.Card[]>}
 */
function getCards({ where, orderBy, limit = 3 }) {
	return sql`
		SELECT
			n.id,
			u.display_name AS "authorDisplayName",
			u.is_verified AS "isAuthorVerified",
			n.title,
			n.keywords,
			n.thumbnail_url AS "thumbnailURL",
			n.views,
			ROUND(AVG(r.value), 1) AS rating,
			COUNT(r.value) AS "rateCount",
			n.created_at AS "createdAt"
		FROM notes n
		JOIN users u
			ON n.author_name = u.name
		LEFT JOIN note_ratings r
			ON n.id = r.note_id
		WHERE ${where}
		GROUP BY n.id, u.display_name, u.is_verified
		ORDER BY ${orderBy}
		LIMIT ${limit};
	`;
}

/**
 * @param {number} [limit]
 * @returns {Promise<Note.Card[]>}
 */
getCards.trending = function (limit = 3) {
	return getCards({
		where: sql`n.unlisted = false`,
		orderBy: sql`n.views / ((EXTRACT(epoch FROM now() - n.created_at) + 2) / 86400)^2 DESC`,
		limit,
	});
};

/**
 * @param {number} [limit]
 * @returns {Promise<Note.Card[]>}
 */
getCards.recent = function (limit = 3) {
	return getCards({
		where: sql`n.unlisted = false`,
		orderBy: sql`n.created_at DESC`,
		limit,
	});
};

/**
 * @param {string} username
 * @param {number} [limit]
 * @returns {Promise<Note.Card[]>}
 */
getCards.author = function (username, limit = 3) {
	return getCards({
		where: sql`n.author_name = ${username}`,
		orderBy: sql`n.created_at DESC`,
		limit,
	});
};

//- EDIT
/**
 * @param {string} noteId
 * @returns {Promise<Note.Edit|null>}
 */
async function getEdit(noteId) {
	const notes = await sql`
		SELECT
			id,
			title,
			author_name AS "authorName",
			content,
			keywords,
			unlisted,
			thumbnail_url AS "thumbnailURL"
		FROM notes
		WHERE id = ${noteId};
	`;

	return notes[0] || null;
}

//- PROFILE
/**
 * @param {string} authorName
 * @param {boolean} [includeUnlisted=false]
 * @returns {Promise<Note.Profile[]>}
 */
function getProfile(authorName, includeUnlisted = false) {
	const where = includeUnlisted
		? sql`author_name = ${authorName}`
		: sql`author_name = ${authorName} AND unlisted = false`;

	return sql`
		SELECT
			id,
			title,
			keywords,
			thumbnail_url AS "thumbnailURL",
			views,
			created_at AS "createdAt",
			updated_at AS "updatedAt",
			unlisted
		FROM notes
		WHERE ${where}
		ORDER BY created_at;
	`;
}

module.exports = {
	getNote,
	getCards,
	getEdit,
	getProfile,
};