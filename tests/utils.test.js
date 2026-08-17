const test = require('node:test');
const assert = require('node:assert/strict');

const { average, sum, slug } = require('../modules/utils');

test('sum', () => {
	assert.equal(sum([1, 2, 3, 4]), 10);
	assert.equal(sum([100, 500, 20, -1]), 619);
	assert.equal(sum([]), 0);
});

test('average', () => {
	assert.equal(average([10, 20, 30, 40, 50]), 30);
	assert.equal(average([2, 5]), 3.5);
	assert.equal(average([]), 0);
});

test('slug', () => {
	assert.equal(slug('Hello, world!'), 'hello-world');
	assert.equal(
		slug('!@#$%^&*()1234567890-=qwertyuioplkjhgfdsa'),
		'1234567890-qwertyuioplkjhgfdsa'
	);
});