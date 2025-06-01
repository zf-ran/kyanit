class Comment {
  constructor({
    username,
    content,
    parentId,
    id
  }) {
    this.username = username;
    this.content = content;
    this.id = id;
    this.parentId = parentId;
    this.time = new Date().getTime();
  }
}

class Note {
	constructor({
		title,
		content,
		id,
		keywords,
		authorName,
		thumbnailURL,
		unlisted
	}) {
		this.title = title;
		this.content = content;
		this.id = id;
		this.keywords = keywords || [];
		this.authorName = authorName;
		this.thumbnailURL = thumbnailURL;
		
		this.published = new Date().getTime();
    this.lastEdited = null;
		this.unlisted = unlisted ?? false;
		this.views = 0;
    this.comments = [];
	}

	setTitle(title) {
		this.title = title;
	}

	setContent(content) {
		this.content = content;
	}

	setKeywords(keywords) {
		this.keywords = keywords;
	}

	setUnlisted(unlisted = false) {
		this.unlisted = unlisted;
	}
  
  setComment(username, content) {
    this.comments.push(new Comment({ username, content }));
  }
}

module.exports = { Note, Comment };