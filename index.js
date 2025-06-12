const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);
const agent = new http.Agent({
	keepAlive: true,
	keepAliveMsecs: 1000,
	maxSockets: 1,
});

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

const crypto = require('crypto');
const EN = require('./modules/EN.js');

// DATABASE -----------------
const db = {
	path: path.join(__dirname, '.data', 'database.json'),
	encoding: 'utf8',
	async getAll() {
		let values = JSON.parse(await fs.readFileSync(this.path, { encoding: this.encoding }));

		return values;
	},
	async set(key, value) {
		let database = await this.getAll();
		database[key] = value;

		await fs.writeFileSync(this.path, JSON.stringify(database, null, 2), { encoding: this.encoding });
	},
	async get(key) {
		const database = await this.getAll();
		let value = database[key];
		return value;
	},
	async remove(key) {
		const database = await this.getAll();
		delete database[key];

		await fs.writeFileSync(this.path, JSON.stringify(database, null, 2), { encoding: this.encoding });
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

const MAINTENANCE = false;
const maintenanceUsers = process.env.MAINTENANCE_USERS.split('\n');
app.use(async (req, res, next) => {
	if(MAINTENANCE) {
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
	const users = await db.get('users');
	let notes = JSON.parse(JSON.stringify(users.map(user => user.notes).flat(1).filter(note => !note.unlisted))).map(note => { delete note.content; return note });

	if(req.query.search) {
		const searchQuery = req.query.search.toLowerCase().split(/ +/g);

		notes = notes.filter(note => note.keywords.intersectsWith(searchQuery));
	}

	for(let i = 0; i < notes.length; i++) {
		const user = users.find(user => user.name === notes[i].authorName);
		notes[i].authorDisplayName = user.displayName;
		notes[i].isAuthorVerified = user.verified;
	}

	notes.sort((a, b) => b.views - a.views);

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
	const users = await db.get('users');
	const note = users?.map(user => user.notes).flat(1).find(note => note.id === req.params.noteid);
	const user = users.find(user => user.name === note?.authorName);
	const authorDisplayName = user?.displayName;

	if(!note) {
		res.render('note', {
			note: {
				title: 'Note unavailable!',
				thumbnailURL: 'https://static.wixstatic.com/media/422339_2c4f6dd077334ad3b4a20dcf6a31f1ea~mv2.png/v1/fill/w_560,h_142,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/disability%20webpage%20currently%20unavailable%20banner.png',
				description: 'The note you’re opening is not available',
				content: '<center>The note that you want to see is unavailable, check for typos, if the note is still unavailable, might be because this note is deleted by the publisher.<br><img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWY1Y3I4amNncWY4anR4b3N5MGZncDMwZ2Q1Z2gxNjRseHE2MzMxZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/YyKPbc5OOTSQE/giphy.gif" /></center>',
				id: '0',
				keywords: [],
				authorName: 'system',
				published: new Date().getTime(),
				unlisted: true,
				views: Math.floor(Math.random() * 1_000_000),
				comments: []
			},
			content: '<center>The note that you want to see is unavailable, check for typos, if the note is still unavailable, might be because this note is deleted by the publisher.<br><img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWY1Y3I4amNncWY4anR4b3N5MGZncDMwZ2Q1Z2gxNjRseHE2MzMxZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/YyKPbc5OOTSQE/giphy.gif" /></center>',
			user: {
				name: 'system',
				displayName: 'System',
				notes: [],
				about: '',
				registered: 0,
				verified: true,
			},
			commentVotes: []
		});
		return;
	}

	for(let i = 0; i < note.comments.length; i++) {
		const comment = note.comments[i];

		comment.displayName = users.find(user => user.name === comment.username).displayName;
	}

	const commentVotes = (await db.get('commentVotes')).filter(commentVote => commentVote.noteId === req.params.noteid);

	const backslash = /\\(?![*_$~`])/g;

	res.render('note', {
		note,
		content: DOMPurify.sanitize(marked.parse(note.content.replace(backslash, "\\\\")), purifyOptions),
		user,
		commentVotes
	});
});

app.get('/create', async (req, res) => {
	if(!res.locals.$isLoggedIn) res.redirect('back');

	res.render('create', {
		note: '{}',
		mode: 'create'
	})
});

app.get('/create/:noteid', async (req, res) => {
	if(!res.locals.$isLoggedIn) res.redirect('back');

	const users = await db.get('users');
	const note = users.map(user => user.notes).flat(1).find(note => note.id === req.params.noteid);

	if(!note) res.redirect('back');

	res.render('create', {
		note: JSON.stringify(note),
		mode: 'edit'
	});
});

app.get(['/user/:username', '/user/:username/:page'], async (req, res) => {
	const users = await db.get('users');
	const user = EN.Account.prototype.getShareable.call(
		users.find(user => req.params.username === user.name)
		|| new EN.Account({
				displayName: `User ${req.params.username} is not available`,
				name: 'sys',
				password: '',
				about: `<center>No user named @${req.params.username}!<br><img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWY1Y3I4amNncWY4anR4b3N5MGZncDMwZ2Q1Z2gxNjRseHE2MzMxZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/YyKPbc5OOTSQE/giphy.gif" /></center>`
			})
	);

	const backslash = /\\(?![*_$~`])/g;

	const page = req.params.page || 'about';

	res.render('dashboard', {
		user, about: DOMPurify.sanitize(marked.parse(user.about.replace(backslash, "\\\\")), purifyOptions), page
	});
});

app.get('/:reduce/note/:noteid', async (req, res) => {
	const users = await db.get('users');
	const user = users.find(user => user.notes.find(note => note.id === req.params.noteid));
	const note = user.notes.find(note => note.id === req.params.noteid);

	const backslash = /\\(?![*_$~`])/g;

	let contentInput = DOMPurify.sanitize(marked.parse(note.content.replace(backslash, "\\\\")), purifyOptions);

	if(req.params.reduce === 'min') {
		res.render('min/note', {
			content: contentInput,
			note,
			authorDisplayName: user.displayName
		});
	} else if(req.params.reduce === 'simple') {
		mjpage(contentInput, {
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
		}, { svg: true }, output => {
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
		users.push(new EN.Account({ name, password }));
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
		const user = users.find(user => user.name === name);
		if(user?.password === cookiePassword) callback(user?.password);
	});

	socket.on('set--user-information', async (name, { displayName, about, password }) => {
		const users = await db.get('users');
		const user = users.find(user => user.name === name);

		if(displayName === '') user.displayName = name;
		else if(displayName !== undefined) user.displayName = displayName;
		if(about !== undefined) user.about = about;
		if(password) user.password = password;

		await db.set('users', users);
	});

	socket.on('set--note', async (name, title, content, unlisted, thumbnailURL, keywords, callback) => {
		const users = await db.get('users');
		const user = users.find(user => user.name === name);
		const noteIDs = users.map(user => user.notes).flat(1).map(note => note.id);

		let id = crypto.randomUUID();
		while(noteIDs.includes(id)) {
			id = crypto.randomUUID();
		}

		const note = new EN.Note({
			title, content, id, keywords, authorName: name, unlisted, thumbnailURL
		});

		user.notes.push(note);

		await db.set('users', users);

		callback(id);
	});

	socket.on('edit--note', async (name, title, content, unlisted, thumbnailURL, keywords, id, callback) => {
		const users = await db.get('users');
		const user = users.find(user => user.name === name);
		const note = user.notes.find(note => note.id === id);

		note.title = parseString(title);
		note.content = content;
		note.unlisted = unlisted;
		note.thumbnailURL = thumbnailURL
		note.keywords = keywords;
		note.lastEdited = new Date().getTime();

		await db.set('users', users);

		callback(id);
	});

	socket.on('delete--note', async (name, password, noteId, callback) => {
		const users = await db.get('users');
		const user = users.find(user => user.name === name);
		if(!user) return;
		if(user.name !== name || user.password !== password) return;

		const note = user.notes.find(note => note.id === noteId);
		if(!note) return;

		const noteIndex = user.notes.indexOf(note);
		user.notes.splice(noteIndex, 1);

		await db.set('users', users);

		callback();
	});

	// COMMENTS
	socket.on('connect-to-note', noteId => {
		socket.join(`note/${noteId}`)
	});

	socket.on('set--comment', async (noteId, noteAuthorName, commenterUsername, content, parentId, callback) => {
		const users = await db.get('users');
		const author = users.find(user => user.name === noteAuthorName);
		const commenter = users.find(user => user.name === commenterUsername);
		const note = author.notes.find(note => note.id === noteId);
		const comment = new EN.Comment({ username: commenterUsername, content, id: crypto.randomUUID(), parentId });

		note.comments.push(comment);

		await db.set('users', users);

		comment.displayName = commenter.displayName;
		io.to(`note/${noteId}`).emit('send--comment-added', comment);
		callback();
	});

	socket.on('delete--comment', async (noteId, commentId, callback) => {
		const users = await db.get('users');
		const user = users.find(user => {
			if(user.notes.find(note => note.id === noteId)) return true;
		});
		const note = user.notes.find(note => note.id === noteId);
		const comment = note.comments.find(comment => comment.id === commentId);

		note.comments.splice(
			note.comments.indexOf(comment),
			1
		);

		const commentVotes = await db.get('commentVotes');
		const filteredCommentVotes = commentVotes.filter(commentVote => commentVote.commentId === commentId);

		for(let i = 0; i < filteredCommentVotes.length; i++) {
			const commentVote = filteredCommentVotes[i];
			const commentVoteIndex = commentVotes.indexOf(commentVote);

			commentVotes.splice(commentVoteIndex, 1)
		}

		let parents = [ commentId ];
		note.comments.reverse();

		for(let i = note.comments.length - 1; i >= 0; i--) {
			const comment = note.comments[i];

			if(comment.parentId === null) continue;
			if(parents.includes(comment.parentId)) {
				note.comments.splice(
					note.comments.indexOf(comment),
					1
				);

				parents.push(comment.id);

				const filteredCommentVotes = commentVotes.filter(commentVote => commentVote.commentId === comment.id);

				for(let i = 0; i < filteredCommentVotes.length; i++) {
					const commentVote = filteredCommentVotes[i];
					const commentVoteIndex = commentVotes.indexOf(commentVote);

					commentVotes.splice(commentVoteIndex, 1)
				}
			}
		}

		note.comments.reverse();

		callback(commentId);
		io.to(`note/${noteId}`).emit('send--comment-deleted', commentId);

		await db.set('users', users);
		await db.set('commentVotes', commentVotes);
	});

	socket.on('set--comment-vote', async (noteId, commentId, voterUsername, vote, callback = () => {}) => {
		/*
		 * vote: [-1, 1]
		 * voterUsername: username of the voter
		 */
		if(vote <= -1) vote = -1;
		else if(vote >= 1) vote = 1;
		else return;

		const commentVotes = await db.get('commentVotes');
		const commentVote = commentVotes.find(
													commentVote => commentVote.noteId === noteId
																			&& commentVote.commentId === commentId
																			&& commentVote.voterUsername === voterUsername)

		if(commentVote?.vote === vote) {
			// delete the vote
			const commentVoteIndex = commentVotes.indexOf(commentVote);

			commentVotes.splice(commentVoteIndex, 1);
		}
		else if(commentVote) commentVote.vote = vote;
		else commentVotes.push({ noteId, commentId, voterUsername, vote });

		const currentCount = commentVotes.filter(commentVote => commentVote.noteId === noteId && commentVote.commentId === commentId).map(commentVote => commentVote.vote).sum();

		callback(currentCount);

		await db.set('commentVotes', commentVotes);

		io.to(`note/${noteId}`).emit('send--comment-voted', commentId, currentCount);
	});
	// --------

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

function parseString(string) {
	return string?.replace(/"/g, '$doublequote').replace(/\\/g, '$backslash');
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