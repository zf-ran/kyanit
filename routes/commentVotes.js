const express = require('express');
const router = express.Router();

const crypto = require('crypto');

const Kyanit = require('../modules/Kyanit')
const { JSONErrorResponse, JSONResponse } = Kyanit;

const db = require('../modules/database');

//* [ROUTE] /api

router.post('/notes/:noteId/comments/:commentId/votes', async (req, res) => {
	if(!req.body) {
		res.status(400).json(new JSONErrorResponse(400, 'No body sent'));
		return;
	}

	if(!res.locals.$isLoggedIn) {
		res.status(400).json(new JSONErrorResponse(401, 'No login credentials'));
		return;
	}

	const { noteId, commentId } = req.params;
	const { value } = req.body;

	if(!value) {
		res.status(400).json(new JSONErrorResponse(400, 'Note value given'));
		return;
	}

	const validValues = [1, -1];
	if(!validValues.includes(value)) {
		res.status(400).json(new JSONErrorResponse(400, 'Invalid value given'));
		return;
	}

	/** @type {Kyanit.Note[]} */
	const notes = await db.get('notes');
	const note = notes.find(note => note.id === noteId);

	if(!note) {
		res.status(404).json(new JSONErrorResponse(404, 'Note not found'));
		return;
	}

	/** @type {Kyanit.Comment[]} */
	const comments = await db.get('comments');
	const comment = comments.find(comment => comment.id === commentId);
	
	if(!comment) {
		res.status(404).json(new JSONErrorResponse(404, 'Comment not found'));
		return;
	}

	/** @type {Kyanit.CommentVote[]} */
	const commentVotes = await db.get('commentVotes');
	const existingVote = commentVotes.find(vote => {
		return (
			vote.noteId === noteId &&
			vote.commentId === commentId &&
			vote.voterName === req.cookies.username
		);
	});

	if(!existingVote) {
		// A new vote.
		const commentVote = new Kyanit.CommentVote(noteId, commentId, req.cookies.username, value);
		commentVotes.push(commentVote);
		res.sendStatus(201);
	} else if(existingVote.value === value) {
		// Cancel vote.
		const commentVoteIndex = commentVotes.indexOf(existingVote);
		commentVotes.splice(commentVoteIndex, 1);
		res.sendStatus(204);
	} else {
		// Change vote.
		existingVote.value = value;
	}

	const currentCount = commentVotes
		.filter(commentVote => commentVote.commentId === commentId) // Filter the votes to comment ID.
		.map(commentVote => commentVote.value) // Map it to the vote value. [{...}, {...}, ...] -> [-1, 1, ...]
		.sum();

	await db.set('commentVotes', commentVotes);

	req.io.to(`note:${noteId}`).emit('comment:voted', commentId, currentCount);
});

module.exports = router;