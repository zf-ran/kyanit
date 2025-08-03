const Marked = require('marked');

const markedRenderer = {
	heading({ text, depth, tokens }) {
		const headingIdRegex = /(?: +|^)\{#(\d|[a-z]|[\w-]*)\}(?: +|$)/i;
		const matches = text.match(headingIdRegex);
		let id;

		for(let i = 0; i < tokens.length; i++) {
			const token = tokens[i];
			token.text = token.text.replace(headingIdRegex, '');
		}

		if(!matches) return `<h${depth} class="heading"><span class="heading-content" data-header="${depth}">${Marked.Parser.parseInline(tokens)}</span></h${depth}>`;
		else id = matches[1];

		text = text.replace(headingIdRegex, '');

		return `<h${depth} class="heading has-link" id="section-${id}"><span class="heading-content" data-header="${depth}">${Marked.Parser.parseInline(tokens)}</span> <a href="#section-${id}" class="link"><span class="material-symbols-outlined">link</span></a></h${depth}>`;
	},
	code({ text, lang, raw }) {
		if(lang) return `<pre class="code-block"><code class="language-${lang}">${escapeHTML(text)}</code></pre>`;
		return `<pre class="code-block"><code>${escapeHTML(text)}</code></pre>`;
	},
	image({ href, title, text }) {
		if(title) return `<img loading="lazy" alt="${text}" title="${title}" src="${href}">`;
		return `<img loading="lazy" alt="${text}" src="${href}">`;
	},
	codespan({ text }) {
		return `<code class="code-span">${escapeHTML(text)}</code>`;
	},
	link({ href, title, text }) {
		if(title) return `<a class="anchor" title="${title}" href="${href}">${text}</a>`;
		return `<a class="anchor" href="${href}">${text}</a>`;
	}
};

const mathjaxOptions = {
	format: [ 'TeX' ],
	singleDollars: true,
	MathJax: {
		loader: { load: [ 'input/tex', 'output/svg', '[tex]/ams' ] },
		tex: {
			inlineMath: [['$', '$'], ['\\(', '\\)']],
			packages: { '[+]': ['ams'] }
		},
		options: {
			ignoreHtmlClass: 'code-text',
			renderActions: {
				addMenu: []
			}
		},
		svg: { mtextInheritFont: true },
		showMathMenu: false
	}
};

const purifyOptions = { ADD_TAGS: ['fn'], ADD_ATTR: ['note'] };

const dataConstraints = {
	MIN_USERNAME_LENGTH: 4,
	MAX_USERNAME_LENGTH: 16,
	MIN_PASSWORD_LENGTH: 8,
	MAX_DISPLAY_NAME_LENGTH: 24,
	MAX_ABOUT_LENGTH: 5_000,
	MAX_NOTE_TITLE_LENGTH: 100,
	MAX_NOTE_CONTENT_LENGTH: 100_000,
	MAX_COMMENT_LENGTH: 500
};

Object.freeze(dataConstraints);

/**
 * @param {string} string
 * @returns string
 */
function escapeHTML(string) {
	return string.replace(
			/[^0-9A-Za-z ]/g,
			char => "&#" + char.charCodeAt(0) + ";"
	);
}

module.exports = {
	markedRenderer,
	mathjaxOptions,
	purifyOptions,
	dataConstraints
};