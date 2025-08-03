// JSH 1

class JSH {
  constructor(tag = 'p', text = '', attributes = {}) {
    this.element = document.createElement(tag);
    this.element.innerHTML = text;

		for (let i = 0; i < Object.keys(attributes).length; i++) {
			const attribute = [Object.keys(attributes)[i], Object.values(attributes)[i]];
			this.element.setAttribute(attribute[0], attribute[1]);
		}
	}

	appendTo(parent = document.body) {
		parent.appendChild(this.element);
		return this.element;
	}
}

function useCSS(filename = '') {
	return (new JSH('link', null, { rel: 'stylesheet', href: filename }).appendTo(document.head));
}

function useJS(filename = '', { type, defer, crossOrigin } = { type: undefined, defer: undefined, crossOrigin: undefined }) {
	let attribute = {};
	attribute.src = filename;
	if(typeof type !== 'undefined') attribute.type = type ?? 'application/javascript';
	if(typeof defer !== 'undefined') attribute.defer = defer ?? false;
	if(typeof crossOrigin !== 'undefined') attribute.crossOrigin = crossOrigin ?? null;

	return (new JSH('script', null, attribute).appendTo(document.head));
}

export default JSH;