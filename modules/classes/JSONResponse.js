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
	 * @param {number} code - Error code
	 * @param {string} message - Error message
	 */
	constructor(code, message) {
		this.error = { code, message };
	}
}

module.exports = { JSONResponse, JSONErrorResponse };