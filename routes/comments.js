const express = require('express');
const router = express.Router();

const crypto = require('crypto');

const Kyanit = require('../modules/Kyanit')
const { JSONErrorResponse, JSONResponse } = Kyanit;

const db = require('../modules/database');

//* [ROUTE] /api

router.get('/notes/:noteId/comments', async (req, res) => {
	const { noteId } = req.params;

	/** @type {Kyanit.Note[]} */
	const notes = await db.get('notes');
	const note = notes.find(note => note.id === noteId);

	if(!note) {
		res.status(404).json(new JSONErrorResponse(404, 'Note not found'));
		return;
	}

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
		comment.votes = commentVotes.map(vote => { delete vote.commentId; delete vote.noteId; return vote; });

		// Add property `displayName` for commenter’s display name.
		comment.displayName = users.find(user => user.name === comment.username).displayName;
	}

	res.json(new JSONResponse(noteComments));
});

router.post('/notes/:noteId/comments', async (req, res) => {
	if(!req.body) {
		res.status(400).json(new JSONErrorResponse(400, 'No body sent'));
		return;
	}

	if(!res.locals.$isLoggedIn) {
		res.status(401).json(new JSONErrorResponse(401, 'No login credentials'));
		return;
	}

	const { noteId } = req.params;

	const { content, parentId } = req.body;
	const commenterName = req.cookies.username;

	if(!content) {
		res.status(400).json(new JSONErrorResponse(400, 'Missing required fields `content`'));
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

	if(parentId) {
		const parentComment = comments.find(comment => comment.id === parentId);

		// Check if parent comment exists.
		if(!parentComment) {
			res.status(404).json(new JSONErrorResponse(404, 'Parent comment not found'));
			return;
		}
	}

	const commentIDs = comments.map(comment => comment.id);

	let id = crypto.randomUUID();

	// Loops until a unique UUID is found.
	while(commentIDs.includes(id)) {
		id = crypto.randomUUID();
	}

	const comment = new Kyanit.Comment(id, noteId, commenterName, DOMPurify.sanitize(content), parentId);

	comments.push(comment);

	await db.set('comments', comments);

	/** @type {Kyanit.User[]} */
	const users = await db.get('users');
	const commenter = users.find(user => user.name === commenterName);

	comment.displayName = commenter.displayName;
	comment.voteCount = 0;
	comment.votes = [];

	req.io.to(`note:${noteId}`).emit('comment:created', comment);

	res.sendStatus(204);
});

router.delete('/notes/:noteId/comments/:commentId', async (req, res) => {
	if(!res.locals.$isLoggedIn) {
		res.status(401).json(new JSONErrorResponse(401, 'No login credentials'));
		return;
	}

	const { noteId, commentId } = req.params;

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

	if(req.cookies.username !== comment.username) {
		res.status(403).json(new JSONErrorResponse(403, 'Trying to delete other user’s comment'));
		return;
	}

	/** @type {Kyanit.User[]} */
	const users = await db.get('users');
	const commenter = users.find(user => user.name === comment.username);

	if(req.cookies.password !== commenter.password) {
		res.status(401).json(new JSONErrorResponse(401, 'Invalid login credentials'));
		return;
	}

	// Deletes the comment.
	comments.splice(comments.indexOf(comment), 1);

	// Delete the comment’s votes.
	let commentVotes = await db.get('commentVotes');
	commentVotes = commentVotes.filter(commentVote => commentVote.commentId !== commentId);

	// Delete the comment’s children.
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

	req.io.to(`note:${noteId}`).emit('comment:deleted', commentId);

	res.sendStatus(204);
});

module.exports = router;