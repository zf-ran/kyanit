const { Note } = require('./classes/Note.js');
const { Comment, CommentVote } = require('./classes/Comment.js');
const { User } = require('./classes/User.js');

const { JSONResponse, JSONErrorResponse } = require('./classes/JSONResponse.js');

function isUUID(string) {
	return typeof string === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(string);
}

module.exports = { Note, Comment, CommentVote, User, JSONResponse, JSONErrorResponse, isUUID };