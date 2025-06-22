const express = require('express');
const router = express.Router();

const Kyanit = require('../modules/Kyanit')
const { JSONErrorResponse, isUUID } = Kyanit;

//* [ROUTE] /api

router.post('/notes/:noteId/comments/:commentId/votes', async (req, res) => {
	if(!req.body) {
		res.status(400).json(new JSONErrorResponse(400, 'No body sent'));
		return;
	}

	if(!res.locals.isLoggedIn) {
		res.status(400).json(new JSONErrorResponse(401, 'No login credentials'));
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

	const { value } = req.body;

	if(!value) {
		res.status(400).json(new JSONErrorResponse(400, 'Missing required field `value`'));
		return;
	}

	const validValues = [1, -1];
	if(!validValues.includes(value)) {
		res.status(400).json(new JSONErrorResponse(400, 'Invalid value given, expected 1 or -1'));
		return;
	}

	const commentVotes = await req.sql`
		SELECT comment_id, voter_name, value
		FROM comment_votes
		WHERE note_id = ${noteId} AND comment_id = ${commentId};
	`;

	let existingVote = commentVotes.find(vote => vote.voter_name === res.locals.username);

	if(!existingVote) {
		// A new vote.
		await req.sql`
			INSERT INTO comment_votes (note_id, comment_id, voter_name, value)
			VALUES (${noteId}, ${commentId}, ${res.locals.username}, ${value})
		`;

		commentVotes.push({
			comment_id: commentId,
			voter_name: res.locals.username,
			value: value
		});

		res.sendStatus(201);
	} else if(existingVote.value === value) {
		// Cancel vote.
		await req.sql`
			DELETE FROM comment_votes
			WHERE note_id = ${noteId} AND comment_id = ${commentId} AND voter_name = ${res.locals.username}
		`;

		commentVotes.splice(commentVotes.indexOf(existingVote), 1);

		res.sendStatus(204);
	} else {
		// Change vote.
		await req.sql`
			UPDATE comment_votes
			SET value = ${value}
			WHERE note_id = ${noteId} AND comment_id = ${commentId} AND voter_name = ${res.locals.username}
		`;

		existingVote.value = value;

		res.sendStatus(204);
	}

	const currentCount = commentVotes
		.map(commentVote => commentVote.value) // Map it to the vote value. [{...}, {...}, ...] -> [-1, 1, ...]
		.sum();

	req.io.to(`note:${noteId}`).emit('comment:voted', commentId, currentCount);
});

module.exports = router;