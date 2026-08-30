const express = require('express');
const app = express();

const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const matter = require('gray-matter');

const { MIN_RATING_COUNT_TO_SHOW } = require('./config');

const Kyanit = require('./modules/Kyanit');
const { parseAndPurify } = require('./modules/marked');
const { validateToken } = require('./modules/token');
const { average, relativeTimeFormatter, isUUID } = require('./modules/utils');

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
	res.locals.$relativeTimeFormatter = relativeTimeFormatter;

	res.locals.version = version;
	res.locals.MIN_RATING_COUNT_TO_SHOW = MIN_RATING_COUNT_TO_SHOW;

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

app.get('/', async (req, res) => {
	const { isLoggedIn, username } = res.locals;

	const [trendingNotes, recentNotes, userNotes] = await Promise.all([
		Kyanit.Note.getCards.trending(3),
		Kyanit.Note.getCards.recent(3),
		isLoggedIn
			? Kyanit.Note.getCards.author(username, 3)
			: Promise.resolve([]),
	]);

	res.render('index', { trendingNotes, recentNotes, userNotes });
});

app.get('/explore', async (req, res) => {
	res.render('explore');
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

	const [note, ratings, commentCount] = await Promise.all([
		Kyanit.Note.getNote(noteId),
		Kyanit.Note.getNote.ratings(noteId),
		Kyanit.Note.getNote.commentCount(noteId),
	]);

	if (!note) {
		res.status(404).render('error', {
			icon: 'search_off',
			title: 'Note not Found',
			message: `Note with id <code class="code-span">${noteId}</code> not found. The note might be deleted by the author. Check for typos.`,
		});

		return;
	}

	const username = res.locals.username;

	const collaborators = await Kyanit.NoteCollaborator.getNoteCollaborators(noteId);

	const permission = await Kyanit.NoteCollaborator
		.getNoteCollaborators.permission(noteId, username);

	if (permission)
		permission.canEdit = true;

	const defaultPermission = {
		canEdit: false,
		canPublish: false,
		canDelete: false,
		canChangeTitle: false,
		canChangeKeywords: false,
		canChangeThumbnail: false,
		canChangeVisibility: false,
		...permission,
	};

	const rating = average(ratings.map(rating => rating.value));
	const htmlContent = parseAndPurify(note.content);

	delete note.content;

	res.render('note', {
		note,
		rating,
		ratings,
		commentCount,
		htmlContent,
		permission: defaultPermission,
		collaborators,
	});
});

app.get('/create', async (req, res) => {
	if (!res.locals.isLoggedIn)
		return res.redirect(req.get('Referrer') || '/');

	const startingNote = {
		title: 'Untitled',
		content:
			'# Welcome to Kyanit editor!\n\n' +
			'Kyanit uses markdown with GitHub Flavoured Markdown, parsed using `marked.js`, and syntax highlighted by `prism.js`.',
		keywords: [],
		unlisted: false,
		thumbnail_url: '',
	};

	const permission = {
		collaboratorName: res.locals.username,
		canPublish: true,
		canDelete: true,
		canChangeTitle: true,
		canChangeKeywords: true,
		canChangeThumbnail: true,
		canChangeVisibility: true,
	};

	res.render('editor', {
		note: startingNote,
		isAuthor: true,
		collaborators: [],
		permission,
		mode: 'create',
	});
});

app.get('/edit/:noteId', async (req, res) => {
	const { isLoggedIn, username } = res.locals;

	if (!isLoggedIn)
		return res.location(req.get('Referrer') || '/');

	const noteId = req.params.noteId;

	if (!isUUID(noteId)) {
		res.status(401).redirect('/create');
		return;
	}

	const note = await Kyanit.Note.getEdit(noteId);

	if (!note) {
		res.status(404).render('error', {
			icon: 'search_off',
			title: 'Note not Found',
			message: `Note with id <code class="code-span">${noteId}</code> not found.`,
		});

		return;
	}

	const collaborators = await Kyanit.NoteCollaborator.getNoteCollaborators(noteId);

	const permission = await Kyanit.NoteCollaborator
		.getNoteCollaborators.permission(noteId, username);

	if (!permission) {
		res.status(403).render('error', {
			icon: 'block',
			title: 'Not your Note',
			message: `You are trying to edit someone else's note.`
		});

		return;
	}

	res.render('editor', {
		note,
		isAuthor: permission.collaboratorName === note.authorName,
		permission,
		collaborators,
		mode: 'edit',
	});
});

app.get('/user/:username', async (req, res) => {
	const user = await Kyanit.User.getUser(req.params.username);

	if(!user) {
		res.status(404).render('error', {
			icon: 'search_off',
			title: 'User not Found',
			message: `User with username <code class="code-span">${req.params.username}</code> not found.`
		});

		return;
	}

	const includeUnlisted = res.locals.username === user.name;
	const notes = await Kyanit.Note.getProfile(user.name, includeUnlisted);

	const aboutHTMLContent = parseAndPurify(user.about);

	const commentCount = await Kyanit.User.getUser.commentCount(user.name);

	res.render('profile', {
		user, notes, about: aboutHTMLContent,
		commentCount
	});
});

app.get('/signup', (_req, res) => {
	res.render('auth', { mode: 'signup' });
});

app.get('/login', (_req, res) => {
	res.render('auth', { mode: 'login' });
});

app.get('/settings', (req, res) => {
	// TODO
	res.render('coming-soon');
});

//* Docs
const yaml = require('yaml');
const fs = require('fs');

const DOCS_DIR = path.join(__dirname, 'docs');

app.get('/docs', async (req, res) => {
	const fileNames = fs.readdirSync(DOCS_DIR)
		.filter(file =>
			file.endsWith('.md') && !file.startsWith('.')
		);

	const docs = fileNames
		.map(fileName => {
			const file = fs.readFileSync(path.join(DOCS_DIR, fileName), 'utf-8');
			const { data: metadata, content } = matter(file);
			return { ...metadata, docname: fileName.slice(0, -3) };
		})
		.sort((a, b) =>
			new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
		);

	res.render('docs', { docs });
});

app.get('/docs/:docname', async (req, res) => {
	const docname = req.params.docname;

	try {
		const file = fs.readFileSync(path.join(DOCS_DIR, `${docname}.md`), 'utf-8');
		const { data: metadata, content } = matter(file);

		const htmlContent = parseAndPurify(content);

		res.render('doc', { metadata, htmlContent });
	} catch(error) {
		if(error.code === 'ENOENT') {
			res.status(404).render('error', {
				icon: 'search_off',
				title: 'Docs not Found',
				message: `Docs with docname <code class="code-span">${docname}</code> not found.`,
			});

			return;
		}
	}
});

app.get('/s/:owner/:slug', async (req, res) => {
	const { owner, slug } = req.params;

	const link = await Kyanit.ShortLink.getShortLink(owner, slug);

	if (!link) {
		res.status(404).render('error', {
			icon: 'close',
			title: 'Shortened URL not Found',
			message: `No shortened URL with slug <code>${slug}</code>.`,
		});

		return;
	}

	res.redirect(link.originalURL);
});

//* APIs 
const userRoutes = require('./routes/users');
const noteRoutes = require('./routes/notes');
const noteCollaboratorRoutes = require('./routes/noteCollaborators');
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
	noteCollaboratorRoutes,
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