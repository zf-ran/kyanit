const { sql } = require('../../db');

//* USER
/**
 * @typedef {Object} User
 * @property {string} name
 * @property {string} displayName
 * @property {string} about
 * @property {Date} createdAt
 * @property {boolean} isVerified
 */

/**
 * @param {string} name
 * @returns {Promise<User|null>}
 */
async function getUser(name) {
	const users = await sql`
		SELECT
			name,
			display_name AS "displayName",
			about,
			created_at AS "createdAt",
			is_verified AS "isVerified"
		FROM users
		WHERE name = ${name};
	`;

	return users[0] || null;
}

getUser.commentCount = async function (name) {
	const output = await sql`
		SELECT COUNT(*)
		FROM comments
		WHERE commenter_name = ${name};
	`;

	return parseInt(output[0]?.count || 0);
};

module.exports = {
	getUser,
};
