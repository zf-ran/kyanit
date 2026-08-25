import dialog from '/js/modules/dialog.mjs';
import toast from '/js/modules/toast.mjs';

//* PUBLIS BUTTON
const permission = JSON.parse(document.getElementById('metadata--permission').textContent);

const publishButton = document.getElementById('publish');

const metaSidebar = document.getElementById('meta-sidebar');

const titleInput = document.getElementById('title');
const keywordsInput = document.getElementById('keywords');
const thumbnailURLInput = document.getElementById('thumbnail-url');
const visibilitySelect = document.getElementById('visibility');

document.addEventListener('keydown', event => {
	if (event.ctrlKey || event.metaKey) {
		switch (event.key.toLowerCase()) {
		case 's':
			event.preventDefault();
			parseAndPublish();
			break;
		case 'b':
			event.preventDefault();
			if (metaSidebar.classList.contains('open'))
				metaSidebar.classList.remove('open');
			else
				metaSidebar.classList.add('open');
			break;
		}
	}
});

if (publishButton) {
	publishButton.addEventListener('click', async () => {
		parseAndPublish();
	});
}

async function parseAndPublish() {
	if (!permission.canPublish) {
		toast({
			title: 'No permission',
			message: "You don't have permission to (re)publish this note",
		});

		return;
	}

	const title = titleInput.value.trim();
	const keywords = keywordsInput.value.trim().match(/\S+/g) ?? [];
	const thumbnailURL = thumbnailURLInput.value.trim();
	const unlisted = visibilitySelect.value === 'unlisted';

	const content = editorInstance.state.doc.toString().trim();

	if (!title) {
		toast({
			title: 'Unnamed?',
			message: 'Give your freshly made note a title',
		});

		return;
	}

	if (!content) {
		toast({
			title: 'Empty?',
			message: 'Write something!',
		});

		return;
	}

	if (thumbnailURL) {
		const thumbnailAllowed = await isThumbnailAllowed(thumbnailURL);
		if (!thumbnailAllowed)
			return;
	}

	publish(title, content, keywords, unlisted, thumbnailURL);
}

/**
 * @param {string} thumbnailURL
 * @returns {boolean}
 */
async function isThumbnailAllowed(thumbnailURL) {
	const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];

	const listFormatter = new Intl.ListFormat('en-US', {
		style: 'long',
		type: 'disjunction',
	});

	const allowedTypesString = listFormatter.format(
		allowedTypes.map(type => `<code>${type}</code>`)
	);

	try {
		const thumbnail = await fetch(thumbnailURL);

		const thumbnailType = thumbnail.headers.get('Content-Type');

		if (!allowedTypes.includes(thumbnailType)) {
			await dialog.alert({
				title: 'Disallowed thumbnail filetype',
				message: `Thumbnail image format <code>${thumbnailType}</code> is not allowed, only ${allowedTypesString}`,
				dismissIcon: 'close',
				dismissText: 'Close',
			});

			return false;
		}

		const thumbnailSize = thumbnail.headers.get('Content-Length');
		const MAX_THUMBNAIL_SIZE = 100_000;

		if (thumbnailSize > MAX_THUMBNAIL_SIZE) {
			await dialog.alert({
				title: 'Keep it low',
				message: `Thumbnail size ${thumbnailSize / 1_000} kB exceeds the ${MAX_THUMBNAIL_SIZE / 1_000} kB limit`,
				dismissIcon: 'close',
				dismissText: 'Close',
			});

			return false;
		}
	} catch (error) {
		toast({
			title: 'Error fetching thumbnail',
			message: error,
		});

		return false;
	}

	return true;
}

/**
 * @returns {"create"|"edit"} Editor mode
 */
function getMode() {
	const path = window.location.pathname.split('/')[1];
	return path;
}

/**
 * 
 * @param {"create"|"edit"} mode
 * @param {string} noteId UUID
 * @param {Headers} headers
 * @param {string} body
 */
function createPublishRequest(mode, noteId, headers, body) {
	switch (mode) {
	case 'create':
		return new Request('/api/notes', {
			method: 'POST',
			headers, body
		});
	case 'edit':
		return new Request(`/api/notes/${noteId}`, {
			method: 'PATCH',
			headers, body
		});
	}
}

/**
 * @param {string} title
 * @param {string} content
 * @param {string[]} keywords
 * @param {boolean} unlisted
 * @param {string} thumbnailURL
 */
async function publish(title, content, keywords, unlisted, thumbnailURL) {
	const mode = getMode();
	const noteId = JSON.parse(document.getElementById('metadata--note-id').textContent);

	const headers = new Headers();
	headers.append('Content-Type', 'application/json');

	const body = JSON.stringify({
		title, content, keywords, unlisted, thumbnailURL
	});

	const request = createPublishRequest(mode, noteId, headers, body);
	const response = await fetch(request);
	const json = await response.json();

	if (!response.ok) {
		await dialog.alert({
			title: 'Error',
			message: json.error,
			dismissIcon: 'close',
			dismissText: 'Close',
		});

		return;
	}

	toast({
		title: 'Published',
		message: `Note published successfully`
	});

	if (mode === 'create')
		location.replace(`/edit/${json.data.id}`);
}

//* VIEW BUTTON
const viewButton = document.getElementById('view');

if (viewButton) {
	const noteId = JSON.parse(document.getElementById('metadata--note-id').textContent);

	viewButton.addEventListener('click', () => {
		window.open(`/note/${noteId}`, '_blank');
	});
}