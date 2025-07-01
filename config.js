const markedRenderer = {
	heading(text, level) {
		const headingIdRegex = /(?: +|^)\{#(\d|[a-z]|[\w-]*)\}(?: +|$)/i;
		const matches = text.match(headingIdRegex);

		let id;
		if(!matches) return `<h${level} class="heading"><span class="heading-content" data-header="${level}">${text.replace(headingIdRegex, '')}</span></h${level}>`;
		else id = matches[1];

		return `<h${level} class="heading" id="section-${id}"><span class="heading-content" data-header="${level}">${text.replace(headingIdRegex, '')}</span><a href="#section-${id}" class="header-redirect">§</a></h${level}>`;
	},
	code(code, infostring) {
		return `<pre class="code-block"><code class="language-${infostring}">` + code + '</code></pre>';
	},
	image(href, title, text) {
		if(title) return `<img class="simple-image" loading="lazy" alt="${text}" title="${title}" src="${href}">`;
		else return `<img class="simple-image" loading="lazy" alt="${text}" src="${href}">`;
	},
	codespan(text) {
		return `<code>${text}</code>`;
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

module.exports = {
	markedRenderer,
	mathjaxOptions,
	purifyOptions,
	dataConstraints
};