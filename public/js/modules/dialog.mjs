import ElementBuilder, { useCSS } from '/js/modules/element-builder.mjs';
import { generateUUID } from '/js/modules/uuid.mjs';

useCSS('/css/partials/dialog.css');

/**
 * @typedef {Object} FormField
 * @property {string} name - Key used in the returned result object. Looks like, `formData[<name>]`.
 * @property {string} label - Human-readable label.
 * @property {"text"|"password"|"number"} type
 * @property {*} [defaultValue]
 * @property {boolean} [required]
 * @property {string} [icon]
 */

const dialog = {
	/**
	 * @param {Object} options
	 * @param {string} options.title
	 * @param {string} [options.message]
	 * @param {string | null} [options.dismissIcon] - Icon for the dismiss button.
	 * @param {string} [options.dismissText] - Text for the dismiss button. Defaults to “Dismiss”
	 */
	alert({ title, message, dismissIcon, dismissText }) {
		if (!title) {
			console.error('Title is required in alerts.');
			return;
		}

		const {
			element: dialogElement,
			menu: menuElement
		} = createDialog({ title, message });

		dismissText ??= 'Dismiss';

		const dismissButton = createButton({
			icon: dismissIcon,
			text: dismissText,
			type: 'primary' }).appendTo(menuElement);

		// Closing
		dismissButton.addEventListener('click', () => {
			dialogElement.classList.add('closing');
		});
	},
	/**
	 * Yes/no prompts.
	 * @returns {boolean}
	 * @param {Object} options
	 * @param {string} options.title
	 * @param {string} [options.message]
	 * @param {string | null} [options.cancelIcon] - Icon for the cancel button.
	 * @param {string} [options.cancelText] - Text for the cancel button. Defaults to “Cancel”.
	 * @param {string | null} [options.confirmIcon] - Icon for the confirm button.
	 * @param {string} [options.confirmText] - Text for the confirm button. Defaults to “Yes”.
	 * @param {boolean} [destructive] - Defaults to `false`.
	 */
	async confirm({
		title,
		message,
		confirmIcon, confirmText,
		cancelIcon, cancelText,
		destructive
	}) {
		if (!title) {
			console.error('Title is required in confirmations.');
			return;
		}

		const {
			element: dialogElement,
			menu: menuElement
		} = createDialog({ title, message });

		if (destructive)
			dialogElement.classList.add('destructive');

		cancelText ??= 'Cancel';
		confirmText ??= 'Yes';

		const cancelButton = createButton({
			icon: cancelIcon,
			text: cancelText,
			type: 'secondary' }).appendTo(menuElement);

		const confirmButton = createButton({
			icon: confirmIcon,
			text: confirmText,
			type: 'primary' }).appendTo(menuElement);

		// Closing
		return new Promise(resolve => {
			cancelButton.addEventListener('click', () => {
				resolve(false);
				dialogElement.classList.add('closing');
			});

			confirmButton.addEventListener('click', () => {
				resolve(true);
				dialogElement.classList.add('closing');
			});
		})
	},
	/**
	 * @returns {Boolean}
	 * @param {Object} options
	 * @param {string} options.title
	 * @param {string} [options.message]
	 * @param {string | null} [options.cancelIcon] - Icon for the cancel button.
	 * @param {string} [options.cancelText] - Text for the cancel button. Defaults to “Cancel”.
	 * @param {string | null} [options.confirmIcon] - Icon for the confirm button.
	 * @param {string} [options.confirmText] - Text for the confirm button. Defaults to “Yes”.
	 * @param {FormField[]} options.inputs
	 */
	async form({
		title,
		message,
		confirmIcon, confirmText,
		cancelIcon, cancelText,
		fields
	}) {
		if (!title) {
			console.error('Title is required in forms.');
			return;
		}

		const {
			id: dialogId,
			element: dialogElement,
			menu: menuElement
		} = createDialog({ title, message });

		cancelText ??= 'Cancel';
		confirmText ??= 'Yes';

		const cancelButton = createButton({
			icon: cancelIcon,
			text: cancelText,
			type: 'secondary' }).appendTo(menuElement);

		const confirmButton = createButton({
			icon: confirmIcon,
			text: confirmText,
			type: 'primary' }).appendTo(menuElement);

		const formElement = new ElementBuilder('form')
			.id(`dialog-${dialogId}-form`)
			.attributes({
				method: 'dialog'
			})
			.element;

		menuElement.before(formElement);

		// Fields
		const fieldsContainer = new ElementBuilder('div')
			.classes([ 'dialog-inputs' ])
			.appendTo(formElement);

		for (const field of fields) {
			const fieldId = generateUUID();

			const fieldElement = new ElementBuilder('div')
				.classes([ 'input-wrapper' ])
				.id(`input-wrapper-${field.name}`)
				.appendTo(fieldsContainer);

			if (field.icon) {
				new ElementBuilder('span')
					.classes([ 'material-symbols-outlined', 'input-icon' ])
					.text(field.icon)
					.appendTo(fieldElement);
			}

			const labelElement = new ElementBuilder('label')
				.attributes({
					for: `input-${fieldId}`
				})
				.appendTo(fieldElement);

			new ElementBuilder('span')
				.classes([ 'input-label' ])
				.text(field.label)
				.appendTo(labelElement);

			field.required ??= false;

			const inputElement = new ElementBuilder('input')
				.id(`input-${fieldId}`)
				.attributes({
					type: field.type,
					name: field.name,
					required: field.required,
					placeholder: field.label
				})
				.appendTo(labelElement);

			if (typeof field.defaultValue !== 'undefined')
				inputElement.defaultValue = field.defaultValue;
		}

		// Closing
		return new Promise(resolve => {
			cancelButton.addEventListener('click', () => {
				resolve(null);
				dialogElement.classList.add('closing');
			});

			confirmButton.addEventListener('click', () => {
				const formData = new FormData(formElement);

				const data = {};

				for (const [key, value] of formData)
					data[key] = value;

				let fieldsIsValid = true;

				for (const field of fields) {
					let value = data[field.name];

					const fieldElement = document.getElementById(`input-wrapper-${field.name}`);

					const {
						newValue,
						isValid,
						errorMessage
					} = parseField(field, value);

					if (!isValid)
						fieldElement.dataset.errorMessage = errorMessage;
					else
						fieldElement.dataset.errorMessage = '';

					fieldsIsValid &&= isValid;

					data[field.name] = newValue;
				}

				if (!fieldsIsValid) return;

				resolve(data);

				dialogElement.classList.add('closing');
			});
		})
	}
}

/**
 * @param {Object} options
 * @param {string} options.title
 * @param {string} [options.message]
 */
function createDialog({
	title, message
}) {
	const dialogId = generateUUID();

	const dialogElement = new ElementBuilder('dialog')
		.id(`dialog-${dialogId}`)
		.classes([ 'dialog-alert' ])
		.attributes({
			role: 'dialog',
			'aria-labelledby': `dialog-${dialogId}-title`,
			'aria-modal': true
		})
		.appendTo(document.body);

	const headingElement = new ElementBuilder('div')
		.classes([ 'dialog-heading' ])
		.appendTo(dialogElement);

	// Title
	new ElementBuilder('h2')
		.innerHTML(title)
		.classes([ 'dialog-title' ])
		.id(`dialog-${dialogId}-title`)
		.appendTo(headingElement);

	// Message
	if (message) {
		new ElementBuilder('p')
			.innerHTML(message)
			.classes([ 'dialog-message' ])
			.appendTo(headingElement);
	}

	// Buttons
	const menuElement = new ElementBuilder('menu')
		.appendTo(dialogElement);

	dialogElement.addEventListener('keydown', event => {
		if (event.key === 'Escape')
			event.preventDefault();
	});

	// Open and close event
	dialogElement.addEventListener('animationend', () => {
		if (dialogElement.classList.contains('opening'))
			dialogElement.classList.remove('opening');

		if (dialogElement.classList.contains('closing')) {
			dialogElement.classList.remove('closing');
			dialogElement.close();
			dialogElement.remove();
		}
	});

	// Opening
	dialogElement.showModal();
	dialogElement.classList.add('opening');

	// Closing is handled by each type of dialog

	return { id: dialogId, element: dialogElement, menu: menuElement };
}

/**
 * @returns {ElementBuilder}
 * @param {Object} options
 * @param {string} [options.icon]
 * @param {string} [options.text]
 * @param {"primary"|"secondary"} options.type
 */
function createButton({
	icon, text, type
}) {
	const button = new ElementBuilder('button')
		.attributes({
			type: 'button'
		});

	if (!text) {
		button.element.classList.add('icon');
	}

	switch (type) {
		case 'primary':
			button.element.classList.add('primary');
			break;
		case 'secondary':
			button.element.classList.add('secondary');
			break;
	}

	if (!icon)
		button.element.innerHTML = `${text}`;
	else
		button.element.innerHTML = `<span class="material-symbols-outlined">${icon}</span> ${text}`;

	return button;
}

/**
 * @param {FormField} field
 * @param {*} value
 */
function parseField(field, value) {
	const feedback = {
		newValue: value,
		errorMessage: null,
		isValid: true
	};

	switch (field.type) {
		case 'number':
			if (!value) {
				if (field.required) {
					feedback.errorMessage = `This field must be a number!`;
					feedback.isValid = false;
				} else {
					feedback.newValue = null;
				}
			} else {
				feedback.newValue = parseFloat(value);
			}
			break;
		case 'text':
		case 'password':
			if (!value.trim() && field.required) {
				feedback.errorMessage = `This field is requied!`;
				feedback.isValid = false;
			}
			break;
	}

	return feedback;
}

export default dialog;