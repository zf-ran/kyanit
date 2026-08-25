const express = require('express');
const router = express.Router();

const rateLimit = require('express-rate-limit');

const Kyanit = require('../modules/Kyanit');
const { JSONErrorResponse, JSONResponse } = Kyanit;
const { validateBody, Rule } = require('../modules/body-validator');
const { dataConstraints } = require('../config');
const { isUUID } = require('../modules/utils');

const URL_OR_EMPTY = /(^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*$)|^$)/i;

//* [ROUTE] /api

router.get('/notes', async (req, res) => {
	const notes = await req.sql`
		SELECT
			n.id,
			u.display_name AS "authorDisplayName",
			u.is_verified AS "isAuthorVerified",
			n.title,
			n.keywords,
			n.thumbnail_url AS "thumbnailURL",
			n.views,
			AVG(r.value)::NUMERIC(10,1) AS rating,
			COUNT(r.value) AS "rateCount",
			n.created_at AS "createdAt",
			n.updated_at AS "updatedAt"
		FROM notes n
		JOIN users u
			ON n.author_name = u.name
		LEFT join note_ratings r
			ON n.id = r.note_id
		WHERE n.unlisted = false
		GROUP BY n.id, u.display_name, u.is_verified
		ORDER BY n.views DESC;
	`;

	res.json(new JSONResponse(notes));
});

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
		const { username, isLoggedIn } = res.locals;

		if (!isLoggedIn) {
			return res.status(401).json(new JSONErrorResponse('No login credentials'));
		}

		const noteId = req.params.noteId;

		if (!isUUID(noteId)) {
			return res.status(400).json(new JSONErrorResponse('Invalid note UUID'));
		}

		const notes = await req.sql`
			SELECT
				title,
				content,
				keywords,
				thumbnail_url AS "thumbnailURL",
				unlisted
			FROM notes
			WHERE id = ${noteId};
		`;

		const note = notes[0];

		if (!note) {
			return res.status(404).json(new JSONErrorResponse('Note not found'));
		}

		const permission = await Kyanit.NoteCollaborator
			.getNoteCollaborators.permission(noteId, username);

		if (!permission || !permission.canPublish) {
			return res.status(403).json(new JSONErrorResponse('No permission to edit'));
		}

		const { title, content, keywords, thumbnailURL, unlisted } = req.body;

		if (title && permission.canChangeTitle) note.title = title;
		if (content) note.content = content;
		if (keywords && permission.canChangeKeywords) note.keywords = keywords;

		// Undefined or null means not changed, empty string means literal empty string.
		if (typeof thumbnailURL === 'string' && permission.canChangeThumbnail)
			note.thumbnailURL = thumbnailURL;

		// Undefined and null are falsy, so is false, can't check with just `if (unlisted)`.
		if (typeof unlisted === 'boolean' && permission.canChangeVisibility)
			note.unlisted = unlisted;

		await req.sql`
			UPDATE notes
			SET
				title = ${note.title},
				content = ${note.content},
				keywords = ${note.keywords},
				thumbnail_url = ${note.thumbnailURL},
				unlisted = ${note.unlisted},
				updated_at = NOW()
			WHERE id = ${noteId};
		`;

		res.json(new JSONResponse({ id: noteId }));
	}
);

router.delete('/notes/:noteId', async (req, res) => {
	const { username, isLoggedIn } = res.locals;
	if (!isLoggedIn) {
		return res.status(401).json(new JSONErrorResponse('No login credentials'));
	}

	const { noteId } = req.params;

	if (!isUUID(noteId)) {
		return res.status(400).json(new JSONErrorResponse('Invalid note UUID'));
	}

	const permission = await Kyanit.NoteCollaborator
		.getNoteCollaborators.permission(noteId, username);

	if (!permission.canDelete) {
		return res.status(403).json(new JSONErrorResponse('No permission to delete'));
	}

	await req.sql`
		DELETE FROM notes
		WHERE id = ${noteId};
	`;

	res.sendStatus(204);
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

	if (!isUUID(noteId))
		return res.status(400).json(new JSONErrorResponse('Invalid note UUID'));

	if (req.headers['x-note-id'] !== noteId)
		return res.status(400).json(new JSONErrorResponse('X-Note-ID header not found'));

	const [note] = await req.sql`
		SELECT author_name AS "authorName"
		FROM notes
		WHERE id = ${noteId};
	`;

	if (!note)
		return res.status(404).json(new JSONErrorResponse('Note not found'));

	if (res.locals.isLoggedIn) {
		const permission = await Kyanit.NoteCollaborator
			.getNoteCollaborators.permission(noteId, res.locals.username);

		if (permission)
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