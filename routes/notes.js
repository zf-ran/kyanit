const express = require('express');
const router = express.Router();

const crypto = require('crypto');

const Kyanit = require('../modules/Kyanit')
const { JSONErrorResponse, JSONResponse } = Kyanit;

const db = require('../modules/database');

//* [ROUTE] /api

router.post('/notes', async (req, res) => {
	if(!req.body) {
		res.status(400).json(new JSONErrorResponse(400, 'No body sent'));
		return;
	}

	if(!res.locals.$isLoggedIn) {
		res.status(401).json(new JSONErrorResponse(401, 'No login credentials'));
		return;
	}

	const authorName = req.cookies.username;
	const { title, content, keywords, thumbnailURL, unlisted } = req.body;

	if(!title) {
		res.status(400).json(new JSONErrorResponse(400, 'Field `title` is missing'));
		return;
	}

	if(!content) {
		res.status(400).json(new JSONErrorResponse(400, 'Field `content` is missing'));
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

	/** @type {Kyanit.Note[]} */
	const notes = await db.get('notes');
	const noteIDs = notes.map(note => note.id);

	let id = crypto.randomUUID();

	while(noteIDs.includes(id)) {
		id = crypto.randomUUID();
	}

	const note = new Kyanit.Note(id, title, content, keywords, authorName, thumbnailURL, unlisted);

	notes.push(note);
	await db.set('notes', notes);

	res.status(201).json(new JSONResponse({ id }));
});

// TODO
router.patch('/notes/:noteId', async (req, res) => {
	if(!req.body) {
		res.status(400).json(new JSONErrorResponse(400, 'No body sent'));
		return;
	}

	if(!res.locals.$isLoggedIn) {
		res.status(401).json(new JSONErrorResponse(401, 'No login credentials'));
		return;
	}

	const { noteId } = req.params;

	/** @type {Kyanit.Note[]} */
	const notes = await db.get('notes');
	const note = notes.find(note => note.id === noteId);

	if(!note) {
		res.status(404).json(new JSONErrorResponse(404, 'Note not found'));
		return;
	}

	const { title, content, keywords, thumbnailURL, unlisted } = req.body;

	if(title) note.title = title;
	if(content) note.content = content;
	if(keywords) note.keywords = keywords;
	if(thumbnailURL !== undefined) note.thumbnailURL = thumbnailURL;
	if(unlisted !== undefined) note.unlisted = unlisted;

	await db.set('notes', notes);

	res.status(200).json(new JSONResponse({ id: noteId }));
});

router.delete('/notes/:noteId', async (req, res) => {
	if(!res.locals.$isLoggedIn) {
		res.status(401).json(new JSONErrorResponse(401, 'No login credentials'));
		return;
	}

	const { noteId } = req.params;

	if(!noteId) {
		res.status(400).json(new JSONErrorResponse(400, 'No note ID given'));
		return;
	}

	/** @type {Kyanit.Note[]} */
	const notes = await db.get('notes');
	const note = notes.find(note => note.id === noteId);

	if(!note) {
		res.status(404).json(new JSONErrorResponse(404, 'Note not found'));
		return;
	}

	/** @type {Kyanit.User[]} */
	const users = await db.get('users');
	const user = users.find(user => user.name === note.authorName);

	if(user.name !== req.cookies.username || user.password !== req.cookies.password) {
		res.status(403).json(new JSONErrorResponse(403, 'Trying to delete other user’s note'));
		return;
	}

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

	res.sendStatus(204);
});

module.exports = router;