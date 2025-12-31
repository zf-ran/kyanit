import ElementBuilder, { useCSS } from "/js/modules/element-builder.mjs";
import { generateUUID } from '/js/modules/uuid.mjs';

useCSS('/css/partials/toast.css');

/**
 * @param {Object} options
 * @param {string} [options.title]
 * @param {string} options.message
 * @param {number} [options.timeMs] - Defaults to 5000 ms.
 */
function toast({ title, message, timeMs }) {
	if (!message) {
		console.error('Message is required in toasts');
		return;
	}

	const toastContainer =
		document.getElementById('toast-container')
		|| new ElementBuilder('div')
			.id('toast-container')
			.appendTo(document.body);

	timeMs ||= 5_000;

	const toastId = generateUUID();

	const toastElement = new ElementBuilder('div')
		.classes([ 'toast' ])
		.id(`toast-${toastId}`)
		.appendTo(toastContainer);

	toastElement.style.setProperty('--time', `${timeMs}ms`);

	if (title) {
		new ElementBuilder('h4')
			.innerHTML(title)
			.classes([ 'toast-title' ])
			.appendTo(toastElement);
	}

	new ElementBuilder('p')
		.innerHTML(message)
		.classes([ 'toast-message' ])
		.appendTo(toastElement);

	toastElement.classList.add('opening');

	const toastTimeout = setTimeout(closeToast, timeMs);

	toastElement.addEventListener('click', () => {
		closeToast();
	})

	toastElement.addEventListener('animationend', () => {
		if (toastElement.classList.contains('opening'))
			toastElement.classList.remove('opening');

		if (toastElement.classList.contains('closing'))
			toastElement.remove();
	});

	function closeToast() {
		toastElement.classList.add('closing');
		clearTimeout(toastTimeout);
	}
}

export default toast;