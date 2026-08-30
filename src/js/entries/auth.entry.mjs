const mode = JSON.parse(document.getElementById('metadata--mode').textContent);

const form = document.getElementById('signup-form');
const messageSpan = document.getElementById('message');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const submitButton = document.getElementById('signup-submit');

form.addEventListener('submit', submit);

async function submit(event) {
	event.preventDefault();

	messageSpan.innerText = '';
	input('disabled');

	const inputs = {
		username: usernameInput.value,
		password: passwordInput.value
	};

	const headers = new Headers();
	headers.append('Content-Type', 'application/json');

	const response = await fetch(`/auth/${mode}`, {
		method: 'POST',
		headers,
		body: JSON.stringify(inputs),
	});

	if (!response.ok) {
		// Handle invalid requests.
		const json = await response.json();

		messageSpan.innerText = titleCase(json.error);
		input('enabled');
	} else {
		// Success.
		if (mode === 'signup')
			document.getElementById('form-title').innerHTML = '<span class="material-symbols-outlined">check</span> Signed in!';
		else if (mode === 'login')
			document.getElementById('form-title').innerHTML = '<span class="material-symbols-outlined">check</span> Logged in!';

		location.assign(`/user/${inputs.username}`);
	}
}

/**
 * @param {'enabled'|'disabled'} mode
 */
function input(mode) {
	const isEnabled = mode === 'enabled';

	usernameInput.disabled = !isEnabled;
	passwordInput.disabled = !isEnabled;
	submitButton.disabled = !isEnabled;
}

/**
 * @param {string} string - The string to make as title case
 * @returns {string}
 */
function titleCase(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}