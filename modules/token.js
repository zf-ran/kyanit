const jwt = require('jsonwebtoken');

const { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } = process.env;

const accessTokenAge = parseInt(process.env.ACCESS_TOKEN_AGE);
const refreshTokenAge = parseInt(process.env.REFRESH_TOKEN_AGE);

// Middleware to validate access token.
function validateToken(req, res, next) {
	const accessToken = req.cookies.accessToken;

	try {
		const decodedAccessToken = jwt.verify(accessToken, JWT_ACCESS_SECRET);

		res.locals.username = decodedAccessToken.username;
		res.locals.isLoggedIn = true;
	} catch (error) {
		try {
			const refreshToken = req.cookies.refreshToken;

			const decodedRefreshToken = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

			// If the refresh token is valid, generate a new access token.
			const username = decodedRefreshToken.username;
			const accessToken = generateAccessToken(username);

			// Set the access token cookie.
			res.cookie('accessToken', accessToken, {
				maxAge: accessTokenAge,
				httpOnly: true,
				sameSite: 'strict',
				secure: true
			});

			res.locals.username = decodedRefreshToken.username;
			res.locals.isLoggedIn = true;
		} catch (error) {
			res.locals.username = null;
			res.locals.isLoggedIn = false;
		}
	}

	next();
}

function generateAccessToken(username) {
	return jwt.sign({ username }, JWT_ACCESS_SECRET, { expiresIn: accessTokenAge });
}

function generateRefreshToken(username) {
	return jwt.sign({ username }, JWT_REFRESH_SECRET, { expiresIn: refreshTokenAge });
}

module.exports = { validateToken, generateAccessToken, generateRefreshToken };