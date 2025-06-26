const express = require('express');
const router = express.Router();

const Kyanit = require('../modules/Kyanit.js');
const { JSONErrorResponse } = Kyanit;

const { generateAccessToken, generateRefreshToken } = require('../modules/token.js');
const { validateBody, Rule } = require('../modules/validateBody.js');
const { dataConstraints } = require('../config.js');

const accessTokenAge = parseInt(process.env.ACCESS_TOKEN_AGE);
const refreshTokenAge = parseInt(process.env.REFRESH_TOKEN_AGE);

//* [ROUTE] /auth

router.post('/signup',
	validateBody({
		username: new Rule('string')
			.required()
			.minLength(dataConstraints.MIN_USERNAME_LENGTH)
			.maxLength(dataConstraints.MAX_USERNAME_LENGTH),
		password: new Rule('string')
			.required()
			.minLength(dataConstraints.MIN_PASSWORD_LENGTH)
	}),
	async (req, res) => {
		const { username, password } = req.body;

		// Check if the username is already taken.
		const users = await req.sql`SELECT name FROM users WHERE name = ${username}`;

		if(users.length !== 0) {
			res.status(409).json(new JSONErrorResponse('Username is taken'));
			return;
		}

		await req.sql`INSERT INTO users (name, password, display_name) VALUES (${username}, ${password}, ${username})`;

		setAuthCookies(res, username);

		res.sendStatus(201);
	}
);

router.post('/login',
	validateBody({
		username: new Rule('string').required().notEmpty(),
		password: new Rule('string').required().notEmpty()
	}),
	async (req, res) => {
		const { username, password } = req.body;

		/** @type {Kyanit.User[]} */
		const users = await req.sql`SELECT 1 FROM users WHERE name = ${username} AND password = ${password}`;

		if(users.length === 0) {
			res.status(404).json(new JSONErrorResponse('Invalid username or password'));
			return;
		}

		setAuthCookies(res, username);

		res.sendStatus(204);
	}
);

function setAuthCookies(res, username) {
	const accessToken = generateAccessToken(username);

	// Set the access token cookie.
	res.cookie('accessToken', accessToken, {
		maxAge: accessTokenAge,
		httpOnly: true,
		sameSite: 'strict'
	});

	const refreshToken = generateRefreshToken(username);

	// Set the refresh token cookie.
	res.cookie('refreshToken', refreshToken, {
		maxAge: refreshTokenAge,
		httpOnly: true,
		sameSite: 'strict'
	});
}

module.exports = router;