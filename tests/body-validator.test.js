const test = require('node:test');
const assert = require('node:assert/strict');

const { Rule, validateBody } = require('../modules/body-validator');

//* Rule()
test('Rule constructor accepts valid types', () => {
	const validTypes = ['string', 'number', 'boolean', 'array', 'url', 'uuid'];
	validTypes.forEach(type => {
		const rule = new Rule(type);
		assert.equal(rule.property.type, type);
	});
});

test('Rule constructor throws on invalid type', () => {
	assert.throws(() => {
		new Rule('invalid-type');
	}, /Unsupported type/);
});

test('Rule.required() sets required flag', () => {
	const rule = new Rule('string').required();
	assert.equal(rule.property.required, true);
});

test('Rule.minLength() sets minimum length constraint', () => {
	const rule = new Rule('string').minLength(5);
	assert.equal(rule.property.minLength, 5);
});

test('Rule.minLength() ignores NaN', () => {
	const rule = new Rule('string').minLength(NaN);
	assert.equal(rule.property.minLength, null);
});

test('Rule.maxLength() sets maximum length constraint', () => {
	const rule = new Rule('string').maxLength(10);
	assert.equal(rule.property.maxLength, 10);
});

test('Rule.pattern() sets regex pattern', () => {
	const pattern = /^[a-z]+$/;
	const rule = new Rule('string').pattern(pattern);
	assert.equal(rule.property.pattern, pattern);
});

test('Rule.pattern() ignores non-RegExp', () => {
	const rule = new Rule('string').pattern('not-a-regex');
	assert.equal(rule.property.pattern, null);
});

test('Rule.only() sets allowed values', () => {
	const rule = new Rule('string').only('admin', 'user', 'guest');
	assert.deepEqual(rule.property.allowedValues, ['admin', 'user', 'guest']);
});

test('Rule.notEmpty() sets minLength to 1', () => {
	const rule = new Rule('string').notEmpty();
	assert.equal(rule.property.minLength, 1);
});

test('Rule methods support chaining', () => {
	const rule = new Rule('string')
		.required()
		.minLength(5)
		.maxLength(20)
		.notEmpty();

	assert.equal(rule.property.required, true);
	assert.equal(rule.property.minLength, 1); // notEmpty overwrites
	assert.equal(rule.property.maxLength, 20);
});

//* validateBody()
test('validateBody rejects request without body', () => {
	const schema = { username: new Rule('string') };
	let statusCode, responsePayload;

	const res = {
		status(code) {
			statusCode = code;
			return this;
		},
		json(payload) {
			responsePayload = payload;
		}
	};

	validateBody(schema)({}, res, () => {
		throw new Error('next should not have been called');
	});

	assert.equal(statusCode, 400);
	assert.equal(responsePayload.error, 'Request body not found');
});

test('validateBody rejects missing required field', () => {
	const schema = {
		username: new Rule('string').required()
	};
	let statusCode, responsePayload;

	const res = {
		status(code) {
			statusCode = code;
			return this;
		},
		json(payload) {
			responsePayload = payload;
		}
	};

	validateBody(schema)(
		{ body: {} },
		res,
		() => {
			throw new Error('next should not have been called');
		}
	);

	assert.equal(statusCode, 400);
	assert.equal(responsePayload.error, 'username is required');
});

test('validateBody rejects incorrect type for string', () => {
	const schema = {
		username: new Rule('string').required()
	};
	let statusCode, responsePayload;

	const res = {
		status(code) {
			statusCode = code;
			return this;
		},
		json(payload) {
			responsePayload = payload;
		}
	};

	validateBody(schema)(
		{ body: { username: 123 } },
		res,
		() => {
			throw new Error('next should not have been called');
		}
	);

	assert.equal(statusCode, 400);
	assert.equal(responsePayload.error, 'username must be a string');
});

test('validateBody rejects incorrect type for number', () => {
	const schema = {
		age: new Rule('number').required()
	};
	let statusCode, responsePayload;

	const res = {
		status(code) {
			statusCode = code;
			return this;
		},
		json(payload) {
			responsePayload = payload;
		}
	};

	validateBody(schema)(
		{ body: { age: 'twenty-five' } },
		res,
		() => {
			throw new Error('next should not have been called');
		}
	);

	assert.equal(statusCode, 400);
	assert.equal(responsePayload.error, 'age must be a number');
});

test('validateBody rejects incorrect type for boolean', () => {
	const schema = {
		isActive: new Rule('boolean').required()
	};
	let statusCode, responsePayload;

	const res = {
		status(code) {
			statusCode = code;
			return this;
		},
		json(payload) {
			responsePayload = payload;
		}
	};

	validateBody(schema)(
		{ body: { isActive: 'true' } },
		res,
		() => {
			throw new Error('next should not have been called');
		}
	);

	assert.equal(statusCode, 400);
	assert.equal(responsePayload.error, 'isActive must be a boolean');
});

test('validateBody rejects incorrect type for array', () => {
	const schema = {
		tags: new Rule('array').required()
	};
	let statusCode, responsePayload;

	const res = {
		status(code) {
			statusCode = code;
			return this;
		},
		json(payload) {
			responsePayload = payload;
		}
	};

	validateBody(schema)(
		{ body: { tags: 'not-an-array' } },
		res,
		() => {
			throw new Error('next should not have been called');
		}
	);

	assert.equal(statusCode, 400);
	assert.equal(responsePayload.error, 'tags must be an array');
});

test('validateBody validates string minLength', () => {
	const schema = {
		username: new Rule('string').minLength(5)
	};
	let statusCode, responsePayload;

	const res = {
		status(code) {
			statusCode = code;
			return this;
		},
		json(payload) {
			responsePayload = payload;
		}
	};

	validateBody(schema)(
		{ body: { username: 'abc' } },
		res,
		() => {
			throw new Error('next should not have been called');
		}
	);

	assert.equal(statusCode, 400);
	assert.equal(responsePayload.error, 'username must be at least 5 character(s) long');
});

test('validateBody validates string maxLength', () => {
	const schema = {
		username: new Rule('string').maxLength(5)
	};
	let statusCode, responsePayload;

	const res = {
		status(code) {
			statusCode = code;
			return this;
		},
		json(payload) {
			responsePayload = payload;
		}
	};

	validateBody(schema)(
		{ body: { username: 'toolongusername' } },
		res,
		() => {
			throw new Error('next should not have been called');
		}
	);

	assert.equal(statusCode, 400);
	assert.equal(responsePayload.error, 'username must be at most 5 character(s) long');
});

test('validateBody validates array minLength', () => {
	const schema = {
		tags: new Rule('array').minLength(2)
	};
	let statusCode, responsePayload;

	const res = {
		status(code) {
			statusCode = code;
			return this;
		},
		json(payload) {
			responsePayload = payload;
		}
	};

	validateBody(schema)(
		{ body: { tags: ['one'] } },
		res,
		() => {
			throw new Error('next should not have been called');
		}
	);

	assert.equal(statusCode, 400);
	assert.equal(responsePayload.error, 'tags must have at least 2 element(s)');
});

test('validateBody validates array maxLength', () => {
	const schema = {
		tags: new Rule('array').maxLength(2)
	};
	let statusCode, responsePayload;

	const res = {
		status(code) {
			statusCode = code;
			return this;
		},
		json(payload) {
			responsePayload = payload;
		}
	};

	validateBody(schema)(
		{ body: { tags: ['one', 'two', 'three'] } },
		res,
		() => {
			throw new Error('next should not have been called');
		}
	);

	assert.equal(statusCode, 400);
	assert.equal(responsePayload.error, 'tags must have at most 2 element(s)');
});

test('validateBody validates string pattern', () => {
	const schema = {
		email: new Rule('string').pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
	};
	let statusCode, responsePayload;

	const res = {
		status(code) {
			statusCode = code;
			return this;
		},
		json(payload) {
			responsePayload = payload;
		}
	};

	validateBody(schema)(
		{ body: { email: 'not-an-email' } },
		res,
		() => {
			throw new Error('next should not have been called');
		}
	);

	assert.equal(statusCode, 400);
	assert.equal(responsePayload.error, 'email does not match the required pattern');
});

test('validateBody validates value whitelisting with .only()', () => {
	const schema = {
		role: new Rule('string').only('admin', 'user', 'guest')
	};
	let statusCode, responsePayload;

	const res = {
		status(code) {
			statusCode = code;
			return this;
		},
		json(payload) {
			responsePayload = payload;
		}
	};

	validateBody(schema)(
		{ body: { role: 'superuser' } },
		res,
		() => {
			throw new Error('next should not have been called');
		}
	);

	assert.equal(statusCode, 400);
	assert.equal(responsePayload.error, 'role must be one of [admin, user, guest]');
});

test('validateBody validates URL type', () => {
	const schema = {
		website: new Rule('url').required()
	};
	let statusCode, responsePayload;

	const res = {
		status(code) {
			statusCode = code;
			return this;
		},
		json(payload) {
			responsePayload = payload;
		}
	};

	validateBody(schema)(
		{ body: { website: 'not-a-url' } },
		res,
		() => {
			throw new Error('next should not have been called');
		}
	);

	assert.equal(statusCode, 400);
	assert.equal(responsePayload.error, 'website must be a valid URL');
});

test('validateBody validates UUID type', () => {
	const schema = {
		noteId: new Rule('uuid').required()
	};
	let statusCode, responsePayload;

	const res = {
		status(code) {
			statusCode = code;
			return this;
		},
		json(payload) {
			responsePayload = payload;
		}
	};

	validateBody(schema)(
		{ body: { noteId: 'not-a-uuid' } },
		res,
		() => {
			throw new Error('next should not have been called');
		}
	);

	assert.equal(statusCode, 400);
	assert.equal(responsePayload.error, 'noteId must be a valid UUID');
});

test('validateBody calls next on valid request', () => {
	const schema = {
		username: new Rule('string').required(),
		age: new Rule('number')
	};

	let nextCalled = false;

	const res = {
		status: () => res,
		json: () => res
	};

	validateBody(schema)(
		{ body: { username: 'john', age: 25 } },
		res,
		() => {
			nextCalled = true;
		}
	);

	assert.equal(nextCalled, true);
});

test('validateBody skips undefined optional fields', () => {
	const schema = {
		username: new Rule('string').required(),
		bio: new Rule('string') // optional
	};

	let nextCalled = false;

	const res = {
		status: () => res,
		json: () => res
	};

	validateBody(schema)(
		{ body: { username: 'john' } },
		res,
		() => {
			nextCalled = true;
		}
	);

	assert.equal(nextCalled, true);
});

test('validateBody skips null optional fields', () => {
	const schema = {
		username: new Rule('string').required(),
		bio: new Rule('string') // optional
	};

	let nextCalled = false;

	const res = {
		status: () => res,
		json: () => res
	};

	validateBody(schema)(
		{ body: { username: 'john', bio: null } },
		res,
		() => {
			nextCalled = true;
		}
	);

	assert.equal(nextCalled, true);
});

test('validateBody accepts valid URL', () => {
	const schema = {
		website: new Rule('url')
	};

	let nextCalled = false;

	const res = {
		status: () => res,
		json: () => res
	};

	validateBody(schema)(
		{ body: { website: 'https://example.com' } },
		res,
		() => {
			nextCalled = true;
		}
	);

	assert.equal(nextCalled, true);
});

test('validateBody accepts valid UUID', () => {
	const schema = {
		noteId: new Rule('uuid')
	};

	let nextCalled = false;

	const res = {
		status: () => res,
		json: () => res
	};

	validateBody(schema)(
		{ body: { noteId: '123e4567-e89b-12d3-a456-426614174000' } },
		res,
		() => {
			nextCalled = true;
		}
	);

	assert.equal(nextCalled, true);
});

test('validateBody accepts valid array', () => {
	const schema = {
		tags: new Rule('array').minLength(1).maxLength(5)
	};

	let nextCalled = false;

	const res = {
		status: () => res,
		json: () => res
	};

	validateBody(schema)(
		{ body: { tags: ['javascript', 'node.js'] } },
		res,
		() => {
			nextCalled = true;
		}
	);

	assert.equal(nextCalled, true);
});

test('validateBody accepts whitelisted value', () => {
	const schema = {
		role: new Rule('string').only('admin', 'user', 'guest')
	};

	let nextCalled = false;

	const res = {
		status: () => res,
		json: () => res
	};

	validateBody(schema)(
		{ body: { role: 'admin' } },
		res,
		() => {
			nextCalled = true;
		}
	);

	assert.equal(nextCalled, true);
});

test('validateBody validates multiple fields', () => {
	const schema = {
		username: new Rule('string').required().minLength(3),
		email: new Rule('string').required().pattern(/^.+@.+\..+$/),
		age: new Rule('number')
	};

	let nextCalled = false;

	const res = {
		status: () => res,
		json: () => res
	};

	validateBody(schema)(
		{ body: { username: 'john_doe', email: 'john@example.com', age: 30 } },
		res,
		() => {
			nextCalled = true;
		}
	);

	assert.equal(nextCalled, true);
});
