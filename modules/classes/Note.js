class Note {
	/**
	 * @param {string} id - Unique UUID
	 * @param {string} title
	 * @param {string} content
	 * @param {string[]} keywords
	 * @param {string} authorName
	 * @param {string | null} thumbnailURL - Thumbnail’s URL
	 * @param {boolean} unlisted - Is this note won’t be seen by other users?
	 */
	constructor(id, title, content, keywords, authorName, thumbnailURL, unlisted) {
		this.id = id;
		this.title = title;
		this.content = content;
		this.keywords = keywords;
		this.authorName = authorName;
		this.thumbnailURL = thumbnailURL;
		this.unlisted = unlisted;

		/** @type {number} - Time of publish in milliseconds */
		this.published = new Date().getTime();

		/** @type {number|null} - `null` when the note hasn’t been edited, *edit time in milliseconds* otherwise */
    this.lastEdited = null;

		/** @type {number} */
		this.views = 0;
	}
}

module.exports = { Note };