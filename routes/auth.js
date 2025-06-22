const express = require('express');
const router = express.Router();

const Kyanit = require('../modules/Kyanit.js');
const { JSONErrorResponse } = Kyanit;

const { generateAccessToken, generateRefreshToken } = require('../modules/token.js');

const accessTokenAge = parseInt(process.env.ACCESS_TOKEN_AGE);
const refreshTokenAge = parseInt(process.env.REFRESH_TOKEN_AGE);

//* [ROUTE] /auth

router.post('/signup', async (req, res) => {
	if(!req.body) {
		res.status(400).json(new JSONErrorResponse(400, 'No body sent'));
		return;
	}
	
	const { username, password } = req.body;

	if(!username || !password) {
		res.status(400).json(new JSONErrorResponse(400, 'Username and password is required'));
		return;
	}

	if(username.length < 4 || username.length > 16) {
		res.status(400).json(new JSONErrorResponse(400, 'Username should be 4–16 characters'));
		return;
	}

	if(password.length < 4) {
		res.status(400).json(new JSONErrorResponse(400, 'Password must be at least 4 characters'));
		return;
	}

	// Check if the username is already taken.
	const users = await req.sql`SELECT name FROM users WHERE name = ${username}`;

	if(users.length !== 0) {
		res.status(409).json(new JSONErrorResponse(409, 'Username is taken'));
		return;
	}

	await req.sql`INSERT INTO users (name, password, display_name) VALUES (${username}, ${password}, ${username}) RETURNING *`;

	setAuthCookies(res, username);

	res.sendStatus(201);
});

router.post('/login', async (req, res) => {
	if(!req.body) {
		res.status(400).json(new JSONErrorResponse(400, 'No body sent'));
		return;
	}

	const { username, password } = req.body;

	if(!username || !password) {
		res.status(400).json(new JSONErrorResponse(400, 'No username or password given'));
		return;
	}

	/** @type {Kyanit.User[]} */
	const users = await req.sql`SELECT 1 FROM users WHERE name = ${username} AND password = ${password}`;

	if(users.length === 0) {
		res.status(404).json(new JSONErrorResponse(404, 'Invalid username or password'));
		return;
	}

	setAuthCookies(res, username);

	res.sendStatus(204);
});

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