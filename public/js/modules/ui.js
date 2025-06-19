import JSH from '/js/modules/jsh.js';
import { addRipple } from '/js/modules/ripple.js';

const ui = {
	alert({ title, content, timeMs }) {
		if(timeMs === null || isNaN(timeMs)) timeMs = 5_000;
		const id = crypto.randomUUID();
		const alertWrapper = new JSH('div', null, { id: `alert_${id}`, class: 'alert', 'data-time': `${timeMs}` }).appendTo(document.body);
		alertWrapper.style.setProperty('--time', `${timeMs}ms`)
		if(title) { const alertTitle = new JSH('div', title, { class: 'alert--title' }).appendTo(alertWrapper); }
		const alertContent = new JSH('div', content, { class: 'alert--content' }).appendTo(alertWrapper);

		let timeoutId;
		if(timeMs !== 0) timeoutId = setTimeout(close, timeMs);
		alertWrapper.onclick = close;

		function close() {
			alertWrapper.classList.add('removed');
			alertWrapper.addEventListener('transitionend', () => {
				alertWrapper.remove();
			});

			clearTimeout(timeoutId);
		}

		return { id };
	},
	async prompt({ title, inputs }) {
		const id = crypto.randomUUID();

		const promptWrapper = new JSH('div', null, { id: `prompt_${id}`, class: 'prompt-wrapper' }).appendTo(document.body);

		const prompt = new JSH('div', null, { class: 'prompt' }).appendTo(promptWrapper);
		new JSH('div', title, { class: 'prompt--title' }).appendTo(prompt);

		const inputsWrapper = new JSH('div', null, { class: 'prompt--inputs' }).appendTo(prompt);

		for(let i = 0; i < inputs.length; i++) {
			const input = inputs[i];

			const inputWrapper = new JSH('div', null, { class: 'prompt--input' }).appendTo(inputsWrapper);
			new JSH('label', input.label, { class: 'prompt--input--label', for: `input_${input.id}` }).appendTo(inputWrapper);
			let inputElement;

			if(input.type === 'text') {
				inputElement = new JSH('input', null, {
					type: 'text',
					placeholder: input.label,
					id: `input_${input.id}`,
					value: input.default ?? ''
				}).appendTo(inputWrapper);
			} else if(input.type === 'number') {
				inputElement = new JSH('input', null, {
					type: 'number',
					placeholder: input.label,
					id: `input_${input.id}`,
					value: input.default ?? ''
				}).appendTo(inputWrapper);

				if(input.max) inputElement.max = input.max;
				if(input.min) inputElement.min = input.min;

				inputElement.oninput = () => {
					if(inputElement.value === '') return;
					if(inputElement.max && parseFloat(inputElement.value) > inputElement.max) inputElement.value = inputElement.max;
					if(inputElement.min && parseFloat(inputElement.value) < inputElement.min) inputElement.value = inputElement.min;
				};
			}

			if(input.required) inputElement.required = true;
		}

		const buttonWrapper = new JSH('div', null, { class: 'prompt--button' }).appendTo(prompt);
		const confirmButton = new JSH('div', '<i class="fa-solid fa-check"></i> OK', { class: 'prompt--confirm' }).appendTo(buttonWrapper);
		addRipple(confirmButton);
		const cancelButton = new JSH('div', '<i class="fa-solid fa-xmark"></i> Cancel', { class: 'prompt--cancel' }).appendTo(buttonWrapper);
		addRipple(cancelButton);

		let result;

		await new Promise(resolve => {
			confirmButton.onclick = event => {
				result = {};
				for(let i = 0; i < inputs.length; i++) {
					const input = inputs[i];
					if(input.required && !$(`#input_${input.id}`).value) {
						this.alert({ title: 'Error', content: `${input.label} can’t be empty` });
						return;
					}
					result[input.id] = $(`#input_${input.id}`).value;
				}
				close();
				resolve();
			};

			cancelButton.onclick = event => {
				result = {};
				for(let i = 0; i < inputs.length; i++) {
					const input = inputs[i];
					result[input.id] = null;
				}
				close();
				resolve();
			}
		});

		function close() {
			promptWrapper.classList.add('removed');
			promptWrapper.addEventListener('transitionend', () => {
				promptWrapper.remove();
			});
		}

		return result;
	},
	async confirm({ title, content }) {
		const id = crypto.randomUUID();
		const confirmWrapper = new JSH('div', null, { id: `confirm_${id}`, class: 'confirm-wrapper' }).appendTo(document.body);

		const confirm = new JSH('div', null, { class: 'confirm' }).appendTo(confirmWrapper);

		new JSH('div', title, { class: 'confirm--title' }).appendTo(confirm);
		new JSH('div', content, { class: 'confirm--content' }).appendTo(confirm);

		const buttonWrapper = new JSH('div', null, { class: 'prompt--button' }).appendTo(confirm);
		const confirmButton = new JSH('div', '<i class="fa-solid fa-check"></i> OK', { class: 'prompt--confirm ripple' }).appendTo(buttonWrapper);
		addRipple(confirmButton);
		const cancelButton = new JSH('div', '<i class="fa-solid fa-xmark"></i> Cancel', { class: 'prompt--cancel ripple' }).appendTo(buttonWrapper);
		addRipple(cancelButton);

		let result;
		await new Promise(resolve => {
			confirmButton.onclick = () => {
				result = true;
				close();
				resolve();
			};

			cancelButton.onclick = () => {
				result = false;
				close();
				resolve();
			};
		});

		function close() {
			confirmWrapper.classList.add('removed');
			confirmWrapper.addEventListener('transitionend', () => {
				confirmWrapper.remove();
			});
		}

		return result;
	}
};

export default ui;