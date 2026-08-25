const { neon } = require('@neondatabase/serverless');

const { PG_HOST, PG_DATABASE, PG_USER, PG_PASSWORD } = process.env;
const sql = neon(`postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}/${PG_DATABASE}?sslmode=require`);

//* SHORT LINKS
/**
 * @typedef {Object} ShortLink
 * @property {string} originalURL
 */

/**
 * @param {string} ownerName
 * @param {string} slug
 * @returns {Promise<ShortLink|null>}
 */
async function getShortLink(ownerName, slug) {
	const shortLinks = await sql`
		SELECT
			original_url AS "originalURL"
		FROM short_links
		WHERE owner_name = ${ownerName} AND slug = ${slug};
	`;

	return shortLinks[0] || null;
}

module.exports = {
	getShortLink,
};