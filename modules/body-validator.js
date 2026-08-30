const supportedPrimitiveTypes = ['string', 'number', 'boolean'];
const supportedReferenceTypes = ['array', 'object', 'url', 'uuid'];

const supportedTypes = [...supportedPrimitiveTypes, ...supportedReferenceTypes];

class Rule {
	/**
	 * @param {"string"|"number"|"boolean"|"array"|"url"|"uuid"} type
	 */
	constructor(type) {
		if (!supportedTypes.includes(type)) {
			throw new Error(`Unsupported type ${type}`);
		}

		this.property = {
			type,
			required: false,
			minLength: null,
			maxLength: null,
			pattern: null,
			allowedValues: null,
			itemRule: null,
			objectSchema: null,
		};
	}

	/** Make this field required */
	required() {
		this.property.required = true;
		return this;
	}

	/** @param {number} length */
	minLength(length) {
		if (isNaN(length))
			length = null;

		this.property.minLength = length;
		return this;
	}

	/** @param {number} length */
	maxLength(length) {
		if (isNaN(length))
			length = null;

		this.property.maxLength = length;
		return this;
	}

	/** @param {RegExp} pattern */
	pattern(pattern) {
		if (!(pattern instanceof RegExp))
			pattern = null;

		this.property.pattern = pattern;
		return this;
	}

	/** Only allow certain values on this field */
	only(...allowedValues) {
		this.property.allowedValues = allowedValues;
		return this;
	}

	/** Don't allow empty string or array in optional fields */
	notEmpty() {
		this.property.minLength = 1;
		return this;
	}

	/**
	 * Validate each item in an array
	 * @param {Rule} rule
	 */
	items(rule) {
		if (!(rule instanceof Rule))
			throw new TypeError('Rule.items() expects a Rule instance');

		this.property.itemRule = rule;
		return this;
	}

	properties(schema) {
		if (!schema || typeof schema !== 'object' || Array.isArray(schema))
			throw new TypeError('Rule.properties() expects a schema object');

		this.property.objectSchema = schema;
		return this;
	}
}

/**
 * @param {any} value
 * @param {Rule} rule
 * @param {string} fieldName
 */
function validateValue(value, rule, fieldName) {
	const options = rule.property;

	if (value === undefined || value === null) {
		if (options.required)
			return `${fieldName} is required`;
		else
			return null;
	}

	//- For reference types
	switch (options.type) {
	case 'array':
		if (!Array.isArray(value))
			return `${fieldName} must be an array`;
		if (options.minLength && value.length < options.minLength)
			return `${fieldName} must have at least ${options.minLength} element(s)`;
		if (options.maxLength && value.length > options.maxLength)
			return `${fieldName} must have at most ${options.maxLength} element(s)`;
		if (options.itemRule) {
			for (const element of value) {
				const error = validateValue(element, options.itemRule, `${fieldName}'s element`);

				if (error)
					return error;
			}
		}
		return null;
	case 'object':
		if (typeof value !== 'object' || Array.isArray(value))
			return `${fieldName} must be an object`;

		if (options.objectSchema) {
			for (const [key, childRule] of Object.entries(options.objectSchema)) {
				const error = validateValue(value[key], childRule, `${fieldName}.${key}`);

				if (error)
					return error;
			}
		}
		return null;
	case 'url':
		if (typeof value !== 'string' || !URL.canParse(value))
			return `${fieldName} must be a valid URL`;
		return null;
	case 'uuid':
		const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (typeof value !== 'string' || !UUID_PATTERN.test(value))
			return `${fieldName} must be a valid UUID`;
		return null;
	}

	//- For primitive types.
	if (typeof value !== options.type)
		return `${fieldName} must be a ${options.type}`;

	// Value whitelist.
	if (options.allowedValues && !options.allowedValues.includes(value))
		return `${fieldName} must be one of [${options.allowedValues.join(', ')}]`;

	switch (options.type) {
	case 'string':
		if (options.minLength && value.length < options.minLength)
			return `${fieldName} must be at least ${options.minLength} character(s) long`;
		if (options.maxLength && value.length > options.maxLength)
			return `${fieldName} must be at most ${options.maxLength} character(s) long`;
		if (options.pattern && !options.pattern.test(value))
			return `${fieldName} does not match the required pattern`;
	case 'number':
		if (Number.isNaN(value))
			return `${fieldName} must be a number`;
	}

	return null;
}

/**
 * @param {Object.<string, Rule>} schema - The schema to validate against.
 * @returns {Function} Middleware function to validate the request body.
 */
function validateBody(schema) {
	return (req, res, next) => {
		if (!req.body)
			return res.status(400).json({ error: 'Request body not found' });

		for (const [key, rule] of Object.entries(schema)) {
			const error = validateValue(req.body[key], rule, key);

			if (error)
				return res.status(400).json({ error });
		}

		next();
	};
}

module.exports = { validateBody, validateValue, Rule };