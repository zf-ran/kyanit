const { Note } = require('./classes/Note.js');
const { Comment, CommentVote } = require('./classes/Comment.js');
const { User } = require('./classes/User.js');

const { JSONResponse, JSONErrorResponse } = require('./classes/JSONResponse.js');

module.exports = { Note, Comment, CommentVote, User, JSONResponse, JSONErrorResponse };