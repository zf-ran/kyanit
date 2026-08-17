/**
 * @param {number[]} numberArray
 * @returns {number}
 */
function average(numberArray) {
	if(numberArray.length === 0) {
		return 0;
	}

	const sumNumber = sum(numberArray);

	return sumNumber / numberArray.length;
}

/**
 * @param {number[]} numberArray
 * @returns {number}
 */
function sum(numberArray) {
	return numberArray.reduce((prev, cur) => prev + cur, 0);
}

/**
 * @param {string} text
 * @returns {string}
 */
function slug(text) {
	return text.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9\-]/g, '');
}

module.exports = { average, sum, slug };