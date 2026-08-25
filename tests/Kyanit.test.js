const test = require('node:test');
const assert = require('node:assert/strict');

const { isUUID } = require('../modules/utils');

test('uuid validation', () => {
	assert.equal(
		isUUID('123e4567-e89b-12d3-a456-426614174000'),
		true
	);
	assert.equal(
		isUUID('not-a-uuid'),
		false
	);
});