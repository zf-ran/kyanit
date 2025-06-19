const express = require('express');
const router = express.Router();

const Kyanit = require('../modules/Kyanit')
const { JSONErrorResponse } = Kyanit;

const db = require('../modules/database');

//* [ROUTE] /api

router.post('/signup', async (req, res) => {
	if(!req.body) {
		res.status(400).json(new JSONErrorResponse(400, 'No body sent'));
		return;
	}
	
	const { name, password } = req.body;

	if(!name || !password) {
		res.status(400).json(new JSONErrorResponse(400, 'Username and password is required'));
		return;
	}

	if(name.length < 4 || name.length > 16) {
		res.status(400).json(new JSONErrorResponse(400, 'Username should be 4–16 characters'));
		return;
	}

	if(password.length < 4) {
		res.status(400).json(new JSONErrorResponse(400, 'Password must be at least 4 characters'));
		return;
	}

	/** @type {Kyanit.User[]} */
	const users = await db.get('users');

	if(users.find(user => user.name === name)) {
		res.status(409).json(new JSONErrorResponse(409, 'Username is taken'));
		return;
	}

	const user = new Kyanit.User(name, password);

	users.push(user);

	res.cookie('username', name, { maxAge: new Date('9999-12-31T23:46:40.000Z') });
	res.cookie('password', password, { maxAge: new Date('9999-12-31T23:46:40.000Z') });

	await db.set('users', users);

	res.sendStatus(201);
});

router.post('/login', async (req, res) => {
	if(!req.body) {
		res.status(400).json(new JSONErrorResponse(400, 'No body sent'));
		return;
	}

	const { name, password } = req.body;

	if(!name || !password) {
		res.status(400).json(new JSONErrorResponse(400, 'No username or password given'));
	}

	/** @type {Kyanit.User[]} */
	const users = await db.get('users');
	const user = users.find(user => user.name === name);

	if(!user || user.password !== password) {
		res.status(404).json(new JSONErrorResponse(404, 'Invalid username or password'));
		return;
	}

	res.cookie('username', name, { maxAge: new Date('9999-12-31T23:46:40.000Z') });
	res.cookie('password', password, { maxAge: new Date('9999-12-31T23:46:40.000Z') });

	res.sendStatus(204);
});

router.patch('/users', async (req, res) => {
	if(!req.body) {
		res.status(400).json(new JSONErrorResponse(400, 'No body sent'));
		return;
	}

	if(!res.locals.$isLoggedIn) {
		res.status(401).json(new JSONErrorResponse(401, 'No login credentials'));
		return;
	}

	const { username } = req.cookies;

	const { displayName, about, password } = req.body;

	/** @type {Kyanit.User[]} */
	const users = await db.get('users');
	const user = users.find(user => user.name === username);

	if(!user) {
		res.status(404).json(new JSONErrorResponse(404, 'User not found'));
		return;
	}

	if(displayName) user.displayName = displayName;
	if(about !== undefined) user.about = about;
	if(password) {
		user.password = password;
		res.cookie('password', password, { maxAge: new Date('9999-12-31T23:46:40.000Z') });
	}

	await db.set('users', users);

	res.sendStatus(204);
});

module.exports = router;