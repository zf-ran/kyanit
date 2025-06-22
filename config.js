const markedRenderer = {
	heading(text, level) {
		const headingIdRegex = /(?: +|^)\{#(\d|[a-z]|[\w-]*)\}(?: +|$)/i;
		const matches = text.match(headingIdRegex);

		let id;
		if(!matches) return `<h${level} class="heading"><span class="heading-content" data-header="${level}">${text.replace(headingIdRegex, '')}</span></h${level}>`;
		else id = matches[1];

		return `<h${level} class="heading" id="section-${id}"><span class="heading-content" data-header="${level}">${text.replace(headingIdRegex, '')}</span><a href="#section-${id}" class="header-redirect">§</a></h${level}>`;
	},
	code(code, infostring, escaped) {
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

module.exports = { markedRenderer, mathjaxOptions };