/**
 * @param {number[]} numberArray
 * @type {number}
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
 * @type {number}
 */
function sum(numberArray) {
	let sum = 0;

	for(let i = 0; i < numberArray.length; i++) {
		sum += numberArray[i];
	}

	return sum;
}

module.exports = { average, sum }