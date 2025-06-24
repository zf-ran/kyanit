const express = require('express');
const router = express.Router();

const Kyanit = require('../modules/Kyanit')
const { JSONErrorResponse, JSONResponse, isUUID } = Kyanit;

const MAX_NOTE_LENGTH = 100_000;

//* [ROUTE] /api

router.post('/notes', async (req, res) => {
	if(!req.body) {
		res.status(400).json(new JSONErrorResponse(400, 'No body sent'));
		return;
	}

	if(!res.locals.isLoggedIn) {
		res.status(401).json(new JSONErrorResponse(401, 'No login credentials'));
		return;
	}

	const authorName = res.locals.username;
	const { title, content, keywords, thumbnailURL, unlisted } = req.body;

	if(!title) {
		res.status(400).json(new JSONErrorResponse(400, 'Field `title` is missing'));
		return;
	}

	if(typeof title !== 'string') {
		res.status(400).json(new JSONErrorResponse(400, 'Field `title` must be a string'));
		return;
	}

	if(!content) {
		res.status(400).json(new JSONErrorResponse(400, 'Field `content` is missing'));
		return;
	}

	if(typeof content !== 'string') {
		res.status(400).json(new JSONErrorResponse(400, 'Field `content` must be a string'));
		return;
	}

	if(content.length > MAX_NOTE_LENGTH) {
		res.status(400).json(new JSONErrorResponse(400, `Content is too long, maximum length is ${MAX_NOTE_LENGTH} characters`));
		return;
	}

	if(!Array.isArray(keywords)) {
		res.status(400).json(new JSONErrorResponse(400, 'Field `keywords` must be an array'));
		return;
	}

	if(thumbnailURL && !URL.canParse(thumbnailURL)) {
		res.status(400).json(new JSONErrorResponse(400, 'Field `thumbnailURL` must be a valid URL'));
		return;
	}

	if(typeof unlisted !== 'boolean') {
		res.status(400).json(new JSONErrorResponse(400, 'Field `unlisted` must be a boolean'));
		return;
	}

	const noteId = (await req.sql`
		INSERT INTO notes (author_name, title, content, keywords, thumbnail_url, unlisted)
		VALUES (${authorName}, ${title}, ${content}, ${keywords}, ${thumbnailURL}, ${unlisted})
		RETURNING id
	`)[0].id;

	res.status(201).json(new JSONResponse({ id: noteId }));
});

// TODO
router.patch('/notes/:noteId', async (req, res) => {
	if(!req.body) {
		res.status(400).json(new JSONErrorResponse(400, 'No body sent'));
		return;
	}

	if(!res.locals.isLoggedIn) {
		res.status(401).json(new JSONErrorResponse(401, 'No login credentials'));
		return;
	}

	const { noteId } = req.params;

	if(!isUUID(noteId)) {
		res.status(400).json(new JSONErrorResponse(400, 'Invalid note UUID'));
		return;
	}

	const notes = await req.sql`
		SELECT title, content, keywords, thumbnail_url, unlisted
		FROM notes
		WHERE id = ${noteId} AND author_name = ${res.locals.username}
	`;

	const note = notes[0];

	if(!note) {
		res.status(404).json(new JSONErrorResponse(404, 'Note not found'));
		return;
	}

	const { title, content, keywords, thumbnailURL, unlisted } = req.body;

	if(title && typeof title === 'string') note.title = title;
	if(content && typeof content === 'string' && content.length <= MAX_NOTE_LENGTH) note.content = content;
	if(keywords && typeof keywords === 'array') note.keywords = keywords;
	if(thumbnailURL !== undefined && URL.canParse(thumbnailURL)) note.thumbnailURL = thumbnailURL;
	if(unlisted !== undefined && typeof unlisted === 'boolean') note.unlisted = unlisted;

	await req.sql`
		UPDATE notes
		SET
			title = ${note.title},
			content = ${note.content},
			keywords = ${note.keywords},
			thumbnail_url = ${note.thumbnailURL},
			unlisted = ${note.unlisted},
			updated_at = NOW()
		WHERE id = ${noteId} AND author_name = ${res.locals.username}
	`;

	res.status(200).json(new JSONResponse({ id: noteId }));
});

router.delete('/notes/:noteId', async (req, res) => {
	if(!res.locals.isLoggedIn) {
		res.status(401).json(new JSONErrorResponse(401, 'No login credentials'));
		return;
	}

	const { noteId } = req.params;

	if(!noteId) {
		res.status(400).json(new JSONErrorResponse(400, 'No note ID given'));
		return;
	}

	if(!isUUID(noteId)) {
		res.status(400).json(new JSONErrorResponse(400, 'Invalid note UUID'));
		return;
	}

	await req.sql`
		DELETE FROM notes
		WHERE id = ${noteId} AND author_name = ${res.locals.username}
	`;

	res.sendStatus(204);
});

router.post('/notes/:noteId/views', async (req, res) => {
	const { noteId } = req.params;

	if(!isUUID(noteId)) {
		res.status(400).json(new JSONErrorResponse(400, 'Invalid note UUID'));
		return;
	}

	const notes = await req.sql`select author_name from notes where id = ${noteId};`;
	if(notes.length === 0) return;

	const note = notes[0];
	if(note.author_name === res.locals.username) return;

	await req.sql`
		UPDATE notes
		SET views = views + 1
		WHERE id = ${noteId}
	`;

	res.sendStatus(204);
});

module.exports = router;