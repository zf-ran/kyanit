const Note = require('./models/note');
const NoteCollaborator = require('./models/note-collaborator');
const ShortLink = require('./models/short-link');
const User = require('./models/user');

const { JSONResponse, JSONErrorResponse } = require('./classes/JSONResponse');

module.exports = {
	Note,
	NoteCollaborator,
	ShortLink,
	User,
	JSONResponse,
	JSONErrorResponse,
};