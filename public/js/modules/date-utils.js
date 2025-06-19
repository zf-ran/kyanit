/**
 * @param {number} date - The date (in milliseconds) to format
 * @type {string} - The formatted date
 */
export function absoluteTime(date) {
	const formatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: false, year: 'numeric', month: 'numeric', day: 'numeric' });
	return formatter.format(date);
}

/**
 * @param {number} date - The date (in milliseconds) to format
 * @type {string} - The formatted date
 */
export function relativeTime(date) {
	const now = new Date().getTime();

	let option = { style: 'long', numeric: 'always' };
	let args = [];
	let timeDifference = date - now;

	if(Math.abs(timeDifference) > 3.154e+10)
		args = [Math.floor(timeDifference / 3.154e+9)/10, 'year'];
	else if(Math.abs(timeDifference) > 2.628e+9)
		args = [Math.floor(timeDifference / 2.628e+9), 'month'];
	else if(Math.abs(timeDifference) > 8.64e+7)
		args = [Math.floor(timeDifference / 8.64e+7), 'day'];
	else if(Math.abs(timeDifference) > 3.6e+6)
		args = [Math.floor(timeDifference / 3.6e+6), 'hour'];
	else if(Math.abs(timeDifference) > 6e+4)
		args = [Math.floor(timeDifference / 6e+4), 'minute'];
	else args = [Math.floor(timeDifference / 100)/10, 'second'];

	return new Intl.RelativeTimeFormat('en-us', option).format(...args);
};