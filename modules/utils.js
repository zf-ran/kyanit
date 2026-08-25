/**
 * @param {number[]} numberArray
 * @returns {number}
 */
function average(numberArray) {
	if (numberArray.length === 0) {
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

const TIME_UNITS = [
	{ unit: 'year',   ms: 31_536_000_000 },
	{ unit: 'month',  ms: 2_628_000_000 },
	{ unit: 'day',    ms: 86_400_000 },
	{ unit: 'hour',   ms: 3_600_000 },
	{ unit: 'minute', ms: 60_000 },
	{ unit: 'second', ms: 1_000 },
];

/**
 * Formats a date relative to the current time.
 * @param {Date | number | string} date
 * @param {string} [locale='en-US']
 * @param {Intl.RelativeTimeFormatOptions} [options]
 * @returns {string}
 */
function relativeTimeFormatter(
	date,
	locale = 'en-US',
	options = {}
) {
	const config = { style: 'short', numeric: 'always', ...options };
	const timeDifferenceMs = new Date(date).getTime() - Date.now();

	for (const { unit, ms } of TIME_UNITS) {
		if (Math.abs(timeDifferenceMs) > ms) {
			return new Intl.RelativeTimeFormat(locale, config).format(
				Math.round(timeDifferenceMs / ms),
				unit
			);
		}
	}
}

/**
 * @param {string} uuid
 * @returns {boolean}
 */
function isUUID(uuid) {
	return typeof uuid === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

module.exports = {
	average,
	sum,
	slug,
	relativeTimeFormatter,
	isUUID,
};