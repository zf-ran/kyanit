function parseCookie(cookieString) {
	return ( 
		cookieString.split(/; */g).reduce((previous, current) => {
			const [name, ...value] = current.split('=');
			previous[name] = value.join('=');
			return previous;
		}, {})
	);
}

module.exports = { parseCookie };