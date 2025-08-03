class Comment {
  /**
   * @param {string} id - Comment’s ID
   * @param {string} noteId - The ID of the note that has this comment
   * @param {string} username - Commenter’s username
   * @param {string} content
   * @param {string|null} parentId - Comment’s parent
   */
  constructor(id, noteId, username, content, parentId) {
    this.id = id;
    this.noteId = noteId;
    this.username = username;
    this.content = content;
    this.parentId = parentId;
    this.time = new Date().getTime();
  }
}

class CommentVote {
  /**
   * @param {string} noteId - The ID of the note that has the comment
   * @param {string} commentId - The voted comment’s ID
   * @param {string} voterName
   * @param {-1|1} value - Either upvote (`1`) or downvote (`-1`)
   */
  constructor(noteId, commentId, voterName, value) {
    this.noteId = noteId;
    this.commentId = commentId;
    this.voterName = voterName;
    this.value = value;
  }
}

module.exports = { Comment, CommentVote };