const express = require('express');
const router = express.Router();

const Kyanit = require('../modules/Kyanit');
const { JSONErrorResponse, JSONResponse, isUUID } = Kyanit;
const { validateBody, Rule } = require('../modules/bodyValidator');
const { dataConstraints } = require('../config');
const { sum } = require('../modules/utils');

//* [ROUTE] /api

router.get('/notes/:noteId/comments', async (req, res) => {
	const { noteId } = req.params;

	if(!isUUID(noteId)) {
		return res.status(400).json(new JSONErrorResponse('Invalid note UUID'));
	}

	const notes = await req.sql`SELECT EXISTS(SELECT 1 FROM notes WHERE id = ${noteId});`;

	if(!notes[0].exists) {
		return res.status(404).json(new JSONErrorResponse('Note not found'));
	}

	const noteComments = await req.sql`
		SELECT
			c.id,
			c.commenter_name AS "commenterName",
			c.parent_comment_id AS "parentCommentId",
			u.display_name AS "commenterDisplayName",
			c.content,
			c.created_at AS "createdAt"
		FROM comments c
		LEFT JOIN users u
			ON u.name = c.commenter_name
		WHERE c.note_id = ${noteId};
	`;

	const noteCommentVotes = await req.sql`
		SELECT
			comment_id AS "commentId",
			voter_name AS "voterName",
			value
		FROM comment_votes
		WHERE note_id = ${noteId}
	`;

	for(const comment of noteComments) {
		comment.voteCount = sum(
			noteCommentVotes
				.filter(vote => vote.commentId === comment.id)
				.map(vote => vote.value)
		);

		comment.votes = noteCommentVotes
			.filter(vote => vote.commentId === comment.id)
			.map(vote => (
				{
					voterName: vote.voterName,
					value: vote.value
				}
			));
	}

	noteComments.sort((a, b) => b.voteCount - a.voteCount);

	res.json(new JSONResponse(noteComments));
});

router.post('/notes/:noteId/comments',
	validateBody({
		content: new Rule('string')
			.required().notEmpty()
			.maxLength(dataConstraints.MAX_COMMENT_LENGTH),
		parentId: new Rule('uuid')
	}),
	async (req, res) => {
		if(!res.locals.isLoggedIn) {
			return res.status(401).json(new JSONErrorResponse('No login credentials'));
		}

		const { noteId } = req.params;

		if(!isUUID(noteId)) {
			return res.status(400).json(new JSONErrorResponse('Invalid note UUID'));
		}

		const { content, parentId } = req.body;

		const commenterName = res.locals.username;
		let comments;

		try {
			if(parentId) {
				comments = await req.sql`
					INSERT INTO comments (note_id, parent_comment_id, commenter_name, content)
					VALUES (${noteId}, ${parentId}, ${commenterName}, ${content})
					RETURNING
						id,
						note_id AS "noteId",
						parent_comment_id AS "parentCommentId",
						commenter_name AS "commenterName",
						content,
						created_at AS "createdAt",
						(SELECT display_name FROM users WHERE name = ${commenterName}) AS "commenterDisplayName"
				`;
			} else {
				comments = await req.sql`
					INSERT INTO comments (note_id, commenter_name, content)
					VALUES (${noteId}, ${commenterName}, ${content})
					RETURNING
						id,
						note_id AS "noteId",
						parent_comment_id AS "parentCommentId",
						commenter_name AS "commenterName",
						content,
						created_at AS "createdAt",
						(SELECT display_name FROM users WHERE name = ${commenterName}) AS "commenterDisplayName"
				`;
			}
		} catch (error) {
			return res.status(400).json(new JSONErrorResponse(error));
		}

		const comment = comments[0];

		comment.voteCount = 0;
		comment.votes = [];

		res.json(new JSONResponse(comment));
	}
);

router.delete('/notes/:noteId/comments/:commentId', async (req, res) => {
	if(!res.locals.isLoggedIn) {
		return res.status(401).json(new JSONErrorResponse('No login credentials'));
	}

	const { noteId, commentId } = req.params;

	if(!isUUID(noteId)) {
		return res.status(400).json(new JSONErrorResponse('Invalid note UUID'));
	}

	if(!isUUID(commentId)) {
		return res.status(400).json(new JSONErrorResponse('Invalid comment UUID'));
	}

	try {
		await req.sql`
			DELETE FROM comments
			WHERE id = ${commentId} AND note_id = ${noteId} AND commenter_name = ${res.locals.username};
		`;
	} catch(error) {
		return res.status(400).json(new JSONErrorResponse(error));
	}

	res.json(new JSONResponse({ id: commentId }));
});

module.exports = router;