const { Note } = require('./classes/Note');
const { Comment, CommentVote } = require('./classes/Comment');
const { User } = require('./classes/User');

const { JSONResponse, JSONErrorResponse } = require('./classes/JSONResponse');

function isUUID(string) {
	return typeof string === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(string);
}

module.exports = { Note, Comment, CommentVote, User, JSONResponse, JSONErrorResponse, isUUID };