const express = require('express');
const app = express();

const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const { marked } = require('marked');
const DOMPurify = require('isomorphic-dompurify');

const { markedRenderer, markedMath, purifyOptions } = require('./config');

const markedAlert = require('./modules/markdown-alert/index');
const markedFootnote = require('marked-footnote');
const markedMoreLists = require('marked-more-lists');
marked.use(
	markedAlert(),
	markedFootnote({
		refMarkers: true,
		footnoteDivider: true
	}),
	markedMoreLists(),
	{ renderer: markedRenderer, extensions: [ markedMath ] }
);

const Kyanit = require('./modules/Kyanit');
const { isUUID } = Kyanit;

const { validateToken } = require('./modules/token');

const { average } = require('./modules/utils');

const { version } = require('./package.json');

//* Database
const { neon } = require('@neondatabase/serverless');

const { PG_HOST, PG_DATABASE, PG_USER, PG_PASSWORD } = process.env;
const sql = neon(`postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}/${PG_DATABASE}?sslmode=require`);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser.json());

/** Is the server in maintenance mode? @type {boolean} */
const MAINTENANCE = JSON.parse(process.env.MAINTENANCE);
const maintenanceUsers = process.env.MAINTENANCE_USERS.split('\n');

app.use(validateToken);
app.use(async (_req, res, next) => {
	res.locals.$relativeTime = date => {
		const now = new Date().getTime();
		const options = { style: 'short', numeric: 'always' };
		let args = [];
		let timeDifference = date - now;

		if(Math.abs(timeDifference) > 3.154e+10)
			args = [Math.round(timeDifference / 3.154e+10), 'year'];
		else if(Math.abs(timeDifference) > 2.628e+9)
			args = [Math.round(timeDifference / 2.628e+9), 'month'];
		else if(Math.abs(timeDifference) > 8.64e+7)
			args = [Math.round(timeDifference / 8.64e+7), 'day'];
		else if(Math.abs(timeDifference) > 3.6e+6)
			args = [Math.round(timeDifference / 3.6e+6), 'hour'];
		else if(Math.abs(timeDifference) > 6e+4)
			args = [Math.round(timeDifference / 6e+4), 'minute'];
		else
			args = [Math.round(timeDifference / 1000), 'second'];

		return new Intl.RelativeTimeFormat('en-us', options).format(...args);
	}

	res.locals.version = version;

	if(MAINTENANCE) {
		const hasMaintenanceAccess = res.locals.isLoggedIn
			? maintenanceUsers.includes(res.locals.username)
			: false;

		if (!hasMaintenanceAccess) {
			if (res.locals.isLoggedIn)
			res.status(403);
			else
				res.status(401);

			res.render('error', {
				icon: 'build',
				title: 'Maintenance',
				message: 'Kyanit is currently on maintenance. I’m sorry for the inconvenience.'
			});
			return;
		}
	}

	next();
});

const MIN_RATING_COUNT_TO_SHOW = 3;

app.get('/', validateToken, async (req, res) => {
	const trendingNotes = await sql`
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
		WHERE n.unlisted = false
		GROUP BY n.id, u.display_name, u.is_verified
		ORDER BY n.views / ((EXTRACT(epoch FROM now() - n.created_at) + 2) / 86400)^2 DESC
		LIMIT 3;
	`;

	const newNotes = await sql`
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
		WHERE n.unlisted = false
		GROUP BY n.id, u.display_name, u.is_verified
		ORDER BY n.created_at DESC
		LIMIT 3;
	`;

	let userNotes = [];

	if(res.locals.isLoggedIn) {
		userNotes = await sql`
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
			WHERE n.author_name = ${res.locals.username}
			GROUP BY n.id, u.display_name, u.is_verified
			ORDER BY n.created_at DESC
			LIMIT 3;
		`;
	}

	res.render('index', { trendingNotes, newNotes, userNotes, MIN_RATING_COUNT_TO_SHOW });
});

app.get('/explore', async (req, res) => {
	res.render('explore', { MIN_RATING_COUNT_TO_SHOW });
});

app.get('/note/:noteId', async (req, res) => {
	const noteId = req.params.noteId;

	if(!isUUID(noteId)) {
		res.status(400).render('error', {
			icon: 'error',
			title: 'Invalid UUID',
			message: `<code class="code-span">${noteId}</code> is not a valid UUID.`
		});
		return;
	}

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

	const ratings = await sql`
		SELECT
			rater_name AS "raterName",
			value
		FROM note_ratings
		WHERE note_id = ${noteId}
		ORDER BY value DESC;
	`;

	const rating = average(ratings.map(rating => rating.value));

	if(notes.length === 0) {
		res.status(404).render('error', {
			icon: 'error',
			title: 'Note Not Found',
			message: `Note with id <code class="code-span">${noteId}</code> not found. The note might be deleted by the author. Check for typos.`
		});
		return;
	}

	const commentCount = (await sql`SELECT COUNT(*) FROM comments WHERE note_id = ${noteId}`)[0].count;

	const note = notes[0];

	const htmlContent = DOMPurify.sanitize(marked.parse(note.content), purifyOptions);

	delete note.content;

	res.render('note', { note, rating, ratings, commentCount, htmlContent, MIN_RATING_COUNT_TO_SHOW });
});

app.get('/create', async (req, res) => {
	res.render('coming-soon');
	return;

	// TODO
	if(!res.locals.isLoggedIn) return res.redirect('back');

	const startingNote = {
		title: 'Untitled',
		content:
			'# Welcome to Kyanit editor!\n\n' +
			'Kyanit uses markdown with GitHub Flavoured Markdown, parsed using `marked.js`, and syntax highlighted by `prism.js`.',
		keywords: [],
		unlisted: false,
		thumbnail_url: '',
	};

	res.render('create', { note: startingNote, mode: 'create' });
});

app.get('/edit/:noteId', async (req, res) => {
	res.render('coming-soon');
	return;

	// TODO
	if(!res.locals.isLoggedIn) return res.redirect('back');

	const noteId = req.params.noteId;

	if(!isUUID(noteId)) {
		res.redirect('/create');
		return;
	}

	const notes = await sql`
		SELECT
			id,
			title,
			content,
			keywords,
			unlisted,
			thumbnail_url AS "thumbnailURL"
		FROM notes
		WHERE id = ${noteId} AND author_name = ${res.locals.username};
	`;

	const note = notes[0];

	if(!note) return res.redirect('/create');

	res.render('create', { note, mode: 'edit' });
});

app.get('/user', async (req, res) => {
	// TODO: Remove
	res.render('coming-soon');
	return;
})

app.get(['/user/:username', '/user/:username/:page'], async (req, res) => {
	res.render('coming-soon');
	return;

	// TODO
	const users = await sql`
		SELECT
			name,
			display_name as "displayName",
			about,
			created_at as "createdAt",
			is_verified as "isVerified"
		FROM users
		WHERE name = ${req.params.username};
	`;

	const user = users[0];

	if(!user) {
		return res.status(404).send(`User with username ${req.params.username} not found.`);
	}

	let notes;
	if(res.locals.username === user.name) {
		// If the user is viewing their own profile, show unlisted notes.
		notes = await sql`
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
			WHERE author_name = ${user.name}
			ORDER BY created_at;
		`;
	} else {
		// Otherwise, only show listed notes.
		notes = await sql`
			SELECT
				id,
				title,
				keywords,
				thumbnail_url AS "thumbnailURL",
				views,
				created_at AS "createdAt",
				updated_at AS "updatedAt"
			FROM notes
			WHERE author_name = ${user.name} AND unlisted = false
			ORDER BY created_at;
		`;
	}

	const page = req.params.page || 'about';

	const aboutHTMLContent = DOMPurify.sanitize(marked.parse(user.about), purifyOptions);

	res.render('profile', {
		user, notes, about: aboutHTMLContent, page
	});
});

app.get('/signup', (_req, res) => {
	res.render('signup', { mode: 'signup' });
});

app.get('/login', (_req, res) => {
	res.render('signup', { mode: 'login' });
});

app.get('/settings', (req, res) => {
	// TODO
	res.render('coming-soon');
});

//* Minified 
const minifiedRoutes = require('./routes/minified');
app.use(
	'/min',
	(req, _res, next) => {
		// Inject database.
		req.sql = sql;
		next();
	},
	minifiedRoutes
);

//* Docs
const yaml = require('yaml');
const fs = require('fs');

const DOCS_DIR = path.join(__dirname, 'docs');

app.get('/docs', async (req, res) => {
	const files = fs.readdirSync(DOCS_DIR)
		.filter(file =>
			file.endsWith('.md') && !file.startsWith('.')
		);

	const docs = files
		.map(file => {
			const content = fs.readFileSync(path.join(DOCS_DIR, file), 'utf-8');
			return { ...extractMetadata(content).metadata, docname: file.slice(0, -3) };
		})
		.sort((a, b) =>
			new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
		);

	res.render('docs', { docs });
});

app.get('/docs/:docname', async (req, res) => {
	const docname = req.params.docname;
	let doc;

	try {
		doc = fs.readFileSync(path.join(DOCS_DIR, `${docname}.md`), 'utf-8');
	} catch(error) {
		if(error.code === 'ENOENT') {
			res.status(404).render('error', {
				icon: 'error',
				title: 'Docs Not Found',
				message: `Docs with docname <code class="code-span">${docname}</code> not found.`
			});
			return;
		}
	}

	const { metadata, raw } = extractMetadata(doc);

	// Remove metadata
	doc = doc.replace(raw, '');

	const htmlContent = DOMPurify.sanitize(marked.parse(doc), purifyOptions);

	res.render('doc', { metadata, htmlContent });
});

function extractMetadata(content) {
	const metadataRegExp = /^---([\S\s]*?)---/;
	const metadataString = content.match(metadataRegExp)[1];

	return {
		metadata: yaml.parse(metadataString),
		raw: content.match(metadataRegExp)[0]
	};
}

//* APIs 
const userRoutes = require('./routes/users');
const noteRoutes = require('./routes/notes');
const commentRoutes = require('./routes/comments');
const commentVoteRoutes = require('./routes/commentVotes');

app.use(
	'/api',
	(req, _res, next) => {
		// Inject database.
		req.sql = sql;
		next();
	},
	userRoutes,
	noteRoutes,
	commentRoutes,
	commentVoteRoutes
);

//* Authentication
const authRoutes = require('./routes/auth');
app.use(
	'/auth',
	(req, _res, next) => {
		// Inject database.
		req.sql = sql;
		next();
	},
	authRoutes
);

//* Test Pages
app.get('/test/:page', (req, res) => {
	const page = req.params.page;

	const hasTestAccess = res.locals.isLoggedIn && maintenanceUsers.includes(res.locals.username);

	if (!hasTestAccess) {
		if (res.locals.isLoggedIn)
			res.status(403);
		else
			res.status(401);

		res.render('error', {
			icon: 'block',
			title: 'No Access',
			message: 'Test pages can only be accessed by authorized users.'
		});
	}

	res.render(page);
});

const PORT = process.env.PORT;
app.listen(PORT, async () => {
	console.log('Server is ready! With port', PORT);
});