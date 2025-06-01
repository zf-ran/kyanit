// userInformation: string
function encodeUserInformation(userInformation) {
	return (
		userInformation
			.replace(/</g, '&lt;')
			.replace(/</g, '&gt;')
	);
}

function decodeUserInformation(userInformation) {
	return (
		userInformation
			.replace(/\n/g, '<br>')
	);
}

module.exports = { encodeUserInformation, decodeUserInformation };