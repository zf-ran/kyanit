import dialog from '/js/modules/dialog.mjs';

const notePanel = document.getElementById('note-panel');

notePanel.addEventListener('click', async event => {
	const anchorElement = event.target.closest('a');

	if (anchorElement && anchorElement.href) {
		const href = anchorElement.getAttribute('href');

		if (href.startsWith('#'))
			return;

		event.preventDefault();

		const userConfirmend = await dialog.confirm({
			title: 'Redirect?',
			message: `Do you want to proceed to <code class="code-span">${anchorElement.href}</code>?`,
			cancelIcon: 'close',
			cancelText: 'No, go back',
			confirmIcon: 'open_in_new',
			confirmText: 'Redirect me'
		});

		if (userConfirmend) {
			if (anchorElement.target === '_blank')
				window.open(anchorElement.href, '_blank');
			else
				window.location.href = anchorElement.href;
		}
	}
});