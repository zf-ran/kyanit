const express = require('express');
const router = express.Router();

const Kyanit = require('../modules/Kyanit');
const { JSONErrorResponse } = Kyanit;
const { validateBody, Rule } = require('../modules/bodyValidator');
const { dataConstraints } = require('../config');

//* [ROUTE] /api

router.patch('/users',
	validateBody({
		displayName: new Rule('string')
			.maxLength(dataConstraints.MAX_DISPLAY_NAME_LENGTH),
		about: new Rule('string')
			.maxLength(dataConstraints.MAX_ABOUT_LENGTH),
		password: new Rule('string')
			.minLength(dataConstraints.MIN_PASSWORD_LENGTH)
	}),
	async (req, res) => {
		if(!res.locals.isLoggedIn) {
			return res.status(401).json(new JSONErrorResponse('No login credentials'));
		}

		const username = res.locals.username;
		const { displayName, about, password } = req.body;

		const users = await req.sql`
			SELECT display_name, about, password
			FROM users
			WHERE name = ${username};
		`;

		const user = users[0];

		if(!user) {
			return res.status(404).json(new JSONErrorResponse('User not found'));
		}

		// Undefined or null means not changes, empty string means literal empty string.
		if(typeof displayName === 'string') user.display_name = displayName;
		if(typeof about === 'string') user.about = about;

		if(password) user.password = password;

		await req.sql`
			UPDATE users
			SET
				display_name = ${user.display_name},
				about = ${user.about},
				password = ${user.password}
			WHERE name = ${username};
		`;

		res.sendStatus(204);
	}
);

module.exports = router;