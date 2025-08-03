class User {
	/**
	 * @param {string} name - A unique username
	 * @param {string} password
	 */
	constructor(name, password) {
		this.name = name;
		this.password = password;

		/** @type {string} */
		this.displayName = this.name;

		/** @type {number} - User’s registration time in milliseconds format */
		this.registered = new Date().getTime();

		/** @type {string} - User’s introduction to themselves */
		this.about = '';

		/** @type {boolean} */
		this.verified = false;
	}

	getPublicInfo() {
		const user = {
			name: this.name,
			displayName: this.displayName,
			notes: this.notes,
			about: this.about,
			registered: this.registered,
			verified: this.verified
		};

		return user;
	}
}

module.exports = { User };