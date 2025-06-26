class JSONResponse {
	/**
	 * @param {object} data
	 */
	constructor(data = {}) {
		this.data = data;
	}
}

class JSONErrorResponse {
	/**
	 * @param {string} error - Error message
	 */
	constructor(error) {
		this.error = error;
	}
}

module.exports = { JSONResponse, JSONErrorResponse };