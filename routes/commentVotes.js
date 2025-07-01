const express = require('express');
const router = express.Router();

const Kyanit = require('../modules/Kyanit');
const { JSONErrorResponse, JSONResponse, isUUID } = Kyanit;
const { validateBody, Rule } = require('../modules/bodyValidator');

//* [ROUTE] /api

router.post('/notes/:noteId/comments/:commentId/votes',
	validateBody({
		value: new Rule('number')
			.required()
			.only(-1, 1)
	}),
	async (req, res) => {
		if(!res.locals.isLoggedIn) {
			return res.status(400).json(new JSONErrorResponse('No login credentials'));
		}

		const { noteId, commentId } = req.params;

		if(!isUUID(noteId)) {
			return res.status(400).json(new JSONErrorResponse('Invalid note UUID'));
		}

		if(!isUUID(commentId)) {
			return res.status(400).json(new JSONErrorResponse('Invalid comment UUID'));
		}

		const { value } = req.body;

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
		} else if(existingVote.value === value) {
			// Cancel vote.
			await req.sql`
				DELETE FROM comment_votes
				WHERE note_id = ${noteId} AND comment_id = ${commentId} AND voter_name = ${res.locals.username}
			`;

			commentVotes.splice(commentVotes.indexOf(existingVote), 1);
		} else {
			// Change vote.
			await req.sql`
				UPDATE comment_votes
				SET value = ${value}
				WHERE note_id = ${noteId} AND comment_id = ${commentId} AND voter_name = ${res.locals.username}
			`;

			existingVote.value = value;
		}

		const currentCount = commentVotes
			.map(commentVote => commentVote.value) // Map it to the vote value. [{...}, {...}, ...] -> [-1, 1, ...]
			.sum();

		res.json(new JSONResponse({ commentId, currentCount }));
	}
);

module.exports = router;