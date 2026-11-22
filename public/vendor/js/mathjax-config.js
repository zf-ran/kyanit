MathJax = {
	loader: {
		load: ['[tex]/ams', '[tex]/mathtools'],
		paths: {
			mathjax: '/dist/mathjax',
			fonts: '/dist/@mathjax',
		},
	},
	tex: {
		inlineMath: [['$', '$'], ['\\(', '\\)']],
		packages: {
			'[+]': ['ams', 'mathtools'],
		},
		tags: 'ams',
	},
	options: {
		ignoreHtmlClass: 'code-text',
		enableMenu: false,
	},
	output: {
		font: 'mathjax-fira',
	},
	chtml: { mtextInheritFont: true },
};