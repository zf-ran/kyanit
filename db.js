const postgres = require('postgres').default;
const { neon } = require('@neondatabase/serverless');

let sql;

if (process.env.PG_ENV === 'neon') {
	const client = neon(process.env.PG_URL);
	sql = client;
} else if (process.env.PG_ENV === 'pg') {
	sql = postgres({
		host: process.env.PG_HOST,
		port: process.env.PG_PORT,
		database: process.env.PG_DATABASE,
		username: process.env.PG_USER,
		password: process.env.PG_PASSWORD,
	});
}

module.exports = { sql };
