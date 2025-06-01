const { Note, Comment } = require('./classes/Note.js');
const { Account } = require('./classes/Account.js');

const { parseCookie } = require('./functions/parseCookie.js');
const { encodeUserInformation, decodeUserInformation } = require('./functions/userInformationEncoder.js');

module.exports = { Note, Comment, Account, parseCookie, encodeUserInformation, decodeUserInformation };