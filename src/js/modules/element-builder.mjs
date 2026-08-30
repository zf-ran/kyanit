class ElementBuilder {
  constructor(tag) {
		/** @type {HTMLInputElement} */
    this.element = document.createElement(tag);
	}

	innerHTML(content) {
		this.element.innerHTML = content;
		return this;
	}

	text(content) {
		this.element.innerText = content;
		return this;
	}

	attributes(attributes) {
		for (const [attribute, value] of Object.entries(attributes)) {
			if (typeof value === 'boolean')
				this.element[attribute] = value;
			else
				this.element.setAttribute(attribute, value);
		}

		return this;
	}

	id(id) {
		this.element.id = id;
		return this;
	}

	classes(classes) {
		for (const className of classes) {
			this.element.classList.add(className);
		}

		return this;
	}

	appendTo(parent = document.body) {
		parent.appendChild(this.element);
		return this.element;
	}
}

export function useCSS(path = '') {
	return (
		new ElementBuilder('link')
			.attributes({ rel: 'stylesheet', href: path })
			.appendTo(document.head)
	);
}

export default ElementBuilder;