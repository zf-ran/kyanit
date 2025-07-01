const express = require('express');
const router = express.Router();

const Kyanit = require('../modules/Kyanit');
const { JSONErrorResponse } = Kyanit;

const { generateAccessToken, generateRefreshToken } = require('../modules/token');
const { validateBody, Rule } = require('../modules/bodyValidator');
const { dataConstraints } = require('../config');

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
			return res.status(409).json(new JSONErrorResponse('Username is taken'));
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
			return res.status(404).json(new JSONErrorResponse('Invalid username or password'));
		}

		setAuthCookies(res, username);

		res.sendStatus(204);
	}
);

function setAuthCookies(res, username) {
	// Set the access token cookie.
	const accessToken = generateAccessToken(username);

	res.cookie('accessToken', accessToken, {
		maxAge: accessTokenAge,
		httpOnly: true,
		sameSite: 'strict',
		secure: true
	});

	// Set the refresh token cookie.
	const refreshToken = generateRefreshToken(username);

	res.cookie('refreshToken', refreshToken, {
		maxAge: refreshTokenAge,
		httpOnly: true,
		sameSite: 'strict',
		secure: true
	});
}

module.exports = router;