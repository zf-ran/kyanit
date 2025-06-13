const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server);

const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');

const marked = require('marked');
const markedRenderer = {
	heading(text, level, raw) {
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
	codespan(text, raw) {
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

const crypto = require('crypto');

const Kyanit = require('./modules/Kyanit.js');
const { kStringMaxLength } = require('buffer');

// DATABASE -----------------
const db = {
	path: path.join(__dirname, '.data', 'database.json'),
	indentation: parseInt(process.env.DATABASE_INDENTATION),
	encoding: 'utf8',
	async getAll() {
		let values = JSON.parse(await fs.readFileSync(this.path, { encoding: this.encoding }));

		return values;
	},
	async set(key, value) {
		let database = await this.getAll();
		database[key] = value;

		await fs.writeFileSync(this.path, JSON.stringify(database, null, this.indentation), { encoding: this.encoding });
	},
	async get(key) {
		const database = await this.getAll();
		let value = database[key];
		return value;
	},
	async remove(key) {
		const database = await this.getAll();
		delete database[key];

		await fs.writeFileSync(this.path, JSON.stringify(database, null, this.indentation), { encoding: this.encoding });
	},
	async reset() {
		await fs.writeFileSync(this.path, '{}', { encoding: this.encoding });
	}
};
// -------------------------

let operatorKey = resetOperatorKey();

function resetOperatorKey() {
	let newOperatorKey = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
	console.log(newOperatorKey);
	return newOperatorKey;
}

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
app.use(express.static('public'));
app.use(cookieParser());

/** Is the server in maintenance mode? @type {boolean} */
const MAINTENANCE = JSON.parse(process.env.MAINTENANCE);

const maintenanceUsers = process.env.MAINTENANCE_USERS.split('\n');
app.use(async (req, res, next) => {
	if(MAINTENANCE) {
		// Check if the user has access to maintenance.
		const hasMaintenanceAccess = maintenanceUsers.includes(req.cookies['username']);
		if(!hasMaintenanceAccess) {
			res.send('<center><h1>Maintenance!</h1></center><hr>');
			return;
		}
	}

	// Delete cookies if the user isn't logged in.
	res.locals.$isLoggedIn = await isLoggedIn(req.cookies);
	if(!res.locals.$isLoggedIn) {
		res.clearCookie('username');
		res.clearCookie('password');
	}

	res.locals.$relativeTime = date => {
		const now = new Date().getTime();
		let option = { style: 'long', numeric: 'always' };
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

		return new Intl.RelativeTimeFormat('en-us', option).format(...args);
	}

	res.locals.$cookies = req.cookies;

	next();
});

app.get('/operator', (req, res) => {
	res.render('operator');
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

	if(!note) res.redirect('back');
	if(req.cookies.username !== note.authorName) res.redirect('back');

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

app.get('/signup', async (req, res) => {
	res.render('signup');
});

app.get('/login', async (req, res) => {
	res.render('login');
});

// APIs
app.get('/api/comments', async (req, res) => {
	const noteId = req.query.note_id;

	/** Comments on the specified note @type {Kyanit.Comment[]} */
	const noteComments = (await db.get('comments')).filter(comment => comment.noteId === noteId);

	/** Comments’ votes on the specified note @type {Kyanit.CommentVote[]} */
	const noteCommentVotes = (await db.get('commentVotes')).filter(vote => vote.noteId === noteId);

	/** @type {Kyanit.User[]} */
	const users = await db.get('users');

	for (let i = 0; i < noteComments.length; i++) {
		const comment = noteComments[i];

		/** The votes on the specified comment */
		const commentVotes = noteCommentVotes.filter(vote => vote.commentId === comment.id);

		// Add property `voteCount` and `votes`.
		comment.voteCount = commentVotes.map(vote => vote.value).sum();
		comment.votes = commentVotes;

		// Add property `displayName` for commenter’s display name.
		comment.displayName = users.find(user => user.name === comment.username).displayName;
	}

	res.json(noteComments);
});

io.on('connection', socket => {
	let addViewTimeout;
	let viewedInTheSameSession = false;

	socket.on('get--usernames', async (callback) => {
		const users = await db.get('users');
		const usernames = users.map(user => user.name);
		callback(usernames);
	});

	socket.on('set--user', async (name, password) => {
		const users = await db.get('users');

		const user = new Kyanit.User(name, password);
		users.push(user);

		await db.set('users', users);
	});

	socket.on('get--is-password-correct', async (name, password, callback) => {
		const users = await db.get('users');
		const user = users.find(user => user.name === name);
		const isCorrect = (user?.password === password);

		callback(isCorrect);
	});

	socket.on('get--user-password', async (name, cookiePassword, callback) => {
		const users = await db.get('users');

		/** @type {Kyanit.User} */
		const user = users.find(user => user.name === name);
		if(!user) return;

		if(user.password === cookiePassword) callback(user.password);
	});

	socket.on('set--user-information', async (name, { displayName, about, password }) => {
		const users = await db.get('users');

		/** @type {Kyanit.User} */
		const user = users.find(user => user.name === name);

		// Empty string means the user inputs nothing, (inputs a literal '').
		// Undefined means the user didn’t input anything, (didn’t change anything).

		if(displayName === '') user.displayName = name;
		else if(displayName !== undefined) user.displayName = displayName;

		if(about !== undefined) user.about = about;

		if(password) user.password = password;

		await db.set('users', users);
	});

	socket.on('set--note', async (title, content, keywords, authorName, thumbnailURL, unlisted, callback) => {
		const notes = await db.get('notes');

		const noteIDs = notes.map(note => note.id);

		let id = crypto.randomUUID();

		// If the ID is taken, loop until a unique ID is found.
		while(noteIDs.includes(id)) {
			id = crypto.randomUUID();
		}

		const note = new Kyanit.Note(id, title, content, keywords, authorName, thumbnailURL, unlisted);
		notes.push(note);

		await db.set('notes', notes);

		callback(id);
	});

	socket.on('edit--note', async (id, title, content, keywords, authorName, thumbnailURL, unlisted, callback) => {
		const notes = await db.get('notes');

		/** @type {Kyanit.Note} */
		const note = notes.find(note => note.id === id);

		note.title = title;
		note.content = content;
		note.unlisted = unlisted;
		note.thumbnailURL = thumbnailURL
		note.keywords = keywords;
		note.lastEdited = new Date().getTime();

		await db.set('notes', notes);

		callback(id);
	});

	socket.on('delete--note', async (name, password, noteId, callback) => {
		const notes = await db.get('notes');
		/** @type {Kyanit.Note} */
		const note = notes.find(note => note.id === noteId);
		if(!note) return;

		// Check if the user is authorized.
		const users = await db.get('users');
		/** @type {Kyanit.User} */
		const user = users.find(user => user.name === name);
		if(!user) return;
		if(user.password !== password) return;

		// Delete the note’s comments.
		/** @type {Kyanit.Comment[]} */
		let comments = await db.get('comments');
		comments = comments.filter(comment => comment.noteId !== noteId); // Filters different note ID, the same note ID will be “deleted”.

		// Delete the comments’ votes.
		/** @type {Kyanit.CommentVote[]} */
		let commentVotes = await db.get('commentVotes');
		commentVotes = commentVotes.filter(commentVote => commentVote.noteId !== noteId);

		// Delete the specified note.
		const noteIndex = notes.indexOf(note);
		notes.splice(noteIndex, 1);

		await db.set('notes', notes);
		await db.set('comments', comments);
		await db.set('commentVotes', commentVotes);

		callback();
	});

	// COMMENTS’ SOCKETS
	socket.on('connect-to-note', noteId => {
		socket.join(`note/${noteId}`)
	});

	socket.on('set--comment', async (noteId, commenterName, content, parentId, callback) => {
		/** @type {Kyanit.User} */
		const commenter = (await db.get('users')).find(user => user.name === commenterName);

		const comments = await db.get('comments');

		const commentIDs = comments.map(comment => comment.id);
		let id = crypto.randomUUID();
		while(commentIDs.includes(id)) {
			id = crypto.randomUUID();
		}

		const comment = new Kyanit.Comment(id, noteId, commenterName, DOMPurify.sanitize(content), parentId);

		comments.push(comment);

		await db.set('comments', comments);

		comment.displayName = commenter.displayName;
		comment.votes = []; comment.voteCount = 0;
		io.to(`note/${noteId}`).emit('send--comment-added', comment);
		callback();
	});

	socket.on('delete--comment', async (noteId, commentId, callback) => {
		const comments = await db.get('comments');
		const comment = comments.find(comment => comment.id === commentId);

		// Deletes the comment.
		comments.splice(comments.indexOf(comment), 1);

		// Delete the comment’s votes.
		let commentVotes = await db.get('commentVotes');
		commentVotes = commentVotes.filter(commentVote => commentVote.commentId !== commentId);

		// Delete the comment’s children (or replies, or threads, or whatever).
		let parentIDs = [ commentId ];
		// Reverse and increment from the last element so the indexing won’t be fucked up while looping. (The indexing is still same as normal looping.)
		comments.reverse(); 
		for(let i = comments.length - 1; i >= 0; i--) {
			const comment = comments[i];

			// If the comment is the root, don’t do anything.
			if(comment.parentId === null) continue;

			// If the comment’s parent is in `parentIDs`,
			if(parentIDs.includes(comment.parentId)) {
				// push the comment ID to `parentIDs`,
				parentIDs.push(comment.id);

				// delete the comment,
				comments.splice(comments.indexOf(comment), 1);

				// and delete the comment’s votes.
				commentVotes = commentVotes.filter(commentVote => commentVote.commentId !== comment.id);
			}
		}
		comments.reverse();

		await db.set('comments', comments);
		await db.set('commentVotes', commentVotes);

		callback(commentId);
		io.to(`note/${noteId}`).emit('send--comment-deleted', commentId);
	});

	socket.on('set--comment-vote', async (noteId, commentId, voterName, value, callback = () => {}) => {
		if(value <= -1) value = -1;
		else if(value >= 1) value = 1;
		else return;

		// If the voter doesn’t exist, return.
		const user = (await db.get('users')).find(user => user.name === voterName);
		if(!user) return;

		/** @type {Kyanit.CommentVote[]} */
		const commentVotes = await db.get('commentVotes');
		const commentVote = commentVotes.find(commentVote => 
			commentVote.noteId === noteId
			&& commentVote.commentId === commentId
			&& commentVote.voterName === voterName);

		if(!commentVote) {
			// Creates a vote if there's no vote yet.
			const commentVote = new Kyanit.CommentVote(noteId, commentId, voterName, value);
			commentVotes.push(commentVote);
		} else if(commentVote.value === value) {
			// If the user clicks vote again, the vote is deleted.
			const commentVoteIndex = commentVotes.indexOf(commentVote);
			commentVotes.splice(commentVoteIndex, 1);
		} else {
			// Modify the vote value if the vote already exists.
			commentVote.value = value;
		}

		const currentCount = commentVotes
			.filter(commentVote => commentVote.commentId === commentId) // Selects the vote that has the comment ID.
			.map(commentVote => commentVote.value) // Map it to only the vote value. [{}, {}, ...] -> [-1, 1, ...]
			.sum();

		await db.set('commentVotes', commentVotes);

		callback(currentCount);
		io.to(`note/${noteId}`).emit('send--comment-voted', commentId, currentCount);
	});

	socket.on('get--user-to-display-name', async () => {
		const users = await db.get('users');
		let userToDisplay = {};

		for(let i = 0; i < users.length; i++) {
			const user = users[i];
			userToDisplay[user.name] = user.displayName;
		}

		socket.emit('send--user-to-display-name');
	});

	socket.on('add--view-timeout', (username, noteId) => {
		if(viewedInTheSameSession) return;

		viewedInTheSameSession = true;

		addViewTimeout = setTimeout(async () => {
			const users = await db.get('users');

			const user = users.find(user => username === user.name);
			if(!user) return;

			const note = user.notes.find(note => note.id === noteId);
			if(!note) return;

			if(typeof note.views !== 'number' || note.views < 0 || isNaN(note.views)) note.views = 0;

			note.views++;

			await db.set('users', users);
		}, 30_000);
	});

	socket.on('disconnect', () => {
		clearTimeout(addViewTimeout);
	});

	socket.on('req--check-operator-key', (_operatorKey, callback) => {
		if(_operatorKey !== operatorKey) callback(false)
		else if(_operatorKey === operatorKey) callback(true)

		operatorKey = resetOperatorKey();
	});

	socket.on('req--database', async callback => {
		callback(await db.getAll());
	});
});

// function resetDatabase() {
// 	await db.set('users', []);
// }

async function verifyUser(name, verified) {
	const users = await db.get('users');
	const user = users.find(user => user.name === name);

	user.verified = verified;

	await db.set('users', users);
}

async function isLoggedIn(cookies) {
	if(!cookies.username || !cookies.password) return false;

	const users = await db.get('users');
	const user = users.find(user => user.name === cookies.username);

	if(!user) return false;

	return (user.password === cookies.password);
}

async function userToDisplayName() {
	const users = await db.get('users');
	let userToDisplay = {};

	for(let i = 0; i < users.length; i++) {
		const user = users[i];
		userToDisplay[user.name] = user.displayName;
	}

	return JSON.stringify(userToDisplay);
};

const PORT = process.env.PORT;
server.listen(PORT, async () => {
	console.log('Server is ready! With port', PORT);
});