import JSH from '/js/modules/jsh.mjs';

export function addRipple(element) {
	/** @type {number} - Speed in pixels per second */
	const rippleSpeed = 600;
	element.classList.add('ripple');

	element.addEventListener('mousedown', function (event) {
		const ripple = new JSH('span', null, { class: 'ripple-circle' }).appendTo(this);
		const rect = element.getBoundingClientRect();
		const position = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};

		const size = 2 * Math.max(rect.width, rect.height);
		ripple.style.setProperty('--time', (size / rippleSpeed) + 's');
		ripple.style.setProperty('--size', size + 'px');
		ripple.style.top = position.y + 'px';
		ripple.style.left = position.x + 'px';

		ripple.onanimationend = () => {
			ripple?.remove();
		}
	});
}

window.onload = () => {
	const rippleElements = $$('.ripple');

	for(let i = 0; i < rippleElements.length; i++) {
		addRipple(rippleElements[i]);
	}
}