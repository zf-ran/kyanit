const supportedPrimitiveTypes = ['string', 'number', 'boolean'];
const supportedReferenceTypes = ['array', 'url', 'uuid'];

const supportedTypes = [...supportedPrimitiveTypes, ...supportedReferenceTypes];

class Rule {
	/**
	 * @param {"string"|"number"|"boolean"|"array"|"url"|"uuid"} type
	 */
	constructor(type) {
		if(!supportedTypes.includes(type)) {
			throw new Error(`Unsupported type ${type}`);
		}

		this.property = {
			type,
			required: false,
			minLength: null,
			maxLength: null,
			pattern: null,
			allowedValues: null
		};
	}

	/** Make this field required */
	required() {
		this.property.required = true;
		return this;
	}

	/** @param {number} length */
	minLength(length) {
		if(isNaN(length)) length = null;
		this.property.minLength = length;
		return this;
	}

	/** @param {number} length */
	maxLength(length) {
		if(isNaN(length)) length = null;
		this.property.maxLength = length;
		return this;
	}

	/** @param {RegExp} pattern */
	pattern(pattern) {
		if(!(pattern instanceof RegExp)) pattern = null;
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
}

/**
 * @param {Object.<string, Rule>} schema - The schema to validate against.
 * @returns {Function} Middleware function to validate the request body.
 */
function validateBody(schema) {
	return (req, res, next) => {
		if(!req.body) {
			return res.status(400).json({ error: 'Request body not found' });
		}

		for (const key in schema) {
			const value = req.body[key];
			const rule = schema[key].property;

			if(rule.required && (value === undefined || value === null)) {
				return res.status(400).json({ error: `${key} is required` });
			}

			if(value === undefined || value === null) {
				continue;
			}

			//* Type Checking Below 
			//- For reference types.
			switch (rule.type) {
				case 'array':
					if(!Array.isArray(value))
						return res.status(400).json({ error: `${key} must be an array` });
					if(rule.minLength && value.length < rule.minLength)
						return res.status(400).json({ error: `${key} must have at least ${rule.minLength} element(s)` });
					if(rule.maxLength && value.length < rule.maxLength)
						return res.status(400).json({ error: `${key} must have at most ${rule.maxLength} element(s)` });
					break;
				case 'url':
					if(!URL.canParse(value))
						return res.status(400).json({ error: `${key} must be a valid URL` });
					break;
				case 'uuid':
					if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))
						return res.status(400).json({ error: `${key} must be a valid URL` });
					break;
			} if(supportedReferenceTypes.includes(rule.type)) continue;

			//- For primitive types.
			if(typeof value !== rule.type) {
				return res.status(400).json({ error: `${key} must be a ${rule.type}` });
			}

			// Value whitelist.
			if(rule.allowedValues) {
				if(!rule.allowedValues.includes(value)) {
					return res.status(400).json({ error: `${key} must be one of [${rule.allowedValues.join(', ')}]` });
				}

				continue;
			}

			switch (rule.type) {
				case 'string':
					if(rule.minLength && value.length < rule.minLength)
						return res.status(400).json({ error: `${key} must be at least ${rule.minLength} character(s) long` });
					if(rule.maxLength && value.length > rule.maxLength)
						return res.status(400).json({ error: `${key} must be at most ${rule.maxLength} character(s) long` });
					if(rule.pattern && !rule.pattern.test(value))
						return res.status(400).json({ error: `${key} does not match the required pattern` });
					break;
				case 'number':
					if(isNaN(value))
						return res.status(400).json({ error: `${key} must be a number` });
					break;
			}
		}

		next();
	};
}

module.exports = { validateBody, Rule };