const express = require('express');
const router = express.Router();

const Kyanit = require('../modules/Kyanit')
const { JSONErrorResponse, JSONResponse, isUUID } = Kyanit;

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

const MAX_COMMENT_LENGTH = 500;

//* [ROUTE] /api

router.get('/notes/:noteId/comments', async (req, res) => {
	const { noteId } = req.params;

	if(!isUUID(noteId)) {
		res.status(400).send(`Invalid UUID: <code>${noteId}</code>`);
		return;
	}

	const notes = await req.sql`select exists(select 1 from notes where id = ${noteId});`;

	if(!notes[0].exists) {
		res.status(404).json(new JSONErrorResponse(404, 'Note not found'));
		return;
	}

	const noteComments = await req.sql`
		SELECT
			c.id,
			c.commenter_name,
			c.parent_comment_id,
			u.display_name as commenter_display_name,
			c.content,
			c.created_at
		FROM comments c
		LEFT JOIN users u ON u.name = c.commenter_name
		WHERE c.note_id = ${noteId};
	`;

	const noteCommentVotes = await req.sql`
		SELECT
			comment_id, voter_name, value
		FROM comment_votes
		WHERE note_id = ${noteId}
	`;

	for(const comment of noteComments) {
		comment.vote_count = noteCommentVotes
			.filter(vote => vote.comment_id === comment.id)
			.map(vote => vote.value)
			.sum();

		comment.votes = noteCommentVotes
			.filter(vote => vote.comment_id === comment.id)
			.map(vote => (
				{
					voter_name: vote.voter_name,
					value: vote.value
				}
			));
	}

	noteComments.sort((a, b) => b.vote_count - a.vote_count);

	res.json(new JSONResponse(noteComments));
});

router.post('/notes/:noteId/comments', async (req, res) => {
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
		res.status(400).send(`Invalid UUID: <code>${noteId}</code>`);
		return;
	}

	const { content, parentId } = req.body;

	if(!content) {
		res.status(400).json(new JSONErrorResponse(400, 'Missing required fields `content`'));
		return;
	}

	if(typeof content !== 'string') {
		res.status(400).json(new JSONErrorResponse(400, 'Invalid type for `content`, expected `string`'));
		return;
	}

	if(content.length > MAX_COMMENT_LENGTH) {
		res.status(400).json(new JSONErrorResponse(400, `Content is too long, maximum length is ${MAX_COMMENT_LENGTH} characters`));
		return;
	}

	if(parentId && !isUUID(parentId)) {
		res.status(400).send(`Invalid parent UUID: <code>${parentId}</code>`);
		return;
	}

	const commenterName = res.locals.username;
	let comments;

	try {
		if(parentId) {
			comments = await req.sql`
				INSERT INTO comments (note_id, parent_comment_id, commenter_name, content)
				VALUES (${noteId}, ${parentId}, ${commenterName}, ${content})
				RETURNING *, (SELECT display_name FROM users WHERE name = ${commenterName}) as commenter_display_name
			`;
		} else {
			comments = await req.sql`
				INSERT INTO comments (note_id, commenter_name, content)
				VALUES (${noteId}, ${commenterName}, ${content})
				RETURNING *, (SELECT display_name FROM users WHERE name = ${commenterName}) as commenter_display_name
			`;
		}
	} catch (error) {
		res.status(400).json(new JSONErrorResponse(400, error));
		return;
	}

	const comment = comments[0];

	comment.vote_count = 0;
	comment.votes = [];

	req.io.to(`note:${noteId}`).emit('comment:created', comment);
	res.sendStatus(204);
});

router.delete('/notes/:noteId/comments/:commentId', async (req, res) => {
	if(!res.locals.isLoggedIn) {
		res.status(401).json(new JSONErrorResponse(401, 'No login credentials'));
		return;
	}

	const { noteId, commentId } = req.params;

	if(!isUUID(noteId)) {
		res.status(400).json(new JSONErrorResponse(400, `Invalid note UUID`));
		return;
	}

	if(!isUUID(commentId)) {
		res.status(400).json(new JSONErrorResponse(400, `Invalid comment UUID`));
		return;
	}

	try {
		await req.sql`
			DELETE FROM comments
			WHERE id = ${commentId} AND note_id = ${noteId} AND commenter_name = ${res.locals.username};
		`;
	} catch(error) {
		res.status(400).json(new JSONErrorResponse(400, error));
		return;
	}

	req.io.to(`note:${noteId}`).emit('comment:deleted', commentId);
	res.sendStatus(204);
});

module.exports = router;