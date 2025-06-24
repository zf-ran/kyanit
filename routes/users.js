const express = require('express');
const router = express.Router();

const Kyanit = require('../modules/Kyanit')
const { JSONErrorResponse } = Kyanit;

//* [ROUTE] /api

router.patch('/users', async (req, res) => {
	if(!req.body) {
		res.status(400).json(new JSONErrorResponse(400, 'No body sent'));
		return;
	}

	if(!res.locals.isLoggedIn) {
		res.status(401).json(new JSONErrorResponse(401, 'No login credentials'));
		return;
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
		res.status(404).json(new JSONErrorResponse(404, 'User not found'));
		return;
	}

	if(password && typeof password === 'string' && password.length < 4) {
		res.status(400).json(new JSONErrorResponse(400, 'Password must be at least 4 characters long'));
		return;
	}

	if(displayName && typeof displayName === 'string') user.display_name = displayName;
	if(about !== undefined && typeof about === 'string') user.about = about;
	if(password && typeof password === 'string') user.password = password;

	await req.sql`
		UPDATE users
		SET
			display_name = ${user.display_name},
			about = ${user.about},
			password = ${user.password}
		WHERE name = ${username};
	`;

	res.sendStatus(204);
});

module.exports = router;