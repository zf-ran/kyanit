const express = require('express');
const router = express.Router();

const marked = require('marked');

const DOMPurify = require('isomorphic-dompurify');

const { mjpage } = require('mathjax-node-page');

const { mathjaxOptions, purifyOptions } = require('../config');
const { isUUID } = require('../modules/Kyanit');

//* [ROUTE] /min

router.get('/note/:noteId', async (req, res) => {
	const noteId = req.params.noteId;

	if(!isUUID(noteId)) {
		return res.status(400).send(`Invalid UUID: <code>${noteId}</code>.`);
	}

	const notes = await req.sql`
		select
			n.title,
			n.content,
			n.author_name,
			u.display_name as author_display_name
		from notes n
		join users u
			on n.author_name = u.name
		where id = ${noteId};
	`;

	const note = notes[0];

	if(!note) {
		return res.status(404).send(`Note with id <code>${noteId}</code> not found.`);
	}

	const backslash = /\\(?![*_$~`])/g;
	const htmlContent = DOMPurify.sanitize(marked.parse(note.content.replace(backslash, "\\\\")), purifyOptions);

	delete note.content;

	if('mathjax' in req.query) {
		// Uses MathJax (svg).
		mjpage(htmlContent, mathjaxOptions, { svg: true }, output => {
			res.render('min/note', { content: output, note });
		});
	} else {
		// Bare bones, no MathJax.
		res.render('min/note', { content: htmlContent, note });
	}
});

module.exports = router;