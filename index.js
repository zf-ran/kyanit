const express = require('express');
const app = express();

const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const { marked } = require('marked');
const DOMPurify = require('isomorphic-dompurify');

const { markedRenderer, purifyOptions } = require('./config');

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
	{ renderer: markedRenderer }
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
	if(MAINTENANCE && res.locals.isLoggedIn) {
		// Check if the user has access to maintenance.
		const hasMaintenanceAccess = maintenanceUsers.includes(res.locals.username);
		if(!hasMaintenanceAccess) {
			res.send('<center><h1>Maintenance!</h1></center><hr>');
			return;
		}
	}

	res.locals.$relativeTime = date => {
		const now = new Date().getTime();
		const options = { style: 'short', numeric: 'always' };
		let args = [];
		let timeDifference = date - now;

		if(Math.abs(timeDifference) > 3.154e+10)
			args = [Math.floor(timeDifference / 3.154e+9)/10, 'year'];
		else if(Math.abs(timeDifference) > 2.628e+9)
			args = [Math.floor(timeDifference / 2.628e+9), 'month'];
		else if(Math.abs(timeDifference) > 8.64e+7)
			args = [Math.floor(timeDifference / 8.64e+7), 'day'];
		else if(Math.abs(timeDifference) > 3.6e+6)
			args = [Math.floor(timeDifference / 3.6e+6), 'hour'];
		else if(Math.abs(timeDifference) > 6e+4)
			args = [Math.floor(timeDifference / 6e+4), 'minute'];
		else args = [Math.floor(timeDifference / 100)/10, 'second'];

		return new Intl.RelativeTimeFormat('en-us', options).format(...args);
	}

	res.locals.version = version;

	next();
});

const MIN_RATING_COUNT_TO_SHOW = 3;

app.get('/', validateToken, async (req, res) => {

	const trendingNotes = await sql`
		select
			n.id,
			u.display_name as author_display_name,
			u.is_verified as is_author_verified,
			n.title,
			n.keywords,
			n.thumbnail_url,
			n.views,
			ROUND(AVG(r.value), 1) as rating,
			COUNT(r.value) as rate_count,
			n.created_at
		from notes n
		join users u
			on n.author_name = u.name
		left join note_ratings r
			on n.id = r.note_id
		where n.unlisted = false
		group by n.id, u.display_name, u.is_verified
		order by n.views/((EXTRACT(epoch FROM now()-n.created_at)+1)/86400)^5 desc
		limit 3;
	`;

	const newNotes = await sql`
		select
			n.id,
			u.display_name as author_display_name,
			u.is_verified as is_author_verified,
			n.title,
			n.keywords,
			n.thumbnail_url,
			n.views,
			ROUND(AVG(r.value), 1) as rating,
			COUNT(r.value) as rate_count,
			n.created_at
		from notes n
		join users u
			on n.author_name = u.name
		left join note_ratings r
			on n.id = r.note_id
		where n.unlisted = false
		group by n.id, u.display_name, u.is_verified
		order by n.created_at desc
		limit 3;
	`;

	let userNotes = [];

	if(res.locals.isLoggedIn) {
		userNotes = await sql`
			select
				n.id,
				u.display_name as author_display_name,
				u.is_verified as is_author_verified,
				n.title,
				n.keywords,
				n.thumbnail_url,
				n.views,
				ROUND(AVG(r.value), 1) as rating,
				COUNT(r.value) as rate_count,
				n.created_at
			from notes n
			join users u
				on n.author_name = u.name
			left join note_ratings r
				on n.id = r.note_id
			where n.author_name = ${res.locals.username}
			group by n.id, u.display_name, u.is_verified
			order by n.created_at desc
			limit 3;
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
		return res.status(400).send(`Invalid UUID: <code>${noteId}</code>.`);
	}

	const notes = await sql`
		select
			n.*,
			u.display_name as author_display_name,
			u.is_verified as is_author_verified
		from notes n join users u
			on n.author_name = u.name
		where id = ${noteId};
	`;

	const ratings = await sql`
		select
			rater_name,
			value
		from note_ratings
		where note_id = ${noteId}
		order by value desc;
	`;

	const rating = average(ratings.map(rating => rating.value));

	if(notes.length === 0) {
		return res.status(404).send(`Note with id ${noteId} not found.`);
	}

	const commentCount = (await sql`select count(*) from comments where note_id = ${noteId}`)[0].count;

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
		content: '# Welcome to Kyanit editor!\n\nKyanit uses markdown with GitHub Flavoured Markdown, parsed using `marked.js`, and syntax highlighted by `prism.js`.',
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
		select
			id, title, content, keywords, unlisted, thumbnail_url
		from notes
		where id = ${noteId} and author_name = ${res.locals.username};
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
		select
			name, display_name, about, created_at, is_verified
		from users
		where name = ${req.params.username};
	`;

	const user = users[0];

	if(!user) {
		return res.status(404).send(`User with username ${req.params.username} not found.`);
	}

	let notes;
	if(res.locals.username === user.name) {
		// If the user is viewing their own profile, show unlisted notes.
		notes = await sql`
			select
				id, title, keywords, thumbnail_url, views, created_at, updated_at, unlisted
			from notes
			where author_name = ${user.name}
			order by created_at;
		`;
	} else {
		// Otherwise, only show listed notes.
		notes = await sql`
			select
				id, title, keywords, thumbnail_url, views, created_at, updated_at
			from notes
			where author_name = ${user.name} and unlisted = false
			order by created_at;
		`;
	}

	const page = req.params.page || 'about';

	const aboutHTMLContent = DOMPurify.sanitize(marked.parse(user.about), purifyOptions);

	res.render('dashboard', {
		user, notes, about: aboutHTMLContent, page
	});
});

app.get('/signup', (_req, res) => {
	res.render('coming-soon');
	return;

	// TODO
	res.render('signup');
});

app.get('/login', (_req, res) => {
	res.render('coming-soon');
	return;

	// TODO
	res.render('login');
});

app.get('/settings', (req, res) => {
	// TODO
	res.render('coming-soon');
})

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
		new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
	);

	// res.json(docs);

	res.render('docs', { docs });
});

app.get('/docs/:docname', async (req, res) => {
	const docname = req.params.docname;
	let doc;

	try {
		doc = fs.readFileSync(path.join(DOCS_DIR, `${docname}.md`), 'utf-8');
	} catch(error) {
		if(error.code === 'ENOENT') {
			return res.status(404).send(`Docs with docname <code>${docname}</code> not found`)
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

const PORT = process.env.PORT;
app.listen(PORT, async () => {
	console.log('Server is ready! With port', PORT);
});