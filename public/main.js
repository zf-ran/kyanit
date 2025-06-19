function $(querySelector = '') { return document.querySelector(querySelector); }
function $$(querySelector = '') { return document.querySelectorAll(querySelector); }

function parseCookie(cookieString) {
	return (
		cookieString.split(/; */g).reduce((prev, current) => {
			const [name, ...value] = current.split('=')
			prev[name] = value.join('=')
			return prev
		}, {})
	)
}

function relativeTime(date) {
	const now = new Date().getTime();
	let option = { style: 'long', numeric: 'always' };
	let args = [];
	let timeDifference = date - now;

	if(Math.abs(timeDifference) > 3.154e+10)
		args = [Math.floor(timeDifference / 3.154e+10), 'year'];

	else if(Math.abs(timeDifference) > 2.628e+9)
		args = [Math.floor(timeDifference / 2.628e+9), 'month'];

	else if(Math.abs(timeDifference) > 8.64e+7)
		args = [Math.floor(timeDifference / 8.64e+7), 'day'];

	else if(Math.abs(timeDifference) > 3.6e+6)
		args = [Math.floor(timeDifference / 3.6e+6), 'hour'];

	else if(Math.abs(timeDifference) > 6e+4)
		args = [Math.floor(timeDifference / 6e+4), 'minute'];

	else if(Math.abs(timeDifference) > 1000)
		args = [Math.floor(timeDifference / 1000), 'second'];

	else args = [timeDifference, 'millisecond'];

	return new Intl.RelativeTimeFormat('en-us', option).format(...args);
}

Array.prototype.sum = function() {
	let sum = 0;
	
	for(let i = 0; i < this.length; i++) {
		if(isNaN(this[i])) throw TypeError(`Element at index ${i} (${this[i]}) is not a number (NaN)`);
		sum += this[i];
	}

	return sum;
};