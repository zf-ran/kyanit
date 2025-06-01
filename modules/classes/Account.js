class Account {
	constructor({
		name,
		displayName,
		password,
		about,
		verified
	}) {
		// Account.name must be unique
		this.name = name;

		// Account.displayName can be same
		this.displayName = displayName ?? this.name;
		this.password = password;
		this.notes = [];
		this.registered = new Date().getTime();
		this.about = about ?? '';
		this.verified = verified ?? false;
	}

	setDisplayName(displayName) {
		this.displayName = displayName;
		return this;
	}

	setPassword(password) {
		this.password = password;
		return this;
	}

	getShareable() {
		return { name: this?.name, displayName: this?.displayName, notes: this?.notes, about: this?.about, registered: this?.registered, verified: this?.verified };
	}

	addNote(note) {
		this.notes.push(note);
		return this;
	}

	removeNote(noteId) {
		const note = this.notes.find(note => note.id === noteId);
		if(!note) return;
		const noteIndex = this.notes.indexOf(note);
		this.notes.splice(noteIndex, 1);
		return this;
	}

	setAbout(about) {
		this.about = about;
		return this;
	}
}

module.exports = { Account };