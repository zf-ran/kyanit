const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server);

const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const marked = require('marked');
const markedRenderer = {
	heading(text, level) {
		const headingIdRegex = /(?: +|^)\{#(\d|[a-z]|[\w-]*)\}(?: +|$)/i;
		const matches = text.match(headingIdRegex);

		let id;
		if(!matches) return `<h${level} class="heading"><span class="heading-content" data-header="${level}">${text.replace(headingIdRegex, '')}</span></h${level}>`;
		else id = matches[1];

		return `<h${level} class="heading" id="section-${id}"><span class="heading-content" data-header="${level}">${text.replace(headingIdRegex, '')}</span><a href="#section-${id}" class="header-redirect">§</a></h${level}>`;
	},
	code(code, infostring, escaped) {
		return `<pre class="code-block"><code class="language-${infostring}">` + code + '</code></pre>';
	},
	image(href, title, text) {
		if(title) return `<img class="simple-image" loading="lazy" alt="${text}" title="${title}" src="${href}">`;
		else return `<img class="simple-image" loading="lazy" alt="${text}" src="${href}">`;
	},
	codespan(text) {
		return `<code>${text}</code>`;
	}
}

marked.use({ renderer: markedRenderer });

const DOMPurify = require('isomorphic-dompurify');
const purifyOptions = { ADD_TAGS: ['fn'], ADD_ATTR: ['note'] };

const { mjpage } = require('mathjax-node-page');
const mathjaxOptions = {
	format: [ 'TeX' ],
	singleDollars: true,
	MathJax: {
		loader: { load: [ 'input/tex', 'output/svg', '[tex]/ams' ] },
		tex: {
			inlineMath: [['$', '$'], ['\\(', '\\)']],
			packages: { '[+]': ['ams'] }
		},
		options: {
			ignoreHtmlClass: 'code-text',
			renderActions: {
				addMenu: []
			}
		},
		svg: { mtextInheritFont: true },
		showMathMenu: false
	}
}

const Kyanit = require('./modules/Kyanit.js');
const db = require('./modules/database.js');

// Checks if two arrays intersect.
Array.prototype.intersectsWith = function(array) {
	if(!array || !Array.isArray(array)) return false;

	for(let i = 0; i < this.length; i++) {
		if(array.includes(this[i])) return true;
	}

	return false;
};

// Sums all the elements in an array.
// If the array is empty, returns 0.
// If one of the element is NaN, throw a TypeError.
Array.prototype.sum = function() {
	let sum = 0;

	for(let i = 0; i < this.length; i++) {
		if(isNaN(this[i])) throw TypeError(`Element at index ${i} (${this[i]}) is not a number (NaN)`);
		sum += this[i];
	}

	return sum;
};

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser.json());

/** Is the server in maintenance mode? @type {boolean} */
const MAINTENANCE = JSON.parse(process.env.MAINTENANCE);
const maintenanceUsers = process.env.MAINTENANCE_USERS.split('\n');

app.use(async (req, res, next) => {
	// Delete cookies if the user isn't logged in.
	res.locals.$isLoggedIn = await isLoggedIn(req.cookies);
	if(!res.locals.$isLoggedIn) {
		res.clearCookie('username');
		res.clearCookie('password');
	}

	if(MAINTENANCE) {
		// Check if the user has access to maintenance.
		const hasMaintenanceAccess = maintenanceUsers.includes(req.cookies.username);
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

	res.locals.$cookies = req.cookies;

	next();
});

app.get('/', async (req, res) => {
	/** @type {Kyanit.User[]} */
	const users = await db.get('users');

	/** @type {Kyanit.Note[]} */
	let notes = (await db.get('notes')).filter(note => !note.unlisted).map(note => { delete note.content; delete note.comments; delete note.thumbnailURL; return note; });

	if(req.query.search) {
		const searchQuery = req.query.search.toLowerCase().split(/ +/g);
		notes = notes.filter(note => note.keywords.intersectsWith(searchQuery));
	}

	// Add `authorDisplayName` and `isAuthorVerified` to every `notes`.
	for(let i = 0; i < notes.length; i++) {
		const note = notes[i];

		const user = users.find(user => user.name === note.authorName);
		note.authorDisplayName = user.displayName;
		note.isAuthorVerified = user.verified;
	}

	// Sort by views.
	notes.sort((a, b) => b.views - a.views);

	// Pin the tutorial note.
	const tutorial = notes.find(note => note.id === 'tutorial');
	if(tutorial) {
		notes = notes.filter(note => note.id !== tutorial.id);
		notes.unshift(tutorial);
	}

	res.render('index', {
		notes,
		searchQuery: req.query.search
	});
});

app.get('/note/:noteid', async (req, res) => {
	const noteId = req.params.noteid;

	/** @type {Kyanit.Note[]} */
	const notes = await db.get('notes');
	const note = notes.find(note => note.id === req.params.noteid);

	if(!note) {
		res.status(404).send(`Note with id ${noteId} not found.`)
		return;
	}

	const user = (await db.get('users')).find(user => user.name === note.authorName);
	const commentCount = (await db.get('comments')).filter(comment => comment.noteId === noteId).length;

	const backslash = /\\(?![*_$~`])/g;

	res.render('note', {
		note, user, commentCount,
		content: DOMPurify.sanitize(marked.parse(note.content.replace(backslash, "\\\\")), purifyOptions)
	});
});

app.get('/create', async (req, res) => {
	if(!res.locals.$isLoggedIn) res.redirect('back');

	const startingNote = new Kyanit.Note(
		'',
		'Untitled',
		'# Welcome to eNotes editor!\n\neNotes uses markdown with GitHub Flavoured Markdown, parsed using `marked.js`, and syntax highlighted by `prism.js`.',
		[],
		req.cookies.username,
		'',
		false
	);

	res.render('create', { note: startingNote, mode: 'create' });
});

app.get('/create/:noteid', async (req, res) => {
	if(!res.locals.$isLoggedIn) res.redirect('back');

	/** @type {Kyanit.Note|null} */
	const note = (await db.get('notes')).find(note => note.id === req.params.noteid);

	if(!note) return res.redirect('/create');
	if(req.cookies.username !== note.authorName) return res.redirect('back');

	res.render('create', { note, mode: 'edit' });
});

app.get(['/user/:username', '/user/:username/:page'], async (req, res) => {
	/** @type {Kyanit.User[]} */
	const users = await db.get('users');

	const user = users.find(user => user.name === req.params.username);

	if(!user) {
		res.status(404).send(`User with username ${req.params.username} not found.`)
		return;
	}

	/** The user’s notes @type {Kyanit.Note[]} */
	let notes = (await db.get('notes')).filter(note => note.authorName === user.name).map(note => { delete note.content; delete note.comments; delete note.thumbnailURL; return note; });

	// Hide unlisted notes if the user is not the author.
	if(!res.locals.$isLoggedIn || req.cookies.username !== user.name) {
		notes = notes.filter(note => !note.unlisted);
	}

	const userPublicInfo = Kyanit.User.prototype.getPublicInfo.call(user);
	const page = req.params.page || 'about';
	const backslash = /\\(?![*_$~`])/g;

	res.render('dashboard', {
		user: userPublicInfo, notes, about: DOMPurify.sanitize(marked.parse(user.about.replace(backslash, "\\\\")), purifyOptions), page
	});
});

// Send simplified or minimized note. No CSS.
app.get('/:reduce/note/:noteid', async (req, res) => {
	const noteId = req.params.noteid;
	const note = (await db.get('notes')).find(note => note.id === req.params.noteid);

	if(!note) res.status(404).send(`Note with id <code>${noteId}</code> not found.`);

	const user = (await db.get('users')).find(user => user.name === note.authorName);

	const backslash = /\\(?![*_$~`])/g;

	let contentInput = DOMPurify.sanitize(marked.parse(note.content.replace(backslash, "\\\\")), purifyOptions);

	if(req.params.reduce === 'min') {
		// `min` is the bare bones, no LaTeX.
		res.render('min/note', {
			content: contentInput,
			note,
			authorDisplayName: user.displayName
		});
	} else if(req.params.reduce === 'simple') {
		// `simple` still contains LaTeX in svg.
		mjpage(contentInput, mathjaxOptions, { svg: true }, output => {
			res.render('min/note', {
				content: output,
				note,
				authorDisplayName: user.displayName
			});
		});
	}
});

app.get('/signup', (req, res) => {
	res.render('signup');
});

app.get('/login', (req, res) => {
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
		// Inject IO using middleware.
		req.io = io;
		next();
	},
	userRoutes,
	noteRoutes,
	commentRoutes,
	commentVoteRoutes
);

io.on('connection', socket => {
	let addViewTimeout;
	let viewedInTheSameSession = false;

	// COMMENTS’ SOCKETS
	socket.on('note:connect', noteId => {
		socket.join(`note:${noteId}`);
	});

	socket.on('note:view', (username, noteId) => {
		if(viewedInTheSameSession) return;

		viewedInTheSameSession = true;

		addViewTimeout = setTimeout(async () => {
			const users = await db.get('users');
			const user = users.find(user => username === user.name);
			if(!user) return;

			const notes = await db.get('notes');
			const note = notes.find(note => note.id === noteId);
			if(!note) return;

			if(typeof note.views !== 'number' || note.views < 0 || isNaN(note.views)) note.views = 0;

			note.views++;

			await db.set('users', users);
		}, 30_000);
	});

	socket.on('disconnect', () => {
		clearTimeout(addViewTimeout);
	});
});

async function isLoggedIn(cookies) {
	if(!cookies.username || !cookies.password) return false;

	const users = await db.get('users');
	const user = users.find(user => user.name === cookies.username);

	if(!user) return false;

	return (user.password === cookies.password);
}

const PORT = process.env.PORT;
server.listen(PORT, async () => {
	console.log('Server is ready! With port', PORT);
});