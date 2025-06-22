const express = require('express');
const app = express();

const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const marked = require('marked');
const { markedRenderer } = require('./config.js');
marked.use({ renderer: markedRenderer });

const DOMPurify = require('isomorphic-dompurify');
const purifyOptions = { ADD_TAGS: ['fn'], ADD_ATTR: ['note'] };

const { mjpage } = require('mathjax-node-page');
const { mathjaxOptions } = require('./config.js');

const Kyanit = require('./modules/Kyanit.js');
const { isUUID } = Kyanit;

const { validateToken } = require('./modules/token.js');

//* Database
const { neon } = require('@neondatabase/serverless');

const { PG_HOST, PG_DATABASE, PG_USER, PG_PASSWORD } = process.env;
const sql = neon(`postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}/${PG_DATABASE}?sslmode=require`);

// Checks if two arrays intersect.
Array.prototype.intersectsWith = function(array) {
	if(!array || !Array.isArray(array)) return false;

	for(let i = 0; i < this.length; i++) {
		if(array.includes(this[i])) return true;
	}

	return false;
};

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
		const options = { style: 'long', numeric: 'always' };
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

	next();
});

app.get('/', async (req, res) => {
	/** @type {Kyanit.Note[]} */
	let notes;

	if(req.query.search) {
		const searchQueries = req.query.search.toLowerCase().split(/ +/g);

		notes = await sql`
		select
			n.id,
			n.author_name,
			u.display_name as author_display_name,
			u.is_verified as is_author_verified,
			n.title,
			n.keywords,
			n.thumbnail_url,
			n.views,
			n.created_at,
			n.updated_at
		from notes n join users u
			on n.author_name = u.name
		where unlisted = false and keywords && ${searchQueries}::text[]
		order by views desc;
	`;
	} else {
		notes = await sql`
		select
			n.id,
			n.author_name,
			u.display_name as author_display_name,
			u.is_verified as is_author_verified,
			n.title,
			n.keywords,
			n.thumbnail_url,
			n.views,
			n.created_at,
			n.updated_at
		from notes n join users u
			on n.author_name = u.name
		where unlisted = false
		order by views desc;
	`;
	}

	// Pin the tutorial note.
	const tutorial = notes.find(note => note.id === '00000000-0000-0000-0000-000000000000');
	if(tutorial) {
		notes = notes.filter(note => note.id !== tutorial.id);
		notes.unshift(tutorial);
	}

	res.render('index', {
		notes, searchQuery: req.query.search
	});
});

app.get('/note/:noteId', async (req, res) => {
	const noteId = req.params.noteId;

	if(!isUUID(noteId)) {
		res.status(400).send(`Invalid UUID: <code>${noteId}</code>.`);
		return;
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

	if(notes.length === 0) {
		res.status(404).send(`Note with id ${noteId} not found.`);
		return;
	}

	const commentCount = (await sql`select count(*) from comments where note_id = ${noteId}`)[0].count;

	const note = notes[0];
	const backslash = /\\(?![*_$~`])/g;
	const htmlContent = DOMPurify.sanitize(marked.parse(note.content.replace(backslash, "\\\\")), purifyOptions);

	delete note.content;

	res.render('note', { note, commentCount, htmlContent });
});

app.get('/create', async (req, res) => {
	if(!res.locals.isLoggedIn) return res.redirect('back');

	const startingNote = {
		title: 'Untitled',
		content: '# Welcome to eNotes editor!\n\neNotes uses markdown with GitHub Flavoured Markdown, parsed using `marked.js`, and syntax highlighted by `prism.js`.',
		keywords: [],
		unlisted: false,
		thumbnail_url: '',
	};

	res.render('create', { note: startingNote, mode: 'create' });
});

app.get('/edit/:noteId', async (req, res) => {
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

app.get(['/user/:username', '/user/:username/:page'], async (req, res) => {
	const users = await sql`
		select
			name, display_name, about, created_at, is_verified
		from users
		where name = ${req.params.username};
	`;

	const user = users[0];

	if(!user) {
		res.status(404).send(`User with username ${req.params.username} not found.`)
		return;
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

	const backslash = /\\(?![*_$~`])/g;
	const aboutHTMLContent = DOMPurify.sanitize(marked.parse(user.about.replace(backslash, "\\\\")), purifyOptions);

	res.render('dashboard', {
		user, notes, about: aboutHTMLContent, page
	});
});

// Send simplified or minimized note. No CSS.
app.get('/:reduce/note/:noteId', async (req, res) => {
	const noteId = req.params.noteId;

	if(!isUUID(noteId)) {
		res.status(400).send(`Invalid UUID: <code>${noteId}</code>.`);
		return;
	}

	const notes = await sql`
		select
			n.title,
			n.content,
			n.author_name,
			u.display_name as author_display_name
		from notes n join users u
			on n.author_name = u.name
		where id = ${noteId};
	`;

	const note = notes[0];

	if(!note) {
		res.status(404).send(`Note with id <code>${noteId}</code> not found.`);
		return;
	}

	const backslash = /\\(?![*_$~`])/g;
	const htmlContent = DOMPurify.sanitize(marked.parse(note.content.replace(backslash, "\\\\")), purifyOptions);

	delete note.content;

	if(req.params.reduce === 'min') {
		// `min` is the bare bones, no MathJAX.
		res.render('min/note', { content: htmlContent, note });
	} else if(req.params.reduce === 'simple') {
		// `simple` still contains LaTeX in svg.
		mjpage(htmlContent, mathjaxOptions, { svg: true }, output => {
			res.render('min/note', { content: output, note });
		});
	}
});

app.get('/signup', (_req, res) => {
	res.render('signup');
});

app.get('/login', (_req, res) => {
	res.render('login');
});

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