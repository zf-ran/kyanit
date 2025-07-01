const express = require('express');
const router = express.Router();

const rateLimit = require('express-rate-limit');

const Kyanit = require('../modules/Kyanit');
const { JSONErrorResponse, JSONResponse, isUUID } = Kyanit;
const { validateBody, Rule } = require('../modules/bodyValidator');
const { dataConstraints } = require('../config');

const URL_OR_EMPTY = /(^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*$)|^$)/i;

//* [ROUTE] /api

router.post('/notes',
	validateBody({
		title: new Rule('string')
			.required().notEmpty()
			.maxLength(dataConstraints.MAX_NOTE_TITLE_LENGTH),
		content: new Rule('string')
			.required().notEmpty()
			.maxLength(dataConstraints.MAX_NOTE_CONTENT_LENGTH),
		keywords: new Rule('array')
			.required(),
		thumbnailURL: new Rule('string')
			.required()
			.pattern(URL_OR_EMPTY),
		unlisted: new Rule('boolean')
			.required()
	}),
	async (req, res) => {
		if(!res.locals.isLoggedIn) {
			return res.status(401).json(new JSONErrorResponse('No login credentials'));
		}

		const authorName = res.locals.username;
		const { title, content, keywords, thumbnailURL, unlisted } = req.body;

		const noteId = (await req.sql`
			INSERT INTO notes (author_name, title, content, keywords, thumbnail_url, unlisted)
			VALUES (${authorName}, ${title}, ${content}, ${keywords}, ${thumbnailURL}, ${unlisted})
			RETURNING id
		`)[0].id;

		res.status(201).json(new JSONResponse({ id: noteId }));
	}
);

router.post('/test',
	validateBody({
		requiredString: new Rule('string')
			.required(),
		requiredArray: new Rule('array')
	}),
	(req, res) => {
		console.log(req.body.thumbnailURL);
		res.json(req.body);
	}
);

router.patch('/notes/:noteId',
	validateBody({
		title: new Rule('string')
			.notEmpty()
			.maxLength(dataConstraints.MAX_NOTE_TITLE_LENGTH),
		content: new Rule('string')
			.notEmpty()
			.maxLength(dataConstraints.MAX_NOTE_CONTENT_LENGTH),
		keywords: new Rule('array'),
		thumbnailURL: new Rule('string')
			.pattern(URL_OR_EMPTY),
		unlisted: new Rule('boolean')
	}),
	async (req, res) => {
		if(!res.locals.isLoggedIn) {
			return res.status(401).json(new JSONErrorResponse('No login credentials'));
		}

		const { noteId } = req.params;

		if(!isUUID(noteId)) {
			return res.status(400).json(new JSONErrorResponse('Invalid note UUID'));
		}

		const notes = await req.sql`
			SELECT title, content, keywords, thumbnail_url, unlisted
			FROM notes
			WHERE id = ${noteId} AND author_name = ${res.locals.username}
		`;

		const note = notes[0];

		if(!note) {
			return res.status(404).json(new JSONErrorResponse('Note not found'));
		}

		const { title, content, keywords, thumbnailURL, unlisted } = req.body;

		if(title) note.title = title;
		if(content) note.content = content;
		if(keywords) note.keywords = keywords;

		// Undefined or null means not changed, empty string means literal empty string.
		if(typeof thumbnailURL === 'string') note.thumbnail_url = thumbnailURL;

		// Undefined and null are falsy, so is false, can't check with just if(unlisted)...
		if(typeof unlisted === 'boolean') note.unlisted = unlisted;

		await req.sql`
			UPDATE notes
			SET
				title = ${note.title},
				content = ${note.content},
				keywords = ${note.keywords},
				thumbnail_url = ${note.thumbnail_url},
				unlisted = ${note.unlisted},
				updated_at = NOW()
			WHERE id = ${noteId} AND author_name = ${res.locals.username}
		`;

		res.json(new JSONResponse({ id: noteId }));
	}
);

router.delete('/notes/:noteId', async (req, res) => {
	if(!res.locals.isLoggedIn) {
		return res.status(401).json(new JSONErrorResponse('No login credentials'));
	}

	const { noteId } = req.params;

	if(!isUUID(noteId)) {
		return res.status(400).json(new JSONErrorResponse('Invalid note UUID'));
	}

	await req.sql`
		DELETE FROM notes
		WHERE id = ${noteId} AND author_name = ${res.locals.username}
	`;

	res.sendStatus(204);
});

router.get('/test', (req, res) => {
	res.send(req.headers['user-agent']);
	console.log(req.headers['user-agent']);
});

const viewLimiter = rateLimit({
	windowMs: 10 * (60*1000), // 10 minute
	max: 1,
	keyGenerator: (req) => `${req.params.noteId}:${req.ip}`,
	statusCode: 304
});

// This route is rate-limited using Vercel Firewall (1 request per 10 minutes).
router.post('/notes/:noteId/views', async (req, res) => {
	const { noteId } = req.params;

	if(!isUUID(noteId)) {
		return res.status(400).json(new JSONErrorResponse('Invalid note UUID'));
	}

	if(req.headers['x-note-id'] !== noteId) {
		return res.status(400).json(new JSONErrorResponse('X-Note-ID header not found'));
	}

	const notes = await req.sql`select author_name from notes where id = ${noteId};`;
	if(notes.length === 0) {
		return res.status(404).json(new JSONErrorResponse('Note not found'));
	}

	const note = notes[0];
	if(note.author_name === res.locals.username) {
		return res.sendStatus(204);
	}

	await req.sql`
		UPDATE notes
		SET views = views + 1
		WHERE id = ${noteId}
	`;

	res.sendStatus(200);
});

module.exports = router;