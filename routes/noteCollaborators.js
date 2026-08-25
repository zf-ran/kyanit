const express = require('express');
const router = express.Router();

const Kyanit = require('../modules/Kyanit');
const { JSONResponse, JSONErrorResponse } = Kyanit;
const { validateBody, Rule } = require('../modules/body-validator');

//* [ROUTE] /api

router.put('/notes/:noteId/collaborators',
	validateBody({
		collaborators: new Rule('array')
			.required()
			.items(new Rule('object')
				.properties({
					name: new Rule('string').required(),
					canPublish: new Rule('boolean').required(),
					canDelete: new Rule('boolean').required(),
					canChangeTitle: new Rule('boolean').required(),
					canChangeKeywords: new Rule('boolean').required(),
					canChangeThumbnail: new Rule('boolean').required(),
					canChangeVisibility: new Rule('boolean').required(),
				})
			),
	}),
	async (req, res) => {
		if (!res.locals.isLoggedIn)
			return res.status(401).json(new JSONErrorResponse('No login credentials'));

		const username = res.locals.username;
		const noteId = req.params.noteId;

		const [note] = await req.sql`
			SELECT author_name AS "authorName"
			FROM notes
			WHERE id = ${noteId};
		`;

		if (!note)
			return res.status(404).json(new JSONErrorResponse('Note not found'));

		if (note.authorName !== username)
			return res.status(403).json(new JSONErrorResponse('Only author can manage collaborator permission'));

		const { collaborators } = req.body;
		const activeCollaborators = collaborators.map(collaborator => collaborator.name);

		if (activeCollaborators.length === 0) {
			await req.sql`
				DELETE FROM note_collaborators
				WHERE note_id = ${noteId};
			`;

			return res.json(new JSONResponse({ collaborators: [] }));
		}

		await req.sql`
			DELETE FROM note_collaborators
			WHERE note_id = ${noteId}
			AND collaborator_name != ALL(${activeCollaborators});
		`;

		const filteredCollaborators = collaborators.filter(collaborator => collaborator.name !== username);

		const updatedCollaborators = await req.sql`
			WITH payload AS (
				SELECT * FROM jsonb_to_recordset(${JSON.stringify(filteredCollaborators)}::jsonb) AS x(
					"name" TEXT,
					"canPublish" BOOLEAN,
					"canDelete" BOOLEAN,
					"canChangeTitle" BOOLEAN,
					"canChangeKeywords" BOOLEAN,
					"canChangeThumbnail" BOOLEAN,
					"canChangeVisibility" BOOLEAN
				)
			),
			upsert AS (
				INSERT INTO note_collaborators (
					note_id,
					collaborator_name,
					can_publish,
					can_delete,
					can_change_title,
					can_change_keywords,
					can_change_thumbnail,
					can_change_visibility
				)
				SELECT
					${noteId},
					p."name",
					p."canPublish",
					p."canDelete",
					p."canChangeTitle",
					p."canChangeKeywords",
					p."canChangeThumbnail",
					p."canChangeVisibility"
				FROM payload p
				ON CONFLICT (note_id, collaborator_name) DO UPDATE SET
					can_publish = EXCLUDED.can_publish,
					can_delete = EXCLUDED.can_delete,
					can_change_title = EXCLUDED.can_change_title,
					can_change_keywords = EXCLUDED.can_change_keywords,
					can_change_thumbnail = EXCLUDED.can_change_thumbnail,
					can_change_visibility = EXCLUDED.can_change_visibility
			)
			SELECT
				c.collaborator_name     AS "name",
				u.display_name          AS "displayName",
				c.can_publish           AS "canPublish",
				c.can_delete            AS "canDelete",
				c.can_change_title      AS "canChangeTitle",
				c.can_change_keywords   AS "canChangeKeywords",
				c.can_change_thumbnail  AS "canChangeThumbnail",
				c.can_change_visibility AS "canChangeVisibility"
			FROM note_collaborators c
			JOIN users u
				ON c.collaborator_name = u.name
			WHERE c.note_id = ${noteId};
		`;

		return res.json(new JSONResponse({ collaborators: updatedCollaborators }));
	}
);

module.exports = router;